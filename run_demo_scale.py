"""
SIH26189 — Demo Scale Generation Script (Phase 7B)

Generates all passing scenarios (S01–S10, excluding S03 which has a pre-existing
temporal_window violation in the protected scenario builder) at Demo Scale using
the existing engine's documented 'demo' scale configuration.

Demo Scale (documented in dataset_architecture_master.md and architecture/05_*):
    scale="demo"  →  SCALE_TARGETS["demo"] = 800 target records per serializer
    noise_level=3 →  60% target noise ratio (unchanged from MVP)
    seed=26189    →  reproducible seed (unchanged)

Output is isolated to:
    output/DEMO_SCALE/output/  (base_dir = <engine_root>/output/DEMO_SCALE)

The existing MVP baseline in output/GROUND_TRUTH/, output/OBSERVED/, etc. is
NOT touched.

Why S03 is excluded:
    S03's master timeline Step 1 is timestamped 2025-03-10, which precedes
    the investigation_window start 2026-01-01 set by the scenario builder.
    This is a pre-existing defect in the protected scenario_03_phone.py builder.
    The temporal_window validator correctly rejects it. S03 cannot be included
    without modifying the protected scenario builder.

Usage:
    python run_demo_scale.py [--dry-run]
"""

import argparse
import json
import os
import sys
import time

# ── Configuration ─────────────────────────────────────────────────────────────

ENGINE_ROOT   = os.path.dirname(os.path.abspath(__file__))
DEMO_BASE_DIR = os.path.join(ENGINE_ROOT, "output", "DEMO_SCALE")

# Scenarios that pass the full audit pipeline at demo scale
# S03 excluded: pre-existing temporal_window violation in protected builder
DEMO_SCENARIOS = [1, 2, 4, 5, 6, 7, 8, 9, 10]

DEMO_SCALE   = "demo"
DEMO_SEED    = 26189
DEMO_NOISE   = 3      # Level 3 = ~60% target ratio (unchanged from MVP)


def run_demo_scale(dry_run: bool = False) -> dict:
    from generator.engine import DatasetEngine, SCALE_TARGETS

    print("=" * 65)
    print("   SIH26189 — Demo Scale Generation (Phase 7B)")
    print("=" * 65)
    print(f"  Scale        : {DEMO_SCALE}")
    print(f"  Seed         : {DEMO_SEED}")
    print(f"  Noise Level  : {DEMO_NOISE} (target ~60%)")
    print(f"  Scenarios    : {DEMO_SCENARIOS}  (S03 excluded — see docstring)")
    print(f"  target_total : {SCALE_TARGETS[DEMO_SCALE]} records/scenario (serializer)")
    print(f"  Base dir     : {DEMO_BASE_DIR}")
    if dry_run:
        print("  Mode         : DRY-RUN — no files written")
    print("-" * 65)

    if dry_run:
        print("[DRY-RUN] Would generate scenarios:", [f"S{s:02d}" for s in DEMO_SCENARIOS])
        return {}

    engine = DatasetEngine(
        base_dir    = DEMO_BASE_DIR,
        seed        = DEMO_SEED,
        noise_level = DEMO_NOISE,
        scale       = DEMO_SCALE,
    )

    all_stats   = {}
    total_gt_entities = 0
    total_gt_edges    = 0
    total_obs_records = 0

    t0 = time.time()

    for sid in DEMO_SCENARIOS:
        print(f"\n  Generating S{sid:02d} …")
        try:
            stats = engine.run_scenario(sid)
            all_stats[f"S{sid:02d}"] = stats
            total_gt_entities += stats["gt_entities"]
            total_gt_edges    += stats["gt_edges"]
            total_obs_records += stats["total_observed_records"]
        except Exception as e:
            print(f"  [FAIL] S{sid:02d}: {e}", file=sys.stderr)
            all_stats[f"S{sid:02d}"] = {"error": str(e)}

    elapsed = time.time() - t0

    # Aggregate summary
    summary = {
        "phase"              : "7B",
        "scale"              : DEMO_SCALE,
        "seed"               : DEMO_SEED,
        "noise_level"        : DEMO_NOISE,
        "scenarios_attempted": DEMO_SCENARIOS,
        "scenarios_passed"   : [k for k, v in all_stats.items() if "error" not in v],
        "scenarios_failed"   : [k for k, v in all_stats.items() if "error" in v],
        "total_gt_entities"  : total_gt_entities,
        "total_gt_edges"     : total_gt_edges,
        "total_observed_records": total_obs_records,
        "elapsed_seconds"    : round(elapsed, 2),
        "per_scenario"       : all_stats,
    }

    # Write summary report
    rpt_dir = os.path.join(DEMO_BASE_DIR, "output", "REPORTS")
    os.makedirs(rpt_dir, exist_ok=True)
    summary_path = os.path.join(rpt_dir, "demo_scale_summary.json")
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print("   DEMO SCALE GENERATION COMPLETE")
    print("=" * 65)
    print(f"  Scenarios passed : {len(summary['scenarios_passed'])}/{len(DEMO_SCENARIOS)}")
    print(f"  Total GT entities: {total_gt_entities}")
    print(f"  Total GT edges   : {total_gt_edges}")
    print(f"  Total obs records: {total_obs_records}")
    print(f"  Elapsed          : {elapsed:.1f}s")
    print(f"  Summary report   : {summary_path}")
    print("=" * 65)

    # Print per-scenario table
    print(f"\n{'Scenario':<8} {'Type':<30} {'GT':<5} {'Edges':<6} {'Obs':<7} {'Noise%':<9} {'Audit'}")
    print("-" * 75)
    for sid_str, s in all_stats.items():
        if "error" in s:
            print(f"{sid_str:<8} {'ERROR':<30} {'—':<5} {'—':<6} {'—':<7} {'—':<9} FAIL")
        else:
            nr     = s["noise_statistics"]["measured_noise_ratio"]
            target = s["noise_statistics"]["target_noise_ratio"]
            ok     = "PASS" if s["audit_passed"] else "FAIL"
            print(f"{sid_str:<8} {s['scenario_type']:<30} {s['gt_entities']:<5} "
                  f"{s['gt_edges']:<6} {s['total_observed_records']:<7} "
                  f"{nr:.1%}/{target:.0%}    {ok}")

    return summary


def main():
    parser = argparse.ArgumentParser(
        description="SIH26189 Demo Scale Dataset Generation (Phase 7B)"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Report what would be generated without writing files."
    )
    args = parser.parse_args()

    summary = run_demo_scale(dry_run=args.dry_run)
    if summary and summary.get("scenarios_failed"):
        sys.exit(1)


if __name__ == "__main__":
    main()
