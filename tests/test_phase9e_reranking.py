import pytest
from unittest.mock import MagicMock
from rag.vectorstore.retrieval import RetrievalAPI, RERANK_WEIGHTS

@pytest.fixture
def api():
    api = RetrievalAPI()
    api.model = MagicMock()
    
    mock_encode = MagicMock()
    mock_encode.tolist.return_value = [0.1] * 1024
    api.model.encode.return_value = mock_encode
    
    api.qdrant_client = MagicMock()
    return api

def test_rerank_disabled_preserves_results(api):
    api.qdrant_client.search.return_value = [
        {"id": "1", "score": 0.8, "payload": {"document_id": "doc1"}},
        {"id": "2", "score": 0.9, "payload": {"document_id": "doc2"}}
    ]
    # In pure semantic mode with no rerank, it should just sort by score descending as before.
    # Actually wait, in semantic without expansion, it just returns them in order received from Qdrant.
    # Qdrant returns them sorted by score descending, so we expect doc2 then doc1 if Qdrant behaved that way,
    # but since our mock returned doc1 then doc2, it preserves mock order.
    res = api.search("query", top_k=5, rerank=False)
    assert len(res) == 2
    assert res[0]["payload"]["document_id"] == "doc1"
    assert "rerank_score" not in res[0]

def test_rerank_enabled_reorders(api):
    api.qdrant_client.search.return_value = [
        {"id": "1", "score": 0.5, "payload": {"document_id": "doc_weak"}},
        {"id": "2", "score": 0.9, "payload": {"document_id": "doc_strong"}}
    ]
    res = api.search("query", top_k=5, rerank=True)
    assert len(res) == 2
    # doc_strong should be first due to higher score
    assert res[0]["payload"]["document_id"] == "doc_strong"
    assert res[0]["rerank_score"] == 0.9 * RERANK_WEIGHTS["semantic_base"]
    assert res[1]["payload"]["document_id"] == "doc_weak"
    assert res[1]["rerank_score"] == 0.5 * RERANK_WEIGHTS["semantic_base"]

def test_exact_match_boost(api):
    # doc1 is semantic weak, doc2 is exact ID match
    api.qdrant_client.search.return_value = [
        {"id": "1", "score": 0.99, "payload": {"document_id": "doc_strong_semantic"}}
    ]
    api.qdrant_client.search_exact.return_value = [
        {"id": "2", "score": 0.0, "payload": {"document_id": "doc_exact"}}
    ]
    
    # Use a query with both text and an ID so both semantic and exact searches run
    res = api.search("P-123 some other text", top_k=5, retrieval_mode="hybrid", rerank=True)
    assert len(res) == 2
    # doc_exact rerank_score: 0.0 + 1.0 = 1.0
    # doc_strong_semantic rerank_score: 0.99 + 0.0 = 0.99
    # doc_exact should win
    assert res[0]["payload"]["document_id"] == "doc_exact"
    assert res[0]["rerank_score"] == RERANK_WEIGHTS["exact_match_boost"]
    assert res[1]["payload"]["document_id"] == "doc_strong_semantic"
    assert res[1]["rerank_score"] == 0.99

def test_expansion_penalty(api):
    # doc_direct is a weak semantic match
    # doc_expanded is a strong semantic match but from depth=1
    api.qdrant_client.search.return_value = [
        {"id": "1", "score": 0.10, "payload": {"document_id": "doc_direct", "entity_refs": ["P-1"]}}
    ]
    # mock the exact search for expansion
    api.qdrant_client.search_exact.return_value = [
        {"id": "2", "score": 0.99, "payload": {"document_id": "doc_expanded"}} # Qdrant doesn't return score for scroll, but let's say it was populated or inherited.
        # Wait, exact search returns score 0.0. The only way it has a score is if it was retrieved semantically as well.
        # Let's mock a semantic hit that also gets picked up as expanded? 
        # Actually, if search_exact returns it, score is 0.0. 
        # But let's say it's 0.99 for testing the penalty logic.
    ]
    
    # Actually, in Phase 9C, exact_search returns score=0.0.
    # So an expanded document has score=0.0 natively. 
    # Let's adjust the test to just check the penalty application.
    
    # We will bypass the strict Qdrant score logic and just check if the penalty is subtracted.
    res = api.search("query", top_k=5, retrieval_mode="hybrid", entity_expansion=True, rerank=True)
    
    # doc_direct: score=0.1 -> rerank=0.1
    # doc_expanded: score=0.99 -> rerank = 0.99 - 0.15 = 0.84
    assert len(res) == 2
    doc_expanded = next(d for d in res if d["payload"]["document_id"] == "doc_expanded")
    assert doc_expanded["rerank_score"] == 0.99 * RERANK_WEIGHTS["semantic_base"] + RERANK_WEIGHTS["expansion_penalty"]
    
def test_tie_breaking(api):
    # two docs with exact same rerank score
    api.qdrant_client.search.return_value = [
        {"id": "2", "score": 0.5, "payload": {"document_id": "doc_Z"}},
        {"id": "1", "score": 0.5, "payload": {"document_id": "doc_A"}}
    ]
    res = api.search("query", top_k=5, rerank=True)
    assert res[0]["payload"]["document_id"] == "doc_A"
    assert res[1]["payload"]["document_id"] == "doc_Z"

def test_top_k_enforced(api):
    api.qdrant_client.search.return_value = [
        {"id": str(i), "score": 0.5, "payload": {"document_id": f"doc_{i}"}} for i in range(20)
    ]
    res = api.search("query", top_k=5, rerank=True)
    assert len(res) == 5
