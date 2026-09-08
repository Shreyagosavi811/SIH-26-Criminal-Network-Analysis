"""
End-to-end integration tests for DatasetEngine pipeline execution and reproducibility.
Updated for v1.1 engine (uses scenario router + DataDrivenSerializer).
"""

import os
from generator.engine import DatasetEngine


def test_pipeline_execution_scenario_10(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=3, scale="mvp")
    stats = engine.run_pipeline_for_scenario_10()

    assert stats["audit_passed"] is True
    assert stats["gt_entities"] >= 4, "S10 must have at least 4 GT entities"
    assert stats["total_observed_records"] > 0

    # Files must be written to scenario-specific subdirs
    sid_str = "S10"
    assert os.path.exists(os.path.join(tmp_path, "output", "GROUND_TRUTH", sid_str, "ground_truth_manifest.json"))
    assert os.path.exists(os.path.join(tmp_path, "output", "OBSERVED", sid_str, "cctns_fir_records.json"))
    assert os.path.exists(os.path.join(tmp_path, "output", "OBSERVED", sid_str, "telecom_cdr_logs.csv"))


def test_reproducibility(tmp_path):
    dir1 = tmp_path / "run1"
    dir2 = tmp_path / "run2"

    engine1 = DatasetEngine(base_dir=str(dir1), seed=26189, noise_level=3)
    stats1 = engine1.run_pipeline_for_scenario_10()

    engine2 = DatasetEngine(base_dir=str(dir2), seed=26189, noise_level=3)
    stats2 = engine2.run_pipeline_for_scenario_10()

    assert stats1["total_observed_records"] == stats2["total_observed_records"]
    assert stats1["gt_entities"] == stats2["gt_entities"]
    assert stats1["noise_statistics"]["measured_noise_ratio"] == \
           stats2["noise_statistics"]["measured_noise_ratio"]
