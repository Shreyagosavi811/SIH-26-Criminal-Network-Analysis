"""
SIH26189 Benchmark Loader
Reads generated GT and observed data from the output directory.
Operates ENTIRELY from files on disk — no import from generator.
This enforces the downstream-only dependency direction.
"""
import csv
import json
import os
from typing import Any, Dict, List, Optional, Tuple

from benchmark.config import (
    GT_DIR, OBSERVED_DIR, REPORTS_DIR, QUERIES_DIR, ANSWERS_DIR,
    SOURCE_FILES, NOISE_ID_PREFIXES,
)


class ScenarioLoader:
    """Loads all data for a single scenario from output/ files."""

    def __init__(self, scenario_id: int):
        self.sid = f"S{scenario_id:02d}"
        self.gt_dir    = os.path.join(GT_DIR, self.sid)
        self.obs_dir   = os.path.join(OBSERVED_DIR, self.sid)
        self.qry_dir   = os.path.join(QUERIES_DIR, self.sid)
        self.ans_dir   = os.path.join(ANSWERS_DIR, self.sid)
        self.rpt_dir   = os.path.join(REPORTS_DIR, self.sid)

    def is_available(self) -> bool:
        return os.path.isdir(self.gt_dir) and os.path.isdir(self.obs_dir)

    # ── Ground Truth ──────────────────────────────────────────────────────────
    def load_gt_manifest(self) -> Dict[str, Any]:
        path = os.path.join(self.gt_dir, "ground_truth_manifest.json")
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_hard_negatives(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.gt_dir, "hard_negatives.json")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_evidence_chains(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.gt_dir, "evidence_chains.json")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_alternative_hypotheses(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.gt_dir, "alternative_hypotheses.json")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    # ── Observed Records ──────────────────────────────────────────────────────
    def load_caf(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["TELECOM_CAF"])

    def load_cdr(self) -> List[Dict[str, Any]]:
        return self._load_csv(SOURCE_FILES["TELECOM_CDR"])

    def load_fir(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["CCTNS_FIR"])

    def load_criminal_hist(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["CRIMINAL_HIST"])

    def load_bank_txns(self) -> List[Dict[str, Any]]:
        return self._load_csv(SOURCE_FILES["CBS_BANK"])

    def load_fiu_alerts(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["FIU_STR"])

    def load_anpr(self) -> List[Dict[str, Any]]:
        return self._load_csv(SOURCE_FILES["TOLL_ANPR"])

    def load_tower_dumps(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["CELL_TOWER"])

    def load_osint(self) -> List[Dict[str, Any]]:
        return self._load_json(SOURCE_FILES["OSINT_SOCIAL"])

    def load_field_notes(self) -> str:
        path = os.path.join(self.obs_dir, SOURCE_FILES["FIELD_INTEL"])
        if not os.path.exists(path):
            return ""
        with open(path, encoding="utf-8") as f:
            return f.read()

    # ── Queries & Answers ─────────────────────────────────────────────────────
    def load_queries(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.qry_dir, "investigation_queries.json")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_answers(self) -> List[Dict[str, Any]]:
        path = os.path.join(self.ans_dir, "investigation_answers.json")
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    # ── Reports ───────────────────────────────────────────────────────────────
    def load_dataset_stats(self) -> Dict[str, Any]:
        path = os.path.join(self.rpt_dir, "dataset_statistics.json")
        if not os.path.exists(path):
            return {}
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    def load_noise_stats(self) -> Dict[str, Any]:
        path = os.path.join(self.rpt_dir, "noise_statistics.json")
        if not os.path.exists(path):
            return {}
        with open(path, encoding="utf-8") as f:
            return json.load(f)

    # ── Helpers ───────────────────────────────────────────────────────────────
    def _load_json(self, filename: str) -> List[Dict[str, Any]]:
        path = os.path.join(self.obs_dir, filename)
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else [data]

    def _load_csv(self, filename: str) -> List[Dict[str, Any]]:
        path = os.path.join(self.obs_dir, filename)
        if not os.path.exists(path):
            return []
        with open(path, encoding="utf-8", newline="") as f:
            return list(csv.DictReader(f))

    # ── Noise helpers ─────────────────────────────────────────────────────────
    @staticmethod
    def is_noise_record(record_id: str) -> bool:
        return any(record_id.startswith(p) for p in NOISE_ID_PREFIXES)

    def all_observed_records(self) -> Dict[str, List[Dict[str, Any]]]:
        """Return all observed records keyed by source name."""
        return {
            "telecom_caf_kyc.json":       self.load_caf(),
            "telecom_cdr_logs.csv":       self.load_cdr(),
            "cctns_fir_records.json":     self.load_fir(),
            "criminal_history_db.json":   self.load_criminal_hist(),
            "cbs_bank_transactions.csv":  self.load_bank_txns(),
            "fiu_str_alerts.json":        self.load_fiu_alerts(),
            "toll_anpr_logs.csv":         self.load_anpr(),
            "cell_tower_dumps.json":      self.load_tower_dumps(),
            "osint_social_posts.json":    self.load_osint(),
        }


class BenchmarkLoader:
    """Loads data across all available scenarios."""

    def __init__(self, scenarios: Optional[List[int]] = None):
        from benchmark.config import ALL_SCENARIOS
        self.scenarios = scenarios or ALL_SCENARIOS
        self._loaders: Dict[int, ScenarioLoader] = {}

    def get_loader(self, sid: int) -> Optional[ScenarioLoader]:
        if sid not in self._loaders:
            loader = ScenarioLoader(sid)
            if loader.is_available():
                self._loaders[sid] = loader
            else:
                return None
        return self._loaders[sid]

    def available_scenarios(self) -> List[int]:
        return [sid for sid in self.scenarios if ScenarioLoader(sid).is_available()]
