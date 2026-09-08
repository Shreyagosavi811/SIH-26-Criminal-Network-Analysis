"""
SIH26189 Benchmark Export CLI — Phase 7A
Usage:
    python run_benchmark_export.py [--seed SEED] [--noise-level N]
                                   [--scenarios 1,4,7,10] [--output-dir PATH]
                                   [--dry-run]

Reads generated output from output/ and writes to output/ML_BENCHMARK/:
    train.json  validation.json  test.json  challenge.json  benchmark_manifest.json

Fails clearly if required generated output files are missing or malformed.
"""

import argparse
import json
import sys

from benchmark.export_runner import BenchmarkExportRunner, BenchmarkExportError


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "SIH26189 Benchmark Export — builds ML_BENCHMARK splits from "
            "generated output/. Run `python run_engine.py --scenario all` first."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=26189,
        help="Random seed used for split assignments (default: 26189).",
    )
    parser.add_argument(
        "--noise-level",
        dest="noise_level",
        type=int,
        default=3,
        choices=[1, 2, 3, 4, 5],
        help="Noise level to record in the manifest (1–5, default: 3).",
    )
    parser.add_argument(
        "--scenarios",
        type=str,
        default=None,
        help=(
            "Comma-separated scenario numbers to include (e.g. 1,4,7,10). "
            "Defaults to all 10 scenarios; only available ones will be used."
        ),
    )
    parser.add_argument(
        "--output-dir",
        dest="output_dir",
        type=str,
        default=None,
        help=(
            "Override the output directory for ML_BENCHMARK files. "
            "Defaults to output/ML_BENCHMARK/ relative to the engine root."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        default=False,
        help=(
            "Discover and report which scenarios are available without "
            "building or writing any files."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    # Parse --scenarios
    scenarios = None
    if args.scenarios:
        try:
            scenarios = [int(s.strip()) for s in args.scenarios.split(",") if s.strip()]
        except ValueError:
            print(
                f"[ERROR] --scenarios must be comma-separated integers, "
                f"got: {args.scenarios!r}",
                file=sys.stderr,
            )
            sys.exit(2)
        invalid = [s for s in scenarios if s < 1 or s > 10]
        if invalid:
            print(
                f"[ERROR] Invalid scenario numbers: {invalid}. Valid range is 1–10.",
                file=sys.stderr,
            )
            sys.exit(2)

    print("=" * 65)
    print("   SIH26189 Benchmark Export CLI — Phase 7A")
    print("=" * 65)
    print(f"  Seed       : {args.seed}")
    print(f"  Noise Level: {args.noise_level}")
    print(f"  Scenarios  : {scenarios or 'all (1–10)'}")
    if args.output_dir:
        print(f"  Output Dir : {args.output_dir}")
    if args.dry_run:
        print("  Mode       : DRY-RUN (no files written)")
    print("-" * 65)

    if args.dry_run:
        from benchmark.loader import BenchmarkLoader
        loader    = BenchmarkLoader(scenarios)
        available = loader.available_scenarios()
        if available:
            print(f"[DRY-RUN] Available scenarios: {[f'S{s:02d}' for s in available]}")
        else:
            print(
                "[DRY-RUN] No generated scenarios found. "
                "Run `python run_engine.py --scenario all` first."
            )
        sys.exit(0)

    runner = BenchmarkExportRunner(
        scenarios   = scenarios,
        seed        = args.seed,
        noise_level = args.noise_level,
        output_dir  = args.output_dir,
    )

    try:
        summary = runner.run()
    except BenchmarkExportError as exc:
        print(f"\n[ERROR] {exc}", file=sys.stderr)
        sys.exit(1)

    print("\n" + "=" * 65)
    print("   BENCHMARK EXPORT COMPLETE")
    print("=" * 65)
    print(f"  Total examples : {summary['total_examples']}")
    print(f"  Leakage check  : {'PASS' if summary['leakage_passed'] else 'FAIL'}")
    print(f"  Output dir     : {summary['output_dir']}")
    print()
    print("  Per-task counts:")
    for task, count in summary["per_task"].items():
        print(f"    {task:<28} {count}")
    print()
    print("  Per-split totals:")
    for split, counts in summary["split_sizes"].items():
        print(f"    {split:<12} {counts.get('total', 0)} examples")
    print()
    print(f"  Manifest       : {summary['manifest_path']}")
    print("=" * 65)

    # Dump summary JSON to stdout (parseable by downstream tools)
    print(json.dumps(summary, indent=2, default=str))


if __name__ == "__main__":
    main()
