"""
SIH26189 Benchmark Export Runner — Phase 7A
Connects existing adapters + split builder to produce ML_BENCHMARK output.

Design constraints (Phase 7A):
  - Reads ONLY from output/ directory via existing ScenarioLoader/BenchmarkLoader.
  - Never imports from generator.* or validation.*
  - All 7 benchmark tasks are built with existing adapters.
  - Splits use existing build_splits() + verify_no_cross_split_leakage().
  - Fails loudly (raises BenchmarkExportError) on missing / malformed inputs.
"""

import json
import os
import random
import dataclasses
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from benchmark.config import (
    BENCHMARK_DIR,
    BENCHMARK_VERSION,
    GENERATOR_VERSION,
    SPLIT_RATIOS,
    ALL_SCENARIOS,
)
from benchmark.loader import BenchmarkLoader, ScenarioLoader
from benchmark.models import (
    BenchmarkSplit, BenchmarkStats,
    ERExample, LPExample, MHExample, ADExample, TRExample, FPExample, EVExample,
)
from benchmark.entity_resolution import build_entity_resolution
from benchmark.adapters import (
    build_link_prediction,
    build_multi_hop,
    build_anomaly_detection,
    build_temporal_reasoning,
    build_false_positive,
    build_evidence_retrieval,
)
from benchmark.split_builder import build_splits, verify_no_cross_split_leakage


# ── Errors ────────────────────────────────────────────────────────────────────

class BenchmarkExportError(RuntimeError):
    """Raised when required generated output files are missing or malformed."""


# ── Core Runner ───────────────────────────────────────────────────────────────

class BenchmarkExportRunner:
    """
    Orchestrates the full benchmark export pipeline:

      1. Discover available scenarios from output/GROUND_TRUTH/ and output/OBSERVED/
      2. Load GT + observed data per scenario via ScenarioLoader
      3. Build examples for all 7 ML benchmark tasks
      4. Split via build_splits() (60/20/15/5 train/val/test/challenge)
      5. Verify no entity-network leakage across train↔val↔test
      6. Write 4 split JSON files + benchmark_manifest.json to output/ML_BENCHMARK/
    """

    TASK_NAMES = [
        "entity_resolution",
        "link_prediction",
        "multi_hop",
        "anomaly_detection",
        "temporal_reasoning",
        "false_positive",
        "evidence_retrieval",
    ]

    def __init__(
        self,
        scenarios: Optional[List[int]] = None,
        seed: int = 26189,
        noise_level: int = 3,
        output_dir: Optional[str] = None,
    ):
        self.scenarios   = scenarios or ALL_SCENARIOS
        self.seed        = seed
        self.noise_level = noise_level
        self.output_dir  = output_dir or BENCHMARK_DIR
        self._rng        = random.Random(seed)

    # ── Public entry point ────────────────────────────────────────────────────

    def run(self) -> Dict[str, Any]:
        """
        Execute the full benchmark export pipeline.

        Returns a summary dict with task counts, split sizes, and manifest path.
        Raises BenchmarkExportError on any missing or malformed input.
        """
        started_at = datetime.now(timezone.utc).isoformat()

        # Step 1: discover available scenarios
        loader      = BenchmarkLoader(self.scenarios)
        available   = loader.available_scenarios()
        if not available:
            raise BenchmarkExportError(
                "No generated scenarios found in output/GROUND_TRUTH/ + output/OBSERVED/. "
                "Run the dataset engine first (e.g. `python run_engine.py --scenario all`)."
            )

        print(f"[EXPORT] Found {len(available)} available scenarios: "
              f"{[f'S{s:02d}' for s in available]}")

        # Step 2: build examples for all 7 tasks across all scenarios
        all_examples: Dict[str, List[Any]] = {name: [] for name in self.TASK_NAMES}
        scenario_metas: List[Dict[str, Any]] = []

        for sid in available:
            sl       = loader.get_loader(sid)
            sid_str  = f"S{sid:02d}"
            print(f"  [{sid_str}] Loading and building benchmark examples …")

            gt_manifest   = self._require_gt_manifest(sl, sid_str)
            evidence_chains  = sl.load_evidence_chains()
            hard_negatives   = sl.load_hard_negatives()
            alt_hypotheses   = sl.load_alternative_hypotheses()
            noise_level, noise_ratio = self._load_noise_meta(sl, sid_str)

            # Observed records
            caf_records  = sl.load_caf()
            cdr_records  = sl.load_cdr()
            bank_txns    = sl.load_bank_txns()
            anpr_records = sl.load_anpr()
            fiu_alerts   = sl.load_fiu_alerts()

            rng = random.Random(self.seed + sid)

            # ── Task 1: Entity Resolution ──────────────────────────────────
            er = build_entity_resolution(
                gt_manifest        = gt_manifest,
                caf_records        = caf_records,
                cdr_records        = cdr_records,
                anpr_records       = anpr_records,
                hard_negatives_gt  = hard_negatives,
                scenario_id        = sid_str,
                noise_level        = noise_level,
                noise_ratio        = noise_ratio,
                rng                = rng,
            )
            all_examples["entity_resolution"].extend(er)

            # ── Task 2: Link Prediction ────────────────────────────────────
            lp = build_link_prediction(
                gt_manifest        = gt_manifest,
                evidence_chains    = evidence_chains,
                hard_negatives_gt  = hard_negatives,
                scenario_id        = sid_str,
                noise_level        = noise_level,
                noise_ratio        = noise_ratio,
                rng                = rng,
            )
            all_examples["link_prediction"].extend(lp)

            # ── Task 3: Multi-Hop Reasoning ────────────────────────────────
            mh = build_multi_hop(
                gt_manifest  = gt_manifest,
                scenario_id  = sid_str,
                noise_level  = noise_level,
                noise_ratio  = noise_ratio,
                rng          = rng,
            )
            all_examples["multi_hop"].extend(mh)

            # ── Task 4: Anomaly Detection ──────────────────────────────────
            ad = build_anomaly_detection(
                gt_manifest  = gt_manifest,
                bank_txns    = bank_txns,
                cdr_records  = cdr_records,
                anpr_records = anpr_records,
                fiu_alerts   = fiu_alerts,
                scenario_id  = sid_str,
                noise_level  = noise_level,
                noise_ratio  = noise_ratio,
                rng          = rng,
            )
            all_examples["anomaly_detection"].extend(ad)

            # ── Task 5: Temporal Reasoning ─────────────────────────────────
            tr = build_temporal_reasoning(
                gt_manifest  = gt_manifest,
                scenario_id  = sid_str,
                noise_level  = noise_level,
                noise_ratio  = noise_ratio,
                rng          = rng,
            )
            all_examples["temporal_reasoning"].extend(tr)

            # ── Task 6: False Positive Discrimination ─────────────────────
            fp = build_false_positive(
                gt_manifest        = gt_manifest,
                alt_hypotheses     = alt_hypotheses,
                hard_negatives_gt  = hard_negatives,
                scenario_id        = sid_str,
                noise_level        = noise_level,
                noise_ratio        = noise_ratio,
                rng                = rng,
            )
            all_examples["false_positive"].extend(fp)

            # ── Task 7: Evidence Retrieval ─────────────────────────────────
            ev = build_evidence_retrieval(
                gt_manifest     = gt_manifest,
                evidence_chains = evidence_chains,
                scenario_id     = sid_str,
                noise_level     = noise_level,
                noise_ratio     = noise_ratio,
                rng             = rng,
            )
            all_examples["evidence_retrieval"].extend(ev)

            counts_for_scenario = {
                name: sum(
                    1 for x in all_examples[name]
                    if x.metadata.get("scenario_id") == sid_str
                )
                for name in self.TASK_NAMES
            }
            total_for_scenario = sum(counts_for_scenario.values())
            print(f"  [{sid_str}] Built {total_for_scenario} examples "
                  f"({', '.join(f'{k}:{v}' for k, v in counts_for_scenario.items() if v)})")

            scenario_metas.append({
                "scenario_id": sid_str,
                "noise_level": noise_level,
                "noise_ratio": noise_ratio,
                "example_counts": counts_for_scenario,
            })

        # Step 3: build splits
        print("[EXPORT] Building train/validation/test/challenge splits …")
        splits = build_splits(all_examples, seed=self.seed)

        # Step 4: verify leakage
        print("[EXPORT] Verifying cross-split entity-network leakage …")
        leakage_ok, leakage_errors = verify_no_cross_split_leakage(splits)
        if not leakage_ok:
            raise BenchmarkExportError(
                f"Cross-split entity leakage detected! Errors: {leakage_errors}"
            )
        print(f"  [LEAKAGE CHECK] PASS — no entity-network leakage across splits.")

        # Step 5: write outputs
        os.makedirs(self.output_dir, exist_ok=True)
        split_sizes: Dict[str, Dict[str, int]] = {}
        for split_name, split_obj in splits.items():
            counts     = split_obj.counts()
            split_sizes[split_name] = counts
            out_path   = os.path.join(self.output_dir, f"{split_name}.json")
            self._write_split(out_path, split_obj, split_name)
            print(f"  [{split_name.upper()}] {counts['total']} examples → {out_path}")

        # Step 6: write manifest
        per_task_totals = {name: len(exs) for name, exs in all_examples.items()}
        stats = BenchmarkStats(
            total_examples   = sum(per_task_totals.values()),
            per_task         = per_task_totals,
            per_scenario     = {
                m["scenario_id"]: sum(m["example_counts"].values())
                for m in scenario_metas
            },
            positives        = self._count_positives(all_examples),
            negatives        = self._count_negatives(all_examples),
            hard_negatives   = self._count_hard_negatives(all_examples),
            split_sizes      = split_sizes,
            leakage_passed   = leakage_ok,
        )

        manifest = self._build_manifest(
            available_scenarios = available,
            scenario_metas      = scenario_metas,
            stats               = stats,
            started_at          = started_at,
            finished_at         = datetime.now(timezone.utc).isoformat(),
            leakage_ok          = leakage_ok,
        )

        manifest_path = os.path.join(self.output_dir, "benchmark_manifest.json")
        with open(manifest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        print(f"  [MANIFEST] Written → {manifest_path}")

        print(f"\n[EXPORT] DONE — {stats.total_examples} total examples across "
              f"{len(available)} scenarios and 7 tasks.")

        return {
            "total_examples":       stats.total_examples,
            "per_task":             stats.per_task,
            "split_sizes":          stats.split_sizes,
            "leakage_passed":       leakage_ok,
            "available_scenarios":  [f"S{s:02d}" for s in available],
            "output_dir":           self.output_dir,
            "manifest_path":        manifest_path,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _require_gt_manifest(
        self, sl: ScenarioLoader, sid_str: str
    ) -> Dict[str, Any]:
        """Load the GT manifest; raise BenchmarkExportError if missing."""
        try:
            manifest = sl.load_gt_manifest()
        except FileNotFoundError:
            raise BenchmarkExportError(
                f"[{sid_str}] Ground truth manifest not found at "
                f"{sl.gt_dir}/ground_truth_manifest.json. "
                f"Run `python run_engine.py --scenario {int(sid_str[1:])}` first."
            )
        if not manifest.get("ground_truth_entities"):
            raise BenchmarkExportError(
                f"[{sid_str}] ground_truth_manifest.json is malformed — "
                f"'ground_truth_entities' key is missing or empty."
            )
        return manifest

    def _load_noise_meta(
        self, sl: ScenarioLoader, sid_str: str
    ) -> Tuple[int, float]:
        """
        Load noise_level and measured_noise_ratio from the reports directory.
        Falls back to configured defaults if the report is absent.
        """
        noise_stats = sl.load_noise_stats()
        if noise_stats:
            return (
                int(noise_stats.get("noise_level", self.noise_level)),
                float(noise_stats.get("measured_noise_ratio", 0.0)),
            )
        dataset_stats = sl.load_dataset_stats()
        if dataset_stats:
            ns = dataset_stats.get("noise_statistics", {})
            return (
                int(ns.get("noise_level", self.noise_level)),
                float(ns.get("measured_noise_ratio", 0.0)),
            )
        # Fallback
        return self.noise_level, 0.0

    def _write_split(
        self, path: str, split: BenchmarkSplit, split_name: str
    ) -> None:
        """Serialise a BenchmarkSplit to JSON using the .to_dict() on each example."""
        payload = {
            "split": split_name,
            "entity_resolution":   [ex.to_dict() for ex in split.entity_resolution],
            "link_prediction":     [ex.to_dict() for ex in split.link_prediction],
            "multi_hop":           [ex.to_dict() for ex in split.multi_hop],
            "anomaly_detection":   [ex.to_dict() for ex in split.anomaly_detection],
            "temporal_reasoning":  [ex.to_dict() for ex in split.temporal_reasoning],
            "false_positive":      [ex.to_dict() for ex in split.false_positive],
            "evidence_retrieval":  [ex.to_dict() for ex in split.evidence_retrieval],
            "counts":              split.counts(),
        }
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

    def _count_positives(self, all_examples: Dict[str, List[Any]]) -> int:
        count = 0
        for name, exs in all_examples.items():
            for ex in exs:
                lbl = getattr(ex, "label", None)
                if lbl is True or lbl == 1:
                    count += 1
        return count

    def _count_negatives(self, all_examples: Dict[str, List[Any]]) -> int:
        count = 0
        for name, exs in all_examples.items():
            for ex in exs:
                lbl = getattr(ex, "label", None)
                if lbl is False or lbl == 0:
                    count += 1
        return count

    def _count_hard_negatives(self, all_examples: Dict[str, List[Any]]) -> int:
        count = 0
        for name, exs in all_examples.items():
            for ex in exs:
                nt = ex.metadata.get("negative_type", "")
                if "hard" in str(nt).lower():
                    count += 1
        return count

    def _build_manifest(
        self,
        available_scenarios : List[int],
        scenario_metas      : List[Dict[str, Any]],
        stats               : BenchmarkStats,
        started_at          : str,
        finished_at         : str,
        leakage_ok          : bool,
    ) -> Dict[str, Any]:
        """Build the benchmark_manifest.json payload."""
        return {
            "benchmark_name"     : "SIH26189 ML Benchmark",
            "benchmark_version"  : BENCHMARK_VERSION,
            "generator_version"  : GENERATOR_VERSION,
            "export_started_at"  : started_at,
            "export_finished_at" : finished_at,
            "generation_seed"    : self.seed,
            "noise_level"        : self.noise_level,
            "split_percentages"  : SPLIT_RATIOS,
            "split_strategy"     : "latent_connected_component_isolation",
            "tasks": self.TASK_NAMES,
            "scenarios": {
                "requested": self.scenarios,
                "available": available_scenarios,
                "available_ids": [f"S{s:02d}" for s in available_scenarios],
            },
            "scenario_metadata": scenario_metas,
            "statistics": dataclasses.asdict(stats),
            "validation": {
                "leakage_check_passed": leakage_ok,
                "leakage_strategy": "no_scenario_appears_in_multiple_splits",
                "high_noise_to_challenge": True,
            },
            "output_files": {
                "train":      "train.json",
                "validation": "validation.json",
                "test":       "test.json",
                "challenge":  "challenge.json",
                "manifest":   "benchmark_manifest.json",
            },
            "source_paths": {
                "ground_truth_dir": "output/GROUND_TRUTH/",
                "observed_dir":     "output/OBSERVED/",
                "reports_dir":      "output/REPORTS/",
                "queries_dir":      "output/QUERIES/",
                "answers_dir":      "output/ANSWERS/",
            },
            "configuration": {
                "seed":                 self.seed,
                "noise_level":          self.noise_level,
                "split_ratios":         SPLIT_RATIOS,
                "all_tasks":            self.TASK_NAMES,
                "hard_negative_split":  "challenge",
                "high_noise_threshold": 4,
            },
        }
