import pytest
from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["corpus"] == "corpus_small.jsonl"
    assert data["records"] == 100

def test_scenarios():
    response = client.get("/api/scenarios")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["scenario_id"] == "S01"
    assert data[0]["record_count"] == 100

def test_records_and_provenance_security():
    response = client.get("/api/records?scenario_id=S01&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    
    for record in data["records"]:
        # Verify no ground truth
        raw_text = json.dumps(record)
        assert "GROUND_TRUTH" not in raw_text
        
        # Verify provenance sanitization
        prov = record.get("provenance", {})
        source_path = prov.get("source_path", "")
        # Should not have C:\\, d:\\, or output/FINAL_EVALUATION/
        assert ":" not in source_path
        assert "output/FINAL_EVALUATION" not in source_path
        assert source_path.startswith("Redacted /")

def test_entity_lookup():
    response = client.get("/api/entities/3189/records")
    assert response.status_code == 200
    data = response.json()
    # Entity 3189 should definitely have records since it's an account
    assert data["total"] > 0

def test_network():
    response = client.get("/api/network/S01")
    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    # At least some nodes and edges should be derived
    assert len(data["nodes"]) > 0

def test_ai_query():
    response = client.post("/api/ai/query", json={"query": "payment", "scenario_id": "S01"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    # Depending on whether GEMINI_API_KEY is present, it could be a fallback or an LLM answer
    # but it will always return llm_response object
    assert "llm_response" in data
    llm = data["llm_response"]
    assert "answer" in llm
    assert "citations" in llm
    assert "evidence_basis" in llm
    assert "confidence" in llm
