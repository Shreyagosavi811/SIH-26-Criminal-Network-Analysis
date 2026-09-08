from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.services.corpus_service import corpus_service
from app.services.network_service import build_network

app = FastAPI(title="SIH26189 Backend MVP API")

# Configure CORS for Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AIQueryRequest(BaseModel):
    query: str
    scenario_id: str

@app.get("/api/health")
def get_health():
    records = corpus_service.get_all_records()
    return {
        "status": "ok",
        "service": "SIH26189 Investigation API",
        "corpus": "corpus_small.jsonl",
        "records": len(records)
    }

@app.get("/api/scenarios")
def get_scenarios():
    scenarios = corpus_service.get_scenarios()
    return [
        {"scenario_id": sid, "record_count": count}
        for sid, count in scenarios.items()
    ]

@app.get("/api/records")
def get_records(
    scenario_id: Optional[str] = None,
    source_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    # Guard against too large limits to prevent memory issues in MVP
    if limit > 200:
        limit = 200
        
    records = corpus_service.get_records(
        scenario_id=scenario_id,
        source_type=source_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset
    )
    return {"total": len(records), "records": records}

@app.get("/api/entities/{entity_id}/records")
def get_entity_records(entity_id: str):
    records = corpus_service.get_records(entity_id=entity_id, limit=200)
    return {"entity_id": entity_id, "total": len(records), "records": records}

@app.get("/api/network/{scenario_id}")
def get_network(scenario_id: str):
    # Verify scenario exists
    scenarios = corpus_service.get_scenarios()
    if scenario_id not in scenarios:
        raise HTTPException(status_code=404, detail="Scenario not found")
        
    return build_network(scenario_id)

from app.services.retrieval_service import retrieval_service
from app.services.llm_service import llm_service

@app.post("/api/ai/query")
def ai_query(req: AIQueryRequest):
    # Phase 3A: Retrieve top-k records
    retrieved_records = retrieval_service.retrieve(query=req.query, scenario_id=req.scenario_id, top_k=5)
    
    # Phase 3B: Grounded LLM Response
    llm_response = llm_service.generate_grounded_response(query=req.query, retrieved_records=retrieved_records)
    
    return {
        "status": "success",
        "message": llm_response.get("answer", "No answer generated."),
        "query": req.query,
        "results": retrieved_records,
        "llm_response": llm_response
    }
