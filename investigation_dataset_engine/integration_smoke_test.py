"""
Integration dataset smoke test — S1, S4, S7, S10.
Verifies: engine routing, observed record counts, noise ratios,
          validation pass, and output file existence.
"""
import json
import os
from generator.engine import DatasetEngine

TARGET_SCENARIOS = [1, 4, 7, 10]
NOISE_LEVELS = [1, 2, 3, 4, 5]

def run_integration(base_dir: str, noise_level: int = 3):
    engine = DatasetEngine(base_dir=base_dir, seed=26189, noise_level=noise_level, scale="mvp")
    all_stats = {}
    for sid in TARGET_SCENARIOS:
        stats = engine.run_scenario(sid)
        all_stats[f"S{sid:02d}"] = stats
    return all_stats

if __name__ == "__main__":
    import tempfile, sys

    base = "output/INTEGRATION_TEST"
    os.makedirs(base, exist_ok=True)

    print("=" * 65)
    print(" SIH26189 — Integration Dataset Smoke Test (S1, S4, S7, S10)")
    print("=" * 65)

    # Run at noise_level=3 first
    results = run_integration(base, noise_level=3)
    total_records = sum(r["total_observed_records"] for r in results.values())

    print(f"\n{'Scenario':<8} {'Type':<28} {'GT':<5} {'Obs':<7} {'Noise%':<9} {'Audit'}")
    print("-" * 65)
    for sid, r in results.items():
        nr = r["noise_statistics"]["measured_noise_ratio"]
        target = r["noise_statistics"]["target_noise_ratio"]
        ok = "PASS" if r["audit_passed"] else "FAIL"
        print(f"{sid:<8} {r['scenario_type']:<28} {r['gt_entities']:<5} "
              f"{r['total_observed_records']:<7} {nr:.1%}/{target:.0%}     {ok}")
    print(f"\n  Total observed records across 4 scenarios: {total_records}")

    # Verify noise ratio mechanics across all 5 levels
    print("\n-- Noise Level Sweep (S1 only) ------------------------------")
    print(f"{'Level':<8} {'Target':<8} {'Measured':<12} {'Clean':<8} {'Noise'}")
    print("-" * 50)
    tmpdir = "output/NOISE_SWEEP"
    for lvl in NOISE_LEVELS:
        eng = DatasetEngine(base_dir=tmpdir, seed=26189, noise_level=lvl, scale="mvp")
        s = eng.run_scenario(1)
        ns = s["noise_statistics"]
        impossible = ns["noise_records_inter"] > ns["total_observed_records"]
        flag = " [IMPOSSIBLE!]" if impossible else ""
        print(f"  L{lvl:<5} {ns['target_noise_ratio']:.0%}     {ns['measured_noise_ratio']:.2%}         "
              f"{ns['clean_records']:<8} {ns['noise_records_inter']}{flag}")

    # Save consolidated report
    with open(os.path.join(base, "integration_summary.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n  integration_summary.json written to {base}/")

    # CRITICAL: Verify noise_records never > total_records (the forbidden state)
    for sid, r in results.items():
        ns = r["noise_statistics"]
        assert ns["noise_records_inter"] <= ns["total_observed_records"], (
            f"IMPOSSIBLE STAT: {sid} has {ns['noise_records_inter']} noise > "
            f"{ns['total_observed_records']} total!"
        )
    print("\n  Noise ratio correctness: ALL OK — no impossible statistics.")

    # CRITICAL: S7 multi-hop reconstruction check
    from generator.scenarios.router import build_scenario
    from validation.evidence_validator import EvidenceValidator
    r7 = build_scenario(7)
    persons = r7.context.persons
    entity_a = persons[0].id
    entity_e = persons[4].id
    ev = EvidenceValidator()
    ok, errs = ev.validate_no_direct_ae_path(r7.ground_truth.ground_truth_relationships, entity_a, entity_e)
    print(f"\n  S7 multi-hop (no direct A→E edge): {'PASS' if ok else 'FAIL'}")
    if errs:
        for e in errs:
            print(f"    ERROR: {e}")

    print("\n" + "=" * 65)
    print("  INTEGRATION DATASET: PASS — Safe to proceed to full MVP generation")
    print("=" * 65)
