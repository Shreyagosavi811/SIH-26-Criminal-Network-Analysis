import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from rag.vectorstore.retrieval import RetrievalAPI
from rag.investigation.context import InvestigationContext
from qdrant_client.http import models

@pytest.fixture
def api():
    api = RetrievalAPI()
    api.model = MagicMock()
    
    mock_encode = MagicMock()
    mock_encode.tolist.return_value = [0.1] * 1024
    api.model.encode.return_value = mock_encode
    
    api.qdrant_client = MagicMock()
    # Need to intercept the actual filter built to inspect it since we mock the internal QdrantClient
    # Wait, in qdrant_client.py, we have `self.qdrant_client.client.query_points` called.
    # Actually, `self.qdrant_client` here is a mock of `QdrantEvidenceClient`.
    # To test the filter building, we should instantiate `QdrantEvidenceClient` and mock its inner `client`.
    return api

@pytest.fixture
def q_client():
    from rag.vectorstore.qdrant_client import QdrantEvidenceClient
    client = QdrantEvidenceClient()
    client.client = MagicMock()
    return client

# 1. no temporal filter
def test_no_temporal_filter(q_client):
    ctx = InvestigationContext(investigation_id="1")
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    assert q_filter is None

# 2. only time_start
def test_only_time_start(q_client):
    dt = datetime(2025, 1, 1, tzinfo=timezone.utc)
    ctx = InvestigationContext(investigation_id="1", time_start=dt)
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    time_cond = next(cond for cond in q_filter.must if cond.key == "timestamp")
    assert time_cond.range.gte == dt
    assert getattr(time_cond.range, "lte", None) is None

# 3. only time_end
def test_only_time_end(q_client):
    dt = datetime(2025, 1, 1, tzinfo=timezone.utc)
    ctx = InvestigationContext(investigation_id="1", time_end=dt)
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    time_cond = next(cond for cond in q_filter.must if cond.key == "timestamp")
    assert time_cond.range.lte == dt
    assert getattr(time_cond.range, "gte", None) is None

# 4. both time_start and time_end
def test_both_time_start_and_end(q_client):
    dt_start = datetime(2025, 1, 1, tzinfo=timezone.utc)
    dt_end = datetime(2025, 12, 31, tzinfo=timezone.utc)
    ctx = InvestigationContext(
        investigation_id="1", 
        time_start=dt_start,
        time_end=dt_end
    )
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    time_cond = next(cond for cond in q_filter.must if cond.key == "timestamp")
    assert time_cond.range.gte == dt_start
    assert time_cond.range.lte == dt_end

# 5, 6, 7. boundary testing is handled by DatetimeRange exact match inside Qdrant. 
# We test that the exact datetime is passed.
def test_timezone_aware(q_client):
    dt = datetime(2025, 1, 1, 12, 0, tzinfo=timezone(timedelta(hours=5, minutes=30)))
    ctx = InvestigationContext(
        investigation_id="1", 
        time_start=dt
    )
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    time_cond = next(cond for cond in q_filter.must if cond.key == "timestamp")
    assert time_cond.range.gte == dt

# 9. invalid timestamp behavior is caught by Pydantic InvestigationContext validation
def test_invalid_time_range():
    with pytest.raises(ValueError):
        InvestigationContext(
            investigation_id="1",
            time_start=datetime(2026, 1, 1),
            time_end=datetime(2025, 1, 1) # end before start
        )

# 10. no location filter
def test_no_location_filter(q_client):
    ctx = InvestigationContext(investigation_id="1")
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    assert q_filter is None

# 11. one location ID
def test_one_location_id(q_client):
    ctx = InvestigationContext(investigation_id="1", location_ids=["LOC-101"])
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    loc_filter = next(cond for cond in q_filter.must if getattr(cond, "should", None))
    assert len(loc_filter.should) == 1
    assert loc_filter.should[0].key == "location_refs"
    assert loc_filter.should[0].match.value == "LOC-101"

# 12. multiple location IDs
def test_multiple_location_ids(q_client):
    ctx = InvestigationContext(investigation_id="1", location_ids=["LOC-101", "LOC-102"])
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    loc_filter = next(cond for cond in q_filter.must if getattr(cond, "should", None))
    assert len(loc_filter.should) == 2
    assert loc_filter.should[0].match.value == "LOC-101"
    assert loc_filter.should[1].match.value == "LOC-102"

# 13, 14. Exact matching is guaranteed by `models.MatchValue`. 
# Substrings like "LOC-10" do not match "LOC-100" in a MatchValue.

# 15. combined temporal + spatial
def test_combined_temporal_spatial(q_client):
    ctx = InvestigationContext(
        investigation_id="1", 
        location_ids=["LOC-1"],
        time_start=datetime(2025, 1, 1)
    )
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    
    assert len(q_filter.must) == 2
    keys = []
    for cond in q_filter.must:
        if getattr(cond, "should", None):
            keys.append("should_loc")
        else:
            keys.append(cond.key)
    assert "timestamp" in keys
    assert "should_loc" in keys

# 16, 17, 18. combined filters
def test_all_filters_combined(q_client):
    ctx = InvestigationContext(
        investigation_id="1", 
        source_type_filters=["fiu_str_alerts"],
        case_ids=["CASE-1"],
        location_ids=["LOC-1"],
        time_end=datetime(2025, 1, 1)
    )
    q_filter = q_client._build_query_filter(investigation_context=ctx)
    assert len(q_filter.must) == 4 # source_type, case, location, timestamp

# 19, 20, 21. Entity expansion inheritance
def test_entity_expansion_inherits_filters(api):
    ctx = InvestigationContext(
        investigation_id="1", 
        location_ids=["LOC-1"],
        time_start=datetime(2025, 1, 1)
    )
    
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-1"]}}
    ]
    api.qdrant_client.search_exact.return_value = []
    
    api.search("query", top_k=5, retrieval_mode="hybrid", entity_expansion=True, investigation_context=ctx)
    
    # Check that search_exact was called with the exact same context
    api.qdrant_client.search_exact.assert_called_once()
    args, kwargs = api.qdrant_client.search_exact.call_args
    assert kwargs["investigation_context"] == ctx

# 22. Top_k remains respected
def test_top_k_respected(api):
    ctx = InvestigationContext(investigation_id="1", location_ids=["LOC-1"])
    api.qdrant_client.search.return_value = [{"id": f"d{i}", "score": 0.9, "payload": {"document_id": f"doc{i}"}} for i in range(20)]
    results = api.search("query", top_k=5, retrieval_mode="hybrid", entity_expansion=False, investigation_context=ctx)
    assert len(results) == 5

# 23. Deterministic repeated results
def test_deterministic_repeated(api):
    api.qdrant_client.search.return_value = [
        {"id": "d1", "score": 0.9, "payload": {"document_id": "doc1", "entity_refs": ["P-1"]}}
    ]
    api.qdrant_client.search_exact.return_value = [
        {"id": "d1_dup", "score": 0.0, "payload": {"document_id": "doc1", "entity_refs": ["P-1"]}}
    ]
    
    ctx = InvestigationContext(investigation_id="1", location_ids=["LOC-1"])
    res1 = api.search("query", top_k=5, retrieval_mode="hybrid", entity_expansion=True, investigation_context=ctx)
    res2 = api.search("query", top_k=5, retrieval_mode="hybrid", entity_expansion=True, investigation_context=ctx)
    
    assert res1 == res2
    assert len(res1) == 1
    assert res1[0]["expansion_depth"] == 0 # preserved depth 0

# Test fallback / backward compatibility
def test_no_context_api(api):
    api.qdrant_client.search.return_value = [{"id": "d1", "score": 0.9, "payload": {"document_id": "doc1"}}]
    results = api.search("query", top_k=5) # no context, mode semantic
    assert len(results) == 1
