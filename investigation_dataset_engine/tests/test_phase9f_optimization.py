import pytest
from unittest.mock import MagicMock
from scripts.run_phase9f_evaluation import run_evaluation_for_split
import json
import os

def test_evaluator_embedding_caching(monkeypatch, tmp_path):
    # Setup a fake benchmark file
    fake_benchmark = {
        "evidence_retrieval": [
            {
                "id": "1",
                "input": {"claim": "Unique query A"},
                "supporting_record_ids": ["FIU-123"]
            },
            {
                "id": "2",
                "input": {"claim": "Unique query B"},
                "supporting_record_ids": ["FIU-456"]
            }
        ]
    }
    
    benchmark_dir = tmp_path / "output" / "FINAL_EVALUATION" / "output" / "ML_BENCHMARK"
    benchmark_dir.mkdir(parents=True, exist_ok=True)
    with open(benchmark_dir / "validation.json", "w") as f:
        json.dump(fake_benchmark, f)
        
    eval_dir = tmp_path / "output" / "RAG_EVALUATION"
    eval_dir.mkdir(parents=True, exist_ok=True)
    
    # Mock the RetrievalAPI
    class MockRetrievalAPI:
        def __init__(self):
            self.model = MagicMock()
            self.model.encode = MagicMock(return_value=[0.1, 0.2, 0.3])
            
            self.qdrant_client = MagicMock()
            self.qdrant_client.count.return_value = 100
            
            # search_exact returns empty to not crash
            self.qdrant_client.search_exact.return_value = []
            
        def search(self, query, top_k=20, investigation_context=None, **kwargs):
            # Simulate what the search method does: call model.encode
            # In the real code, api.search calls self.model.encode.
            # But here we are mocking api entirely? 
            # Wait, if we mock the entire API, the evaluator wraps api.model.encode, 
            # BUT the evaluator calls api.search(), which is mocked here, so it WON'T 
            # call api.model.encode! We need to mock ONLY Qdrant and SentenceTransformer 
            # so the real RetrievalAPI logic runs.
            pass

    # A better approach: Mock SentenceTransformer and QdrantEvidenceClient
    # so RetrievalAPI initializes without loading BGE-M3.
    from rag.vectorstore.retrieval import RetrievalAPI
    
    # To track calls across the patched model:
    encode_call_count = 0
    
    class FakeModel:
        def __init__(self):
            pass
        def get_sentence_embedding_dimension(self): 
            return 1024
        def encode(self, text, convert_to_numpy=True):
            nonlocal encode_call_count
            encode_call_count += 1
            return [0.1] * 1024
            
    class FakeQdrant:
        def __init__(self, *args, **kwargs):
            self.collection_name = "test"
            self.client = FakeClient()
        def count(self): return 100
        def search(self, *args, **kwargs): return []
        def search_exact(self, *args, **kwargs): return []
        
    class FakeClient:
        def retrieve(self, *args, **kwargs): return []
        
    monkeypatch.setattr("rag.vectorstore.retrieval.SentenceTransformer", lambda *args, **kwargs: FakeModel())
    monkeypatch.setattr("rag.vectorstore.retrieval.QdrantEvidenceClient", FakeQdrant)
    
    # We must also mock sqlite cache directory or it will write to real output/
    monkeypatch.setattr("os.makedirs", lambda *args, **kwargs: None)
    
    monkeypatch.chdir(tmp_path)
    
    import sqlite3
    def fake_setup_cache(db_path):
        conn = sqlite3.connect(":memory:")
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS cache (query_hash TEXT PRIMARY KEY, retrieved_ids TEXT)''')
        conn.commit()
        return conn
        
    monkeypatch.setattr("scripts.run_phase9f_evaluation.setup_cache", fake_setup_cache)
    monkeypatch.setattr("scripts.run_phase9f_evaluation.check_target_in_index", lambda *args, **kwargs: False)
    monkeypatch.setattr("scripts.run_phase9f_evaluation.resolve_canonical_id", lambda x: f"canonical_{x}")

    # Run the evaluation
    run_evaluation_for_split("validation", sample=0)
    
    # Since there are 2 queries and 4 modes per query, api.search is called 8 times total.
    # Without caching, encode_call_count would be 8 (or 4 per item).
    # With caching, encode_call_count MUST be exactly 2 (once per unique semantic_text).
    assert encode_call_count == 2


