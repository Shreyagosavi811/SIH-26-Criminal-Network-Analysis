"""
SIH26189 — Demo Scale Benchmark Export (Phase 7B)

Runs the Phase 7A BenchmarkExportRunner against the Demo Scale output at:
    output/DEMO_SCALE/output/

Writes ML_BENCHMARK files to:
    output/DEMO_SCALE/output/ML_BENCHMARK/

Strategy: override ScenarioLoader's gt_dir/obs_dir/rpt_dir/qry_dir/ans_dir
instance attributes to point to the Demo Scale output location. This does
not modify any protected benchmark/ files — it uses the public API.

Usage:
    python run_demo_benchmark_export.py
"""

import json
import os
import sys
import random
import dataclasses
from datetime import datetime, timezone

ENGINE_ROOT      = os.path.dirname(os.path.abspath(__file__))
DEMO_OUTPUT_ROOT = os.path.join(ENGINE_ROOT, "output", "DEMO_SCALE", "output")

# Demo Scale observed scenarios (S03 excluded — temporal_window failure)
DEMO_SCENARIOS = [1, 2, 4, 5, 6, 7, 8, 9, 10]

SEED        = 26189
NOISE_LEVEL = 3


def _make_demo_loader(sid: int):
    """
    Create a ScenarioLoader for the Demo Scale directory by overriding
    the instance-level directory attributes after construction.
    ScenarioLoader's directory attributes are plain strings on the instance,
    so this is safe and does not change the class or module state.
    """
    from benchmark.loader import ScenarioLoader
    sid_str = f"S{sid:02d}"
    sl = ScenarioLoader.__new__(ScenarioLoader)
    sl.sid     = sid_str
    sl.gt_dir  = os.path.join(DEMO_OUTPUT_ROOT, "GROUND_TRUTH",  sid_str)
    sl.obs_dir = os.path.join(DEMO_OUTPUT_ROOT, "OBSERVED",      sid_str)
    sl.qry_dir = os.path.join(DEMO_OUTPUT_ROOT, "QUERIES",       sid_str)
    sl.ans_dir = os.path.join(DEMO_OUTPUT_ROOT, "ANSWERS",       sid_str)
    sl.rpt_dir = os.path.join(DEMO_OUTPUT_ROOT, "REPORTS",       sid_str)
    return sl


def main():
    from benchmark.loader import ScenarioLoader
    from benchmark.entity_resolution import build_entity_resolution
    from benchmark.adapters import (
        build_link_prediction, build_multi_hop, build_anomaly_detection,
        build_temporal_reasoning, build_false_positive, build_evidence_retrieval,
    )
    from benchmark.split_builder import build_splits, verify_no_cross_split_leakage
    from benchmark.models import BenchmarkStats
    from benchmark.config import SPLIT_RATIOS, BENCHMARK_VERSION, GENERATOR_VERSION
    from benchmark.export_runner import BenchmarkExportError

    print("=" * 65)
    print("   SIH26189 — Demo Scale Benchmark Export (Phase 7B)")
    print("=" * 65)
    print(f"  Reading from : {DEMO_OUTPUT_ROOT}")
    print(f"  Scenarios    : {DEMO_SCENARIOS}")
    print(f"  Seed         : {SEED}")
    print("-" * 65)

    started_at = datetime.now(timezone.utc).isoformat()

    TASK_NAMES = [
        "entity_resolution", "link_prediction", "multi_hop",
        "anomaly_detection", "temporal_reasoning", "false_positive", "evidence_retrieval",
    ]

    # Step 1: Check which scenarios are available in Demo Scale output
    available = []
    for sid in DEMO_SCENARIOS:
        sl = _make_demo_loader(sid)
        if sl.is_available():
            available.append(sid)
        else:
            print(f"  [SKIP] S{sid:02d} — not available at {sl.gt_dir}")

    if not available:
        print("[ERROR] No Demo Scale scenarios found. Run run_demo_scale.py first.",
              file=sys.stderr)
        sys.exit(1)

    print(f"[EXPORT] Found {len(available)} available scenarios: "
          f"{[f'S{s:02d}' for s in available]}")

    # Step 2: Build examples for all 7 tasks
    all_examples = {name: [] for name in TASK_NAMES}
    scenario_metas = []

    for sid in available:
        sl = _make_demo_loader(sid)
        sid_str = f"S{sid:02d}"
        print(f"  [{sid_str}] Building examples …")

        # Load all data
        gt_manifest     = sl.load_gt_manifest()
        evidence_chains = sl.load_evidence_chains()
        hard_negatives  = sl.load_hard_negatives()
        alt_hypotheses  = sl.load_alternative_hypotheses()
        caf_records     = sl.load_caf()
        cdr_records     = sl.load_cdr()
        bank_txns       = sl.load_bank_txns()
        anpr_records    = sl.load_anpr()
        fiu_alerts      = sl.load_fiu_alerts()

        # Load noise metadata
        noise_stats   = sl.load_noise_stats()
        noise_level   = int(noise_stats.get("noise_level", NOISE_LEVEL)) if noise_stats else NOISE_LEVEL
        noise_ratio   = float(noise_stats.get("measured_noise_ratio", 0.0)) if noise_stats else 0.0

        rng = random.Random(SEED + sid)

        er = build_entity_resolution(gt_manifest, caf_records, cdr_records, anpr_records,
                                     hard_negatives, sid_str, noise_level, noise_ratio, rng)
        lp = build_link_prediction(gt_manifest, evidence_chains, hard_negatives,
                                    sid_str, noise_level, noise_ratio, rng)
        mh = build_multi_hop(gt_manifest, sid_str, noise_level, noise_ratio, rng)
        ad = build_anomaly_detection(gt_manifest, bank_txns, cdr_records, anpr_records,
                                     fiu_alerts, sid_str, noise_level, noise_ratio, rng)
        tr = build_temporal_reasoning(gt_manifest, sid_str, noise_level, noise_ratio, rng)
        fp = build_false_positive(gt_manifest, alt_hypotheses, hard_negatives,
                                   sid_str, noise_level, noise_ratio, rng)
        ev = build_evidence_retrieval(gt_manifest, evidence_chains,
                                      sid_str, noise_level, noise_ratio, rng)

        all_examples["entity_resolution"].extend(er)
        all_examples["link_prediction"].extend(lp)
        all_examples["multi_hop"].extend(mh)
        all_examples["anomaly_detection"].extend(ad)
        all_examples["temporal_reasoning"].extend(tr)
        all_examples["false_positive"].extend(fp)
        all_examples["evidence_retrieval"].extend(ev)

        counts = {
            t: sum(1 for x in all_examples[t] if x.metadata.get("scenario_id") == sid_str)
            for t in TASK_NAMES
        }
        total_s = sum(counts.values())
        scenario_metas.append({"scenario_id": sid_str, "noise_level": noise_level,
                                "noise_ratio": noise_ratio, "example_counts": counts})
        print(f"  [{sid_str}] Built {total_s} examples")

    # Step 3: Build splits
    print("[EXPORT] Building train/validation/test/challenge splits …")
    splits = build_splits(all_examples, seed=SEED)

    # Step 4: Verify leakage
    print("[EXPORT] Verifying cross-split entity-network leakage …")
    leakage_ok, leakage_errors = verify_no_cross_split_leakage(splits)
    if not leakage_ok:
        print(f"[ERROR] Cross-split leakage detected: {leakage_errors}", file=sys.stderr)
        sys.exit(1)
    print("  [LEAKAGE CHECK] PASS")

    # Step 5: Write output files
    out_dir = os.path.join(DEMO_OUTPUT_ROOT, "ML_BENCHMARK")
    os.makedirs(out_dir, exist_ok=True)

    split_sizes = {}
    for split_name, split_obj in splits.items():
        counts = split_obj.counts()
        split_sizes[split_name] = counts
        out_path = os.path.join(out_dir, f"{split_name}.json")
        payload = {
            "split": split_name,
            **{t: [ex.to_dict() for ex in getattr(split_obj, t)] for t in TASK_NAMES},
            "counts": counts,
        }
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"  [{split_name.upper()}] {counts['total']} examples → {out_path}")

    # Step 6: Write manifest
    per_task = {t: len(v) for t, v in all_examples.items()}
    finished_at = datetime.now(timezone.utc).isoformat()

    manifest = {
        "benchmark_name"     : "SIH26189 ML Benchmark — Demo Scale",
        "benchmark_version"  : BENCHMARK_VERSION,
        "generator_version"  : GENERATOR_VERSION,
        "phase"              : "7B",
        "scale"              : "demo",
        "export_started_at"  : started_at,
        "export_finished_at" : finished_at,
        "generation_seed"    : SEED,
        "noise_level"        : NOISE_LEVEL,
        "split_percentages"  : SPLIT_RATIOS,
        "split_strategy"     : "latent_connected_component_isolation",
        "tasks"              : TASK_NAMES,
        "scenarios"          : {"available": available,
                                "available_ids": [f"S{s:02d}" for s in available]},
        "scenario_metadata"  : scenario_metas,
        "statistics"         : {
            "total_examples"   : sum(per_task.values()),
            "per_task"         : per_task,
            "per_scenario"     : {m["scenario_id"]: sum(m["example_counts"].values())
                                   for m in scenario_metas},
            "split_sizes"      : split_sizes,
            "leakage_passed"   : leakage_ok,
        },
        "validation"         : {"leakage_check_passed": leakage_ok},
        "output_files"       : {"train": "train.json", "validation": "validation.json",
                                "test": "test.json", "challenge": "challenge.json",
                                "manifest": "benchmark_manifest.json"},
        "source_paths"       : {"demo_output_root": DEMO_OUTPUT_ROOT},
    }
    manifest_path = os.path.join(out_dir, "benchmark_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print(f"  [MANIFEST] Written → {manifest_path}")

    total = sum(per_task.values())
    print("\n" + "=" * 65)
    print("   DEMO SCALE BENCHMARK EXPORT COMPLETE")
    print("=" * 65)
    print(f"  Total examples   : {total}")
    print(f"  Leakage check    : PASS")
    print(f"  Output directory : {out_dir}")
    print()
    print("  Per-task counts:")
    for t, c in per_task.items():
        print(f"    {t:<28} {c}")
    print()
    print("  Per-split totals:")
    for split, counts in split_sizes.items():
        print(f"    {split:<12} {counts.get('total', 0)} examples")
    print()
    print(f"  Manifest: {manifest_path}")
    print("=" * 65)

    # Print JSON summary to stdout for capture
    print(json.dumps({
        "phase": "7B",
        "scale": "demo",
        "total_examples": total,
        "per_task": per_task,
        "split_sizes": split_sizes,
        "leakage_passed": leakage_ok,
        "available_scenarios": [f"S{s:02d}" for s in available],
        "output_dir": out_dir,
    }, indent=2))


if __name__ == "__main__":
    main()
