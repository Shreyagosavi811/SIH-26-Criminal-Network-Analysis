"""
SIH26189 Master Dataset Generation Pipeline Engine v1.1

Execution path:
  run_engine.py → DatasetEngine → Scenario Router → ScenarioResult
  → DataDrivenSerializer → NoiseEngine → Validators → Reports

Replaces the old Scenario-10-only pipeline completely.
"""

import os
import json
import csv
from typing import Dict, Any, List, Optional, Union

from generator.scenarios.router import build_scenario, build_all_scenarios, IMPLEMENTED_SCENARIOS
from generator.scenarios.base import ScenarioResult
from generator.attributes import DemographicSynthesizer
from generator.data_serializer import DataDrivenSerializer
from generator.noise import NoiseEngine
from validation.audit_runner import AuditRunner

# Target observed records per scenario at each scale
SCALE_TARGETS = {
    "mvp":   400,
    "demo":  800,
    "final": 5000,
}


class DatasetEngine:
    def __init__(
        self,
        base_dir: str = "d:/Antigravity/SIH26189/investigation_dataset_engine",
        seed: int = 26189,
        noise_level: int = 3,
        scale: str = "mvp",
    ):
        self.base_dir    = base_dir
        self.seed        = seed
        self.noise_level = noise_level
        self.scale       = scale

        self.output_dir   = os.path.join(base_dir, "output")
        self.gt_dir       = os.path.join(self.output_dir, "GROUND_TRUTH")
        self.obs_dir      = os.path.join(self.output_dir, "OBSERVED")
        self.queries_dir  = os.path.join(self.output_dir, "QUERIES")
        self.answers_dir  = os.path.join(self.output_dir, "ANSWERS")
        self.reports_dir  = os.path.join(self.output_dir, "REPORTS")

        self.audit_runner = AuditRunner(
            schemas_dir=os.path.join(base_dir, "schemas")
        )

    # ── Public API ────────────────────────────────────────────────────────────

    def run_scenario(self, scenario_id: Union[int, str]) -> Dict[str, Any]:
        """
        Run a single scenario by number (1–10) or 'all'.
        Raises ValueError for unknown scenario IDs.
        """
        self._ensure_directories()

        if str(scenario_id).lower() == "all":
            return self.run_all_scenarios()

        sid = int(scenario_id)
        if sid not in IMPLEMENTED_SCENARIOS:
            raise ValueError(
                f"Scenario {sid} is not implemented. "
                f"Valid scenarios: {IMPLEMENTED_SCENARIOS}"
            )
        return self._run_one(sid)

    def run_all_scenarios(self) -> Dict[str, Any]:
        """Run all 10 scenarios and return consolidated statistics."""
        self._ensure_directories()
        all_stats = {}
        for sid in IMPLEMENTED_SCENARIOS:
            stats = self._run_one(sid)
            all_stats[f"S{sid:02d}"] = stats
        # Write consolidated report
        with open(os.path.join(self.reports_dir, "all_scenarios_stats.json"), "w") as f:
            json.dump(all_stats, f, indent=2)
        return all_stats

    # ── Core pipeline ─────────────────────────────────────────────────────────

    def _run_one(self, scenario_id: int) -> Dict[str, Any]:
        """Full pipeline for one scenario."""
        # STAGE 1–3: Build ground truth + context
        result: ScenarioResult = build_scenario(
            scenario_id,
            seed=self.seed,
            scale=self.scale,
            noise_level=self.noise_level,
        )
        sid_str = f"S{scenario_id:02d}"

        # STAGE 4: DataDrivenSerializer
        target = SCALE_TARGETS.get(self.scale, 400)
        serializer = DataDrivenSerializer(result.context, target_total=target)

        firs          = serializer.serialize_cctns_fir()
        criminal_hist = serializer.serialize_criminal_history()
        cdrs          = serializer.serialize_telecom_cdr()
        cafs          = serializer.serialize_telecom_caf()
        bank_txns     = serializer.serialize_cbs_bank_transactions()
        fiu_alerts    = serializer.serialize_fiu_str_alerts()
        anpr_logs     = serializer.serialize_toll_anpr()
        tower_dumps   = serializer.serialize_cell_tower_dumps()
        osint_posts   = serializer.serialize_osint_social()
        field_notes   = serializer.serialize_field_notes()

        # STAGE 5: Noise injection (scaled to approximate target ratio)
        noise_engine = NoiseEngine(seed=self.seed + scenario_id, noise_level=self.noise_level)

        # Count clean records before noise (tower dump phone counts aren't records)
        clean_count = (
            len(firs) + len(criminal_hist) + len(cdrs) + len(cafs) +
            len(bank_txns) + len(fiu_alerts) + len(anpr_logs) +
            len(tower_dumps) + len(osint_posts) + 1  # +1 for field_notes
        )
        noise_engine.set_clean_record_count(clean_count)

        # Compute how many new noise records to inject per mechanism
        T = noise_engine.target_ratio
        total_noise_needed = max(1, round(clean_count * T / (1 - T))) if T < 1.0 else clean_count
        # Distribute noise budget across 4 new-record mechanisms
        per_mechanism = max(1, total_noise_needed // 4)

        tower_dumps       = noise_engine.inject_spatial_overlap(tower_dumps)
        cafs              = noise_engine.inject_name_collisions(cafs, count=per_mechanism)
        anpr_logs         = noise_engine.inject_ocr_typos(anpr_logs)
        cdrs              = noise_engine.inject_recycled_sims(cdrs, count=per_mechanism)
        bank_txns         = noise_engine.inject_benign_financials(bank_txns, count=per_mechanism * 2)
        field_notes, cdrs = noise_engine.inject_distractor_subgraph(field_notes, cdrs)

        # Tally record counts (post-noise)
        total_observed = (
            len(firs) + len(criminal_hist) + len(cdrs) + len(cafs) +
            len(bank_txns) + len(fiu_alerts) + len(anpr_logs) +
            len(tower_dumps) + len(osint_posts) + 1  # +1 for field_notes file
        )
        noise_stats = noise_engine.get_statistics(total_observed_records=total_observed)

        # STAGE 6: Validation
        observed_dict = {
            "cctns_fir_records.json":       firs,
            "criminal_history_db.json":     criminal_hist,
            "telecom_cdr_logs.csv":         cdrs,
            "telecom_caf_kyc.json":         cafs,
            "cbs_bank_transactions.csv":    bank_txns,
            "fiu_str_alerts.json":          fiu_alerts,
            "toll_anpr_logs.csv":           anpr_logs,
            "cell_tower_dumps.json":        tower_dumps,
            "osint_social_posts.json":      osint_posts,
            "field_intelligence_notes.txt": field_notes,
        }

        validation_report = self.audit_runner.run_full_audit(
            scenario_id=sid_str,
            observed_records=observed_dict,
            context=result.context,
            scenario_result=result,
        )

        if not validation_report["passed"]:
            raise ValueError(
                f"Pipeline Audit Failed for {sid_str}! "
                f"Errors: {json.dumps(validation_report['failed_rules'], indent=2)}"
            )

        # STAGE 7: Export Ground Truth (PRIVATE — not in OBSERVED/)
        gt_scenario_dir = os.path.join(self.gt_dir, sid_str)
        os.makedirs(gt_scenario_dir, exist_ok=True)
        with open(os.path.join(gt_scenario_dir, "ground_truth_manifest.json"), "w", encoding="utf-8") as f:
            f.write(result.ground_truth.model_dump_json(indent=2))

        # Export hard negatives + evidence chains + alt hypotheses
        import dataclasses
        with open(os.path.join(gt_scenario_dir, "hard_negatives.json"), "w", encoding="utf-8") as f:
            json.dump([dataclasses.asdict(hn) for hn in result.hard_negatives], f, indent=2, ensure_ascii=False)
        with open(os.path.join(gt_scenario_dir, "evidence_chains.json"), "w", encoding="utf-8") as f:
            json.dump([dataclasses.asdict(ec) for ec in result.evidence_chains], f, indent=2, ensure_ascii=False)
        with open(os.path.join(gt_scenario_dir, "alternative_hypotheses.json"), "w", encoding="utf-8") as f:
            json.dump([dataclasses.asdict(ah) for ah in result.alternative_hypotheses], f, indent=2, ensure_ascii=False)

        # STAGE 8: Export Observed Records
        obs_scenario_dir = os.path.join(self.obs_dir, sid_str)
        os.makedirs(obs_scenario_dir, exist_ok=True)

        json_files = {
            "cctns_fir_records.json":    firs,
            "criminal_history_db.json":  criminal_hist,
            "telecom_caf_kyc.json":      cafs,
            "fiu_str_alerts.json":       fiu_alerts,
            "cell_tower_dumps.json":     tower_dumps,
            "osint_social_posts.json":   osint_posts,
        }
        for fname, data in json_files.items():
            with open(os.path.join(obs_scenario_dir, fname), "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

        self._write_csv(os.path.join(obs_scenario_dir, "telecom_cdr_logs.csv"), cdrs)
        self._write_csv(os.path.join(obs_scenario_dir, "cbs_bank_transactions.csv"), bank_txns)
        self._write_csv(os.path.join(obs_scenario_dir, "toll_anpr_logs.csv"), anpr_logs)

        with open(os.path.join(obs_scenario_dir, "field_intelligence_notes.txt"), "w", encoding="utf-8") as f:
            f.write(field_notes)

        # STAGE 9: Export Queries & Answers
        qry_dir = os.path.join(self.queries_dir, sid_str)
        ans_dir = os.path.join(self.answers_dir, sid_str)
        os.makedirs(qry_dir, exist_ok=True)
        os.makedirs(ans_dir, exist_ok=True)

        with open(os.path.join(qry_dir, "investigation_queries.json"), "w", encoding="utf-8") as f:
            json.dump([result.query.model_dump()], f, indent=2, ensure_ascii=False)
        with open(os.path.join(ans_dir, "investigation_answers.json"), "w", encoding="utf-8") as f:
            json.dump([result.answer.model_dump()], f, indent=2, ensure_ascii=False)

        # STAGE 10: Reports
        rpt_dir = os.path.join(self.reports_dir, sid_str)
        os.makedirs(rpt_dir, exist_ok=True)

        dataset_stats = {
            "scenario_id": sid_str,
            "scenario_type": result.ground_truth.scenario_type,
            "seed": self.seed,
            "scale": self.scale,
            "gt_entities": len(result.ground_truth.ground_truth_entities),
            "gt_edges": len(result.ground_truth.ground_truth_relationships),
            "gt_timeline_steps": len(result.ground_truth.master_timeline),
            "observed_files": 10,
            "total_observed_records": total_observed,
            "hard_negatives": len(result.hard_negatives),
            "evidence_chains": len(result.evidence_chains),
            "alternative_hypotheses": len(result.alternative_hypotheses),
            "noise_statistics": noise_stats,
            "audit_passed": validation_report["passed"],
            "audit_warnings": len(validation_report.get("warnings", [])),
        }

        with open(os.path.join(rpt_dir, "dataset_statistics.json"), "w", encoding="utf-8") as f:
            json.dump(dataset_stats, f, indent=2, ensure_ascii=False)
        with open(os.path.join(rpt_dir, "validation_report.json"), "w", encoding="utf-8") as f:
            json.dump(validation_report, f, indent=2, ensure_ascii=False)
        with open(os.path.join(rpt_dir, "noise_statistics.json"), "w", encoding="utf-8") as f:
            json.dump(noise_stats, f, indent=2, ensure_ascii=False)

        print(f"[{sid_str}] PASS — GT:{dataset_stats['gt_entities']} entities / "
              f"{dataset_stats['gt_edges']} edges | "
              f"Observed: {total_observed} records | "
              f"Noise ratio: {noise_stats['measured_noise_ratio']:.2%}")

        return dataset_stats

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _ensure_directories(self):
        for d in [self.gt_dir, self.obs_dir, self.queries_dir,
                  self.answers_dir, self.reports_dir]:
            os.makedirs(d, exist_ok=True)

    def _write_csv(self, filepath: str, records: List[Dict[str, Any]]):
        if not records:
            return
        # Collect union of all fieldnames (noise injection may add extra fields)
        all_keys: List[str] = []
        seen: set = set()
        for rec in records:
            for k in rec.keys():
                if k not in seen:
                    all_keys.append(k)
                    seen.add(k)
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=all_keys, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(records)


    # ── Legacy compatibility shim ─────────────────────────────────────────────
    # Old code referencing run_pipeline_for_scenario_10() still works
    def run_pipeline_for_scenario_10(self) -> Dict[str, Any]:
        """Compatibility shim — routes to the new pipeline for scenario 10."""
        return self._run_one(10)
