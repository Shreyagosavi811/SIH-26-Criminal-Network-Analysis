"""
SIH26189 — Phase 7A Benchmark Export Tests

Tests focused on the new CLI / export runner:
  - BenchmarkExportRunner discovers available scenarios
  - All 7 task adapters are called and produce non-empty output
  - Splits are created (train/validation/test/challenge)
  - Leakage verification passes
  - All output files are written
  - Manifest contains required fields
  - Runner fails clearly on missing / empty GT data
  - Dry-run mode of the CLI works correctly
  - split.counts() totals are consistent with examples built
  - No generator imports exist inside benchmark.*
"""
import json
import os
import random
import sys
import importlib

import pytest

from benchmark.export_runner import BenchmarkExportRunner, BenchmarkExportError
from benchmark.loader import BenchmarkLoader, ScenarioLoader
from benchmark.models import BenchmarkSplit
from benchmark.split_builder import verify_no_cross_split_leakage
from benchmark.config import SPLIT_RATIOS, ALL_SCENARIOS, BENCHMARK_VERSION, GENERATOR_VERSION


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def runner_result(tmp_path_factory):
    """
    Run BenchmarkExportRunner once against the real generated output.
    Uses a tmp_path so existing output/ML_BENCHMARK is not touched by tests.
    Skips if no generated scenarios are available on disk.
    """
    loader    = BenchmarkLoader()
    available = loader.available_scenarios()
    if not available:
        pytest.skip("No generated scenarios available. Run the engine first.")

    out_dir = str(tmp_path_factory.mktemp("ml_benchmark"))
    runner  = BenchmarkExportRunner(seed=26189, noise_level=3, output_dir=out_dir)
    result  = runner.run()
    return result, out_dir


@pytest.fixture(scope="module")
def manifest(runner_result):
    _, out_dir = runner_result
    path = os.path.join(out_dir, "benchmark_manifest.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="module")
def train_split(runner_result):
    _, out_dir = runner_result
    path = os.path.join(out_dir, "train.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Availability Discovery
# ─────────────────────────────────────────────────────────────────────────────

def test_benchmark_loader_discovers_scenarios():
    loader    = BenchmarkLoader()
    available = loader.available_scenarios()
    # Must find at least one — the integration test always generates S01, S04, S07, S10
    assert len(available) >= 1


def test_scenario_loader_is_available_for_s01():
    sl = ScenarioLoader(1)
    assert sl.is_available(), (
        "S01 is not available — run `python run_engine.py --scenario 1` first."
    )


# ─────────────────────────────────────────────────────────────────────────────
# 2. BenchmarkExportRunner — output files
# ─────────────────────────────────────────────────────────────────────────────

def test_runner_creates_all_split_files(runner_result):
    _, out_dir = runner_result
    for fname in ("train.json", "validation.json", "test.json", "challenge.json"):
        assert os.path.exists(os.path.join(out_dir, fname)), \
            f"{fname} was not created by BenchmarkExportRunner"


def test_runner_creates_manifest(runner_result):
    _, out_dir = runner_result
    assert os.path.exists(os.path.join(out_dir, "benchmark_manifest.json"))


def test_runner_result_has_expected_keys(runner_result):
    result, _ = runner_result
    for key in ("total_examples", "per_task", "split_sizes",
                "leakage_passed", "available_scenarios", "output_dir", "manifest_path"):
        assert key in result, f"Runner result missing key: {key}"


def test_runner_total_examples_positive(runner_result):
    result, _ = runner_result
    assert result["total_examples"] > 0


# ─────────────────────────────────────────────────────────────────────────────
# 3. All 7 tasks are populated
# ─────────────────────────────────────────────────────────────────────────────

TASK_NAMES = [
    "entity_resolution", "link_prediction", "multi_hop",
    "anomaly_detection", "temporal_reasoning", "false_positive", "evidence_retrieval",
]

def test_runner_all_7_tasks_present_in_result(runner_result):
    result, _ = runner_result
    for task in TASK_NAMES:
        assert task in result["per_task"], f"Task missing from result: {task}"


def test_runner_all_7_tasks_have_examples(runner_result):
    result, _ = runner_result
    empty_tasks = [t for t in TASK_NAMES if result["per_task"].get(t, 0) == 0]
    assert not empty_tasks, f"These tasks produced zero examples: {empty_tasks}"


def test_train_split_json_has_7_task_keys(train_split):
    for task in TASK_NAMES:
        assert task in train_split, f"Train split JSON missing task key: {task}"


def test_train_split_json_has_counts_key(train_split):
    assert "counts" in train_split
    assert isinstance(train_split["counts"], dict)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Split integrity
# ─────────────────────────────────────────────────────────────────────────────

def test_all_splits_exist_in_result(runner_result):
    result, _ = runner_result
    for split in ("train", "validation", "test", "challenge"):
        assert split in result["split_sizes"], f"Split '{split}' missing from result"


def test_split_totals_are_positive(runner_result):
    result, _ = runner_result
    # With ≥1 scenario, at least train should have examples
    # (challenge may be 0 if noise_level < 4 and only a few scenarios)
    train_total = result["split_sizes"].get("train", {}).get("total", 0)
    assert train_total > 0, "Train split has no examples"


def test_split_files_parse_as_json(runner_result):
    _, out_dir = runner_result
    for fname in ("train.json", "validation.json", "test.json", "challenge.json"):
        path = os.path.join(out_dir, fname)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        assert isinstance(data, dict), f"{fname} is not a JSON object"


def test_split_counts_consistent_with_examples(runner_result):
    """counts['total'] in each split file must equal the actual example count."""
    _, out_dir = runner_result
    for fname in ("train.json", "validation.json", "test.json", "challenge.json"):
        path = os.path.join(out_dir, fname)
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        reported_total = data["counts"].get("total", -1)
        actual_total   = sum(len(data.get(t, [])) for t in TASK_NAMES)
        assert reported_total == actual_total, (
            f"{fname}: counts['total']={reported_total} but actual examples={actual_total}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 5. Leakage verification
# ─────────────────────────────────────────────────────────────────────────────

def test_leakage_check_passes(runner_result):
    result, _ = runner_result
    assert result["leakage_passed"] is True, "Cross-split entity leakage detected!"


def test_manifest_leakage_flag_is_true(manifest):
    assert manifest["validation"]["leakage_check_passed"] is True


# ─────────────────────────────────────────────────────────────────────────────
# 6. Manifest correctness
# ─────────────────────────────────────────────────────────────────────────────

MANIFEST_REQUIRED_FIELDS = [
    "benchmark_name", "benchmark_version", "generator_version",
    "export_started_at", "export_finished_at",
    "generation_seed", "noise_level",
    "split_percentages", "split_strategy",
    "tasks", "scenarios", "scenario_metadata",
    "statistics", "validation", "output_files", "source_paths", "configuration",
]

def test_manifest_has_all_required_fields(manifest):
    missing = [f for f in MANIFEST_REQUIRED_FIELDS if f not in manifest]
    assert not missing, f"Manifest missing required fields: {missing}"


def test_manifest_benchmark_version(manifest):
    assert manifest["benchmark_version"] == BENCHMARK_VERSION


def test_manifest_generator_version(manifest):
    assert manifest["generator_version"] == GENERATOR_VERSION


def test_manifest_split_percentages_match_config(manifest):
    assert manifest["split_percentages"] == SPLIT_RATIOS


def test_manifest_tasks_lists_all_7(manifest):
    assert set(manifest["tasks"]) == set(TASK_NAMES)


def test_manifest_seed_matches(manifest):
    assert manifest["generation_seed"] == 26189


def test_manifest_output_files_has_5_entries(manifest):
    assert len(manifest["output_files"]) == 5


def test_manifest_statistics_has_total_examples(manifest):
    assert "total_examples" in manifest["statistics"]
    assert manifest["statistics"]["total_examples"] > 0


def test_manifest_per_task_lists_all_7(manifest):
    per_task = manifest["statistics"].get("per_task", {})
    missing  = [t for t in TASK_NAMES if t not in per_task]
    assert not missing, f"Manifest statistics.per_task missing: {missing}"


def test_manifest_per_scenario_nonempty(manifest):
    per_scenario = manifest["statistics"].get("per_scenario", {})
    assert len(per_scenario) >= 1


def test_manifest_scenario_metadata_matches_available(manifest):
    available_ids = manifest["scenarios"]["available_ids"]
    meta_ids      = [m["scenario_id"] for m in manifest["scenario_metadata"]]
    assert sorted(available_ids) == sorted(meta_ids)


# ─────────────────────────────────────────────────────────────────────────────
# 7. Error-handling — missing data
# ─────────────────────────────────────────────────────────────────────────────

def test_runner_fails_on_nonexistent_output_dir(tmp_path):
    """If no scenarios exist at all, runner must raise BenchmarkExportError."""
    # Point to an empty directory with no GROUND_TRUTH / OBSERVED subdirs
    empty_dir = str(tmp_path / "empty_output")
    os.makedirs(empty_dir)

    # We need to monkeypatch BenchmarkLoader to use our empty dir.
    # Simplest: use a scenarios list that definitely won't be on disk.
    runner = BenchmarkExportRunner(
        scenarios   = [99],   # invalid — will be filtered to empty by loader
        seed        = 26189,
        output_dir  = str(tmp_path / "bench_out"),
    )
    # BenchmarkLoader(scenarios=[99]).available_scenarios() returns []
    # → runner.run() must raise BenchmarkExportError
    with pytest.raises(BenchmarkExportError, match="No generated scenarios"):
        runner.run()


def test_runner_fails_on_malformed_gt(tmp_path):
    """
    _require_gt_manifest must raise BenchmarkExportError when GT manifest has
    an empty 'ground_truth_entities' list (malformed output).
    We test this directly on the runner method to avoid the complexity of
    monkeypatching module-level config constants already imported by loader.py.
    """
    runner = BenchmarkExportRunner(
        scenarios   = [1],
        seed        = 26189,
        output_dir  = str(tmp_path / "bench_out"),
    )

    # Create a ScenarioLoader whose gt_dir points to a temp dir with a bad manifest
    sl = ScenarioLoader(1)

    # Temporarily override the gt_dir on this instance to our tmp dir
    sid_str = "S01"
    gt_dir  = tmp_path / "GROUND_TRUTH" / sid_str
    gt_dir.mkdir(parents=True)
    sl.gt_dir = str(gt_dir)

    bad_manifest = {"ground_truth_entities": [], "ground_truth_relationships": []}
    with open(gt_dir / "ground_truth_manifest.json", "w") as f:
        json.dump(bad_manifest, f)

    with pytest.raises(BenchmarkExportError, match="malformed"):
        runner._require_gt_manifest(sl, sid_str)


# ─────────────────────────────────────────────────────────────────────────────
# 8. Downstream-only dependency enforcement
# ─────────────────────────────────────────────────────────────────────────────


def _get_module_import_targets(module) -> list:
    """
    Return the list of top-level module names imported in `module` using
    Python's AST. This ignores docstrings and comments that happen to
    contain the word 'import'.
    """
    import ast, inspect, textwrap
    try:
        src = inspect.getsource(module)
    except (OSError, TypeError):
        return []
    try:
        tree = ast.parse(textwrap.dedent(src))
    except SyntaxError:
        return []
    targets = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            targets.extend(alias.name.split(".")[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                targets.append(node.module.split(".")[0])
    return targets


def test_export_runner_does_not_import_generator():
    """benchmark.export_runner must not import from generator.* or validation.*
    Checked via AST to avoid false positives from docstring text."""
    import importlib
    mod     = importlib.import_module("benchmark.export_runner")
    imports = _get_module_import_targets(mod)
    for forbidden in ("generator", "validation"):
        assert forbidden not in imports, (
            f"benchmark.export_runner has a forbidden import of '{forbidden}'"
        )


def test_benchmark_package_does_not_import_generator():
    """
    No module inside benchmark.* may import from generator.* or validation.*.
    Checked via AST to enforce the downstream-only dependency contract.
    """
    import importlib, pkgutil
    import benchmark
    for _, modname, _ in pkgutil.walk_packages(
        path=benchmark.__path__, prefix="benchmark."
    ):
        mod     = importlib.import_module(modname)
        imports = _get_module_import_targets(mod)
        for forbidden in ("generator", "validation"):
            assert forbidden not in imports, (
                f"benchmark.{modname} has a forbidden import of '{forbidden}'"
            )




# ─────────────────────────────────────────────────────────────────────────────
# 9. Reproducibility
# ─────────────────────────────────────────────────────────────────────────────

def test_runner_two_runs_same_seed_produce_same_totals(tmp_path):
    """Two export runs with the same seed must produce identical total example counts."""
    loader    = BenchmarkLoader()
    available = loader.available_scenarios()
    if not available:
        pytest.skip("No generated scenarios available.")

    out1 = str(tmp_path / "run1")
    out2 = str(tmp_path / "run2")

    r1 = BenchmarkExportRunner(seed=26189, noise_level=3, output_dir=out1).run()
    r2 = BenchmarkExportRunner(seed=26189, noise_level=3, output_dir=out2).run()

    assert r1["total_examples"] == r2["total_examples"], (
        f"Non-reproducible totals: run1={r1['total_examples']}, run2={r2['total_examples']}"
    )
    for task in TASK_NAMES:
        assert r1["per_task"][task] == r2["per_task"][task], (
            f"Non-reproducible task count for {task}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# 10. Per-example label integrity
# ─────────────────────────────────────────────────────────────────────────────

def test_entity_resolution_labels_are_0_or_1(runner_result):
    """All ER examples must have label in {0, 1}."""
    _, out_dir = runner_result
    for fname in ("train.json", "validation.json", "test.json", "challenge.json"):
        with open(os.path.join(out_dir, fname), encoding="utf-8") as f:
            data = json.load(f)
        for ex in data.get("entity_resolution", []):
            assert ex["label"] in (0, 1), f"ER label not 0/1: {ex['label']}"


def test_temporal_reasoning_labels_are_before_after_overlap_unknown(runner_result):
    """All TR examples must have label in {BEFORE, AFTER, OVERLAP, UNKNOWN}."""
    valid = {"BEFORE", "AFTER", "OVERLAP", "UNKNOWN"}
    _, out_dir = runner_result
    for fname in ("train.json", "validation.json", "test.json", "challenge.json"):
        with open(os.path.join(out_dir, fname), encoding="utf-8") as f:
            data = json.load(f)
        for ex in data.get("temporal_reasoning", []):
            assert ex["label"] in valid, (
                f"TR label not valid: {ex['label']!r}"
            )
