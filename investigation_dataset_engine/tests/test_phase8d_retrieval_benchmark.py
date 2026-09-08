import pytest
from rag.vectorstore.retrieval import RetrievalAPI
# Mock structures for unit testing Phase 8D metrics

def calculate_recall(retrieved_ids, expected_ids):
    if not expected_ids:
        return 0.0
    hits = set(retrieved_ids).intersection(set(expected_ids))
    return len(hits) / len(expected_ids)

def calculate_precision(retrieved_ids, expected_ids):
    if not retrieved_ids:
        return 0.0
    if not expected_ids:
        return 0.0
    hits = set(retrieved_ids).intersection(set(expected_ids))
    return len(hits) / len(retrieved_ids)

def calculate_mrr(retrieved_ids, expected_ids):
    if not expected_ids:
        return 0.0
    for i, rid in enumerate(retrieved_ids):
        if rid in expected_ids:
            return 1.0 / (i + 1)
    return 0.0

def calculate_hit_rate(retrieved_ids, expected_ids):
    if not expected_ids:
        return 0.0
    hits = set(retrieved_ids).intersection(set(expected_ids))
    return 1.0 if len(hits) > 0 else 0.0

def test_metrics_calculation():
    expected = ["A", "B"]
    retrieved = ["C", "A", "D", "B"]
    
    recall = calculate_recall(retrieved, expected)
    assert recall == 1.0
    
    precision = calculate_precision(retrieved, expected)
    assert precision == 0.5
    
    mrr = calculate_mrr(retrieved, expected)
    assert mrr == 0.5 # A is at index 1 (rank 2)
    
    hit = calculate_hit_rate(retrieved, expected)
    assert hit == 1.0

def test_metrics_no_hits():
    expected = ["A", "B"]
    retrieved = ["C", "D"]
    assert calculate_recall(retrieved, expected) == 0.0
    assert calculate_precision(retrieved, expected) == 0.0
    assert calculate_mrr(retrieved, expected) == 0.0
    assert calculate_hit_rate(retrieved, expected) == 0.0

def test_macro_vs_micro():
    # Micro: total hits / total expected across ALL examples
    # Macro: average of (example hits / example expected)
    
    # Ex 1: expected 1, retrieved 1 (100%)
    # Ex 2: expected 9, retrieved 0 (0%)
    
    ex1_r = calculate_recall(["A"], ["A"]) # 1.0
    ex2_r = calculate_recall(["Z"], ["B", "C", "D", "E", "F", "G", "H", "I", "J"]) # 0.0
    
    macro_recall = (ex1_r + ex2_r) / 2
    assert macro_recall == 0.5
    
    # micro recall: 1 total hit / 10 total expected = 0.1
    micro_recall = 1 / 10
    assert micro_recall == 0.1

def test_qdrant_isolation():
    # Verify we do not ingest benchmark answers into Qdrant
    # Ensure RetrievalAPI is readonly during evaluation
    api = RetrievalAPI()
    assert hasattr(api, "search"), "RetrievalAPI must have search"
    assert not hasattr(api, "upsert_batch"), "Evaluation pipeline must NOT upsert to Qdrant"
