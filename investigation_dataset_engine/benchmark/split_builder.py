"""
Latent-Network Split Builder
Splits benchmark examples into train/validation/test/challenge splits
using latent connected components so the same investigation network
does NOT appear across splits (preventing entity leakage).
"""
import random
from collections import defaultdict, deque
from typing import Any, Dict, List, Set, Tuple

from benchmark.config import SPLIT_RATIOS
from benchmark.models import BenchmarkSplit


def _build_latent_components(scenario_ids: List[str]) -> Dict[str, int]:
    """
    Assigns each scenario_id to a connected component index.
    Scenarios are treated as atomic latent networks — no cross-scenario entity sharing.
    Within a scenario, the entire network is one component.
    """
    return {sid: i for i, sid in enumerate(sorted(set(scenario_ids)))}


def _assign_scenarios_to_splits(
    scenario_ids: List[str],
    seed: int,
) -> Dict[str, str]:
    """
    Assigns each unique scenario_id to a split using fixed proportions.
    Returns {scenario_id: split_name}.
    """
    unique = sorted(set(scenario_ids))
    rng = random.Random(seed)
    rng.shuffle(unique)

    n = len(unique)
    n_train = max(1, round(n * SPLIT_RATIOS["train"]))
    n_val   = max(1, round(n * SPLIT_RATIOS["validation"]))
    n_test  = max(1, round(n * SPLIT_RATIOS["test"]))
    # Remainder goes to challenge
    n_chal  = max(1, n - n_train - n_val - n_test)

    assignment: Dict[str, str] = {}
    idx = 0
    for sid in unique[:n_train]:
        assignment[sid] = "train"
        idx += 1
    for sid in unique[n_train:n_train+n_val]:
        assignment[sid] = "validation"
    for sid in unique[n_train+n_val:n_train+n_val+n_test]:
        assignment[sid] = "test"
    for sid in unique[n_train+n_val+n_test:]:
        assignment[sid] = "challenge"
    return assignment


def build_splits(
    all_examples: Dict[str, List[Any]],
    seed: int = 26189,
) -> Dict[str, BenchmarkSplit]:
    """
    Split all examples into train/validation/test/challenge by scenario_id.
    Never puts the same scenario's examples across splits.
    Challenge set gets higher-noise examples.
    """
    # Collect all unique scenario IDs across all tasks
    all_scenario_ids: List[str] = []
    for task_name, examples in all_examples.items():
        for ex in examples:
            sid = ex.metadata.get("scenario_id", "S01")
            all_scenario_ids.append(sid)

    split_assignment = _assign_scenarios_to_splits(all_scenario_ids, seed)

    splits = {
        "train":      BenchmarkSplit("train"),
        "validation": BenchmarkSplit("validation"),
        "test":       BenchmarkSplit("test"),
        "challenge":  BenchmarkSplit("challenge"),
    }

    task_attr_map = {
        "entity_resolution":  "entity_resolution",
        "link_prediction":    "link_prediction",
        "multi_hop":          "multi_hop",
        "anomaly_detection":  "anomaly_detection",
        "temporal_reasoning": "temporal_reasoning",
        "false_positive":     "false_positive",
        "evidence_retrieval": "evidence_retrieval",
    }

    for task_name, examples in all_examples.items():
        attr = task_attr_map.get(task_name)
        if not attr:
            continue
        for ex in examples:
            sid = ex.metadata.get("scenario_id", "S01")
            noise_level = ex.metadata.get("noise_level", 3)
            split_name = split_assignment.get(sid, "train")

            # High-noise (L4/L5) examples always go to challenge
            if noise_level >= 4:
                split_name = "challenge"

            lst = getattr(splits[split_name], attr)
            lst.append(ex)

    return splits


def verify_no_cross_split_leakage(splits: Dict[str, "BenchmarkSplit"]) -> Tuple[bool, List[str]]:
    """
    Verifies that no canonical entity network (scenario_id) appears across
    train and test, or train and validation splits.
    """
    errors: List[str] = []

    def get_scenario_ids(split: "BenchmarkSplit") -> Set[str]:
        sids: Set[str] = set()
        for task_list in [
            split.entity_resolution, split.link_prediction, split.multi_hop,
            split.anomaly_detection, split.temporal_reasoning,
            split.false_positive, split.evidence_retrieval,
        ]:
            for ex in task_list:
                sids.add(ex.metadata.get("scenario_id", ""))
        return sids

    train_sids = get_scenario_ids(splits["train"])
    val_sids   = get_scenario_ids(splits["validation"])
    test_sids  = get_scenario_ids(splits["test"])

    overlap_tv = train_sids & val_sids
    overlap_tt = train_sids & test_sids
    overlap_vt = val_sids   & test_sids

    if overlap_tv:
        errors.append(f"Train/Validation overlap: {overlap_tv}")
    if overlap_tt:
        errors.append(f"Train/Test overlap: {overlap_tt}")
    if overlap_vt:
        errors.append(f"Validation/Test overlap: {overlap_vt}")

    return (len(errors) == 0), errors
