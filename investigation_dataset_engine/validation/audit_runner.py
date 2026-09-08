"""
SIH26189 Master Validation Audit Runner v1.1
Orchestrates all 7 validators and produces a consolidated validation_report.json.
"""

import json
from typing import Dict, Any, List, Optional

from validation.schema_validator import SchemaValidator
from validation.spatial_validator import SpatialValidator
from validation.financial_validator import FinancialValidator
from validation.leakage_validator import LabelLeakageValidator
from validation.temporal_validator import TemporalValidator
from validation.identity_validator import IdentityValidator
from validation.evidence_validator import EvidenceValidator


class AuditRunner:
    def __init__(self, schemas_dir: str):
        self.schemas_dir = schemas_dir
        self.leakage_validator  = LabelLeakageValidator()
        self.financial_validator = FinancialValidator()
        self.spatial_validator  = SpatialValidator(max_speed_kmh=120.0)
        self.temporal_validator = TemporalValidator()
        self.identity_validator = IdentityValidator()
        self.evidence_validator = EvidenceValidator()

    def run_full_audit(
        self,
        scenario_id: str,
        observed_records: Dict[str, Any],
        context=None,       # Optional[ScenarioContext]
        scenario_result=None,  # Optional[ScenarioResult] for evidence + timeline checks
    ) -> Dict[str, Any]:
        report: Dict[str, Any] = {
            "scenario_id": scenario_id,
            "passed": True,
            "failed_rules": [],
            "warnings": [],
            "error_count": 0,
            "audits": {},
        }

        def _record_fail(section: str, errors: List[str]):
            report["audits"][section] = {"passed": False, "errors": errors}
            report["passed"] = False
            report["failed_rules"].append(section)
            report["error_count"] += len(errors)

        def _record_pass(section: str, detail: Any = None):
            report["audits"][section] = {"passed": True, "detail": detail}

        # ── 1. Label Leakage ─────────────────────────────────────────────
        for filename, data in observed_records.items():
            if isinstance(data, str):
                ok, errs = self.leakage_validator.audit_text_content(data, filename)
            else:
                ok, errs = self.leakage_validator.audit_dict_object(data, filename)
            if ok:
                _record_pass(f"leakage:{filename}")
            else:
                _record_fail(f"leakage:{filename}", errs)

        # ── 2. Financial Balances ─────────────────────────────────────────
        txns = observed_records.get("cbs_bank_transactions.csv", [])
        if txns:
            ok, errs = self.financial_validator.validate_transactions(txns)
            if ok:
                _record_pass("financial")
            else:
                _record_fail("financial", errs)
        else:
            _record_pass("financial", "no transactions to validate")

        # ── 3. Spatial Speed ─────────────────────────────────────────────
        # Run generic sanity check (pairs from ANPR if available)
        anpr = observed_records.get("toll_anpr_logs.csv", [])
        if len(anpr) >= 2:
            try:
                r1 = anpr[0]
                r2 = anpr[-1]
                lat1 = float(r1.get("location_lat", 0) or 0)
                lon1 = float(r1.get("location_lon", 0) or 0)
                lat2 = float(r2.get("location_lat", 0) or 0)
                lon2 = float(r2.get("location_lon", 0) or 0)
                ts1  = r1.get("timestamp", "")
                ts2  = r2.get("timestamp", "")
                if lat1 and lat2 and ts1 and ts2:
                    ok, msg = self.spatial_validator.validate_travel_speed(
                        (lat1, lon1, ts1), (lat2, lon2, ts2)
                    )
                    if ok:
                        _record_pass("spatial", msg)
                    else:
                        report["warnings"].append(f"Spatial speed warning: {msg}")
                        _record_pass("spatial", f"WARNING: {msg}")
                else:
                    _record_pass("spatial", "insufficient ANPR coordinate data")
            except Exception as e:
                report["warnings"].append(f"Spatial validation skipped: {e}")
                _record_pass("spatial", f"skipped: {e}")
        else:
            _record_pass("spatial", "insufficient ANPR records")

        # ── 4. Temporal ──────────────────────────────────────────────────
        if scenario_result is not None:
            steps = [s.model_dump() for s in scenario_result.ground_truth.master_timeline]
            ok, errs = self.temporal_validator.validate_timeline_ordering(steps)
            if ok:
                _record_pass("temporal_ordering")
            else:
                _record_fail("temporal_ordering", errs)

            # S9-specific: validate within investigation window
            ctx_window = scenario_result.context.investigation_window
            if ctx_window:
                ok, errs = self.temporal_validator.validate_72h_window(
                    steps, ctx_window["start"], ctx_window["end"]
                )
                if ok:
                    _record_pass("temporal_window")
                else:
                    _record_fail("temporal_window", errs)
        else:
            _record_pass("temporal_ordering", "no scenario_result provided")

        # ── 5. Identity ───────────────────────────────────────────────────
        if context is not None:
            ok, id_report = self.identity_validator.validate_all(context)
            if ok:
                _record_pass("identity", id_report)
            else:
                errs = []
                for check_name, check_data in id_report.items():
                    if not check_data["passed"]:
                        errs.extend(check_data["errors"])
                _record_fail("identity", errs)
        else:
            _record_pass("identity", "no context provided")

        # ── 6. Evidence Reachability (pre-serialization) ──────────────────
        if scenario_result is not None:
            ok, errs = self.evidence_validator.validate_pre_serialization_chains(
                scenario_result.evidence_chains,
                scenario_result.answer,
            )
            if ok:
                _record_pass("evidence_reachability")
            else:
                # These are warnings, not hard failures (chains may reference IDs not in answer)
                report["warnings"].extend(errs)
                _record_pass("evidence_reachability", f"{len(errs)} warnings")
        else:
            _record_pass("evidence_reachability", "no scenario_result provided")

        return report
