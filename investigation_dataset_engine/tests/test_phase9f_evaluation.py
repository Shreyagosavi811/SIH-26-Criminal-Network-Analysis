import pytest
import json
from scripts.run_phase9f_evaluation import (
    calculate_recall,
    calculate_hit_rate,
    calculate_mrr,
    calculate_precision,
    build_investigation_context,
    build_expected_ids,
    get_cache_key
)

def test_recall():
    assert calculate_recall(["1", "2", "3"], ["1", "4"], 3) == 0.5
    assert calculate_recall(["1", "2", "3"], ["4", "5"], 3) == 0.0
    assert calculate_recall(["1", "2", "3"], ["1", "2"], 2) == 1.0
    assert calculate_recall([], ["1", "2"], 3) == 0.0
    assert calculate_recall(["1", "2", "3"], [], 3) == 0.0

def test_hit_rate():
    assert calculate_hit_rate(["1", "2", "3"], ["1", "4"], 3) == 1.0
    assert calculate_hit_rate(["1", "2", "3"], ["4", "5"], 3) == 0.0
    assert calculate_hit_rate([], ["1", "2"], 3) == 0.0
    assert calculate_hit_rate(["1", "2"], [], 3) == 0.0

def test_mrr():
    assert calculate_mrr(["1", "2", "3"], ["2", "4"]) == 0.5
    assert calculate_mrr(["1", "2", "3"], ["1", "4"]) == 1.0
    assert calculate_mrr(["1", "2", "3"], ["3"]) == 1.0 / 3.0
    assert calculate_mrr(["1", "2", "3"], ["4", "5"]) == 0.0
    assert calculate_mrr([], ["1", "2"]) == 0.0

def test_precision():
    assert calculate_precision(["1", "2", "3"], ["1", "4"], 3) == 1.0 / 3.0
    assert calculate_precision(["1", "2"], ["1", "2", "3"], 2) == 1.0
    assert calculate_precision(["1", "2"], ["3"], 2) == 0.0
    assert calculate_precision([], ["1"], 3) == 0.0
    assert calculate_precision(["1"], [], 3) == 0.0

def test_leakage_separation():
    # Prove that build_investigation_context doesn't read hidden targets
    item = {
        "id": "item1",
        "input": {
            "source_entity": "P-123",
            "target_entity": "P-456",
            "supporting_record_ids": ["FNOTE-S01-001"], # Expected ground truth
            "context_records": ["FNOTE-S01-002"] # Visible context
        },
        "metadata": {
            "supporting_evidence_hidden": ["CDR-S01-001"] # Hidden answer
        }
    }
    
    ctx = build_investigation_context("multi_hop", item)
    assert ctx is not None
    assert ctx.investigation_id == "multi_hop_item1"
    # Entity IDs are extracted because they are part of visible query context
    assert set(ctx.entity_ids) == {"P-123", "P-456"}
    
    # Assert ground truth ids are NOT in the context
    assert "FNOTE-S01-001" not in ctx.case_ids + ctx.entity_ids + ctx.person_ids
    assert "CDR-S01-001" not in ctx.case_ids + ctx.entity_ids + ctx.person_ids
    
def test_build_expected_ids():
    item = {
        "supporting_record_ids": ["FIU-S04-001", "OBS-INVALID-123", None]
    }
    canon, unresolved = build_expected_ids("evidence_retrieval", item)
    assert len(canon) == 1
    assert "S04::fiu_str_alerts::FIU-S04-001" in canon
    assert len(unresolved) == 1
    assert "OBS-INVALID-123" in unresolved

def test_cache_key_separation():
    # Cache key must differ by retrieval mode, expansion, rerank, and context
    k1 = get_cache_key("query", 10, 100, "semantic", False, False, "")
    k2 = get_cache_key("query", 10, 100, "hybrid", False, False, "")
    k3 = get_cache_key("query", 10, 100, "hybrid", True, False, "")
    k4 = get_cache_key("query", 10, 100, "hybrid", True, True, "")
    k5 = get_cache_key("query", 10, 100, "hybrid", True, True, "contextA")
    
    # All keys must be unique
    keys = [k1, k2, k3, k4, k5]
    assert len(set(keys)) == len(keys)
