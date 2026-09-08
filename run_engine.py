"""
SIH26189 Dataset Engine CLI Entry Point v1.1
Supports: --scenario 1-10  or  --scenario all
Invalid scenarios raise ValueError immediately (no silent fallback).
"""

import sys
import argparse
import json
from generator.engine import DatasetEngine


def main():
    parser = argparse.ArgumentParser(
        description="SIH26189 Master Synthetic Dataset Generator Engine"
    )
    parser.add_argument(
        "--scenario",
        type=str,
        default="10",
        help="Scenario number 1–10 or 'all' (default: 10)"
    )
    parser.add_argument("--seed",  type=int, default=26189, help="Random seed (default: 26189)")
    parser.add_argument("--noise-level", type=int, default=3, dest="noise_level",
                        help="Noise level 1–5 (default: 3 = ~60%% target)")
    parser.add_argument("--scale", type=str, default="mvp",
                        choices=["mvp", "demo", "final"],
                        help="Dataset scale (default: mvp)")

    args = parser.parse_args()
    scenario_arg = args.scenario.strip().lower()

    print("=" * 60)
    print("    SIH26189 MASTER DATASET ENGINE v1.1")
    print("=" * 60)
    print(f"  Scenario   : {scenario_arg.upper()}")
    print(f"  Seed       : {args.seed}")
    print(f"  Noise Level: {args.noise_level}")
    print(f"  Scale      : {args.scale.upper()}")
    print("-" * 60)

    engine = DatasetEngine(seed=args.seed, noise_level=args.noise_level, scale=args.scale)

    try:
        stats = engine.run_scenario(scenario_arg)
        print("\n[SUCCESS] Pipeline completed.")
        print(json.dumps(stats, indent=2, default=str))
    except ValueError as e:
        print(f"\n[ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
