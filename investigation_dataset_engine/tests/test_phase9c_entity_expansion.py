import pytest
from unittest.mock import MagicMock
from rag.vectorstore.retrieval import RetrievalAPI
from rag.investigation.context import InvestigationContext

@pytest.fixture
def api():
    api = RetrievalAPI()
    # Mock model and qdrant
    api.model = MagicMock()
    mock_encode = MagicMock()
    mock_encode.tolist.return_value = [0.1] * 1024
    api.model.encode.return_value = mock_encode
    api.qdrant_client = MagicMock()
    return api

def test_semantic_compatibility(api):
    api.qdrant_client.search.return_value = [{"id": "abc", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}]
    
    results = api.search("Find P-123", top_k=10, retrieval_mode="semantic")
    
    api.qdrant_client.search.assert_called_once()
    api.qdrant_client.search_exact.assert_not_called()
    assert len(results) == 1
    assert results[0]["retrieval_mode"] == "semantic"
    assert results[0]["expansion_depth"] == 0

def test_explicit_phase9c_activation(api):
    api.qdrant_client.search.return_value = [{"id": "abc", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}]
    
    # 9B hybrid without expansion
    results = api.search("Find P-101", top_k=10, retrieval_mode="hybrid", entity_expansion=False)
    api.qdrant_client.search_exact.assert_called_once() # Called for the exact ID P-101 from regex
    api.qdrant_client.search_exact.reset_mock()
    
    # Now with expansion
    api.qdrant_client.search_exact.return_value = []
    results = api.search("Find text", top_k=10, retrieval_mode="hybrid", entity_expansion=True)
    # search_exact is called because of expansion_entities
    api.qdrant_client.search_exact.assert_called_once()
    args, kwargs = api.qdrant_client.search_exact.call_args
    assert "P-101" in kwargs["identifiers"]

def test_entity_extraction_and_deduplication(api):
    # Setup multiple docs with overlapping entities
    api.qdrant_client.search.return_value = [
        {"id": "doc1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101", "PHONE-201"]}},
        {"id": "doc2", "score": 0.8, "payload": {"document_id": "doc2", "entity_refs": ["P-101", "VEH-301"]}},
        {"id": "doc3", "score": 0.7, "payload": {"document_id": "doc3"}} # empty refs
    ]
    
    api.qdrant_client.search_exact.return_value = []
    
    results = api.search("text", top_k=10, retrieval_mode="hybrid", entity_expansion=True)
    
    # Check that search_exact was called with deduplicated entities
    args, kwargs = api.qdrant_client.search_exact.call_args
    identifiers = kwargs["identifiers"]
    
    assert len(identifiers) == 3
    assert set(identifiers) == {"P-101", "PHONE-201", "VEH-301"}

def test_candidate_fusion_and_ranking(api):
    # Semantic finds doc1 (depth 0)
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}
    ]
    
    # Expansion finds doc2 and doc3 (depth 1)
    api.qdrant_client.search_exact.return_value = [
        {"id": "d2", "score": 0.0, "payload": {"document_id": "doc2", "entity_refs": ["P-101"]}},
        {"id": "d3", "score": 0.0, "payload": {"document_id": "doc3", "entity_refs": ["P-101"]}}
    ]
    
    results = api.search("text", top_k=2, retrieval_mode="hybrid", entity_expansion=True)
    
    # Top-K is 2, so one expansion candidate is dropped
    assert len(results) == 2
    
    # Ranked first is doc1 (depth 0)
    assert results[0]["payload"]["document_id"] == "doc1"
    assert results[0]["expansion_depth"] == 0
    
    # Ranked second is doc2 (depth 1)
    assert results[1]["payload"]["document_id"] == "doc2"
    assert results[1]["expansion_depth"] == 1
    assert "entity_expansion" in results[1]["retrieval_signals"]

def test_multiple_discovery_paths(api):
    # If a document is found by both semantic and entity expansion, it keeps depth 0
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}
    ]
    
    api.qdrant_client.search_exact.return_value = [
        {"id": "d1_dup", "score": 0.0, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}
    ]
    
    results = api.search("text", top_k=10, retrieval_mode="hybrid", entity_expansion=True)
    
    assert len(results) == 1
    assert results[0]["expansion_depth"] == 0
    assert "semantic" in results[0]["retrieval_signals"]
    assert "entity_expansion" in results[0]["retrieval_signals"]

def test_context_filtering(api):
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-101"]}}
    ]
    
    ctx = InvestigationContext(investigation_id="inv-1", source_type_filters=["cbs_bank_transactions"])
    
    results = api.search("text", top_k=10, retrieval_mode="hybrid", entity_expansion=True, investigation_context=ctx)
    
    args, kwargs = api.qdrant_client.search_exact.call_args
    assert kwargs["investigation_context"] == ctx

def test_expansion_budget(api):
    # Create 30 distinct entities in semantic results
    entities = [f"P-{i}" for i in range(30)]
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": entities}}
    ]
    
    api.search("text", top_k=10, retrieval_mode="hybrid", entity_expansion=True)
    
    args, kwargs = api.qdrant_client.search_exact.call_args
    assert len(kwargs["identifiers"]) == 20 # Max entities is bounded to 20
