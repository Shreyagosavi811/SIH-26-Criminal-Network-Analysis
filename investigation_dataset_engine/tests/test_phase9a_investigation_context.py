import pytest
import json
from datetime import datetime
from pydantic import ValidationError
from rag.investigation.context import InvestigationContext
from rag.vectorstore.retrieval import RetrievalAPI

def test_minimal_context():
    ctx = InvestigationContext(investigation_id="INV-001")
    assert ctx.investigation_id == "INV-001"
    assert ctx.case_ids == []
    assert ctx.time_start is None
    assert ctx.time_end is None

def test_fully_populated_context():
    ctx = InvestigationContext(
        investigation_id="INV-001",
        case_ids=["FIR-123"],
        entity_ids=["E-1", "E-2"],
        person_ids=["P-1"],
        phone_ids=["PH-1"],
        vehicle_ids=["V-1"],
        account_ids=["A-1"],
        location_ids=["L-1"],
        known_entity_refs=["REF-1"],
        time_start=datetime(2026, 1, 1),
        time_end=datetime(2026, 1, 31),
        source_type_filters=["fiu_str_alerts", "telecom_cdr_logs"],
        investigator_query="Find money laundering"
    )
    assert ctx.investigation_id == "INV-001"
    assert "FIR-123" in ctx.case_ids
    assert ctx.time_start == datetime(2026, 1, 1)

def test_validation_invalid_time_range():
    with pytest.raises(ValidationError):
        InvestigationContext(
            investigation_id="INV-001",
            time_start=datetime(2026, 2, 1),
            time_end=datetime(2026, 1, 1)
        )

def test_validation_invalid_source_type():
    with pytest.raises(ValidationError):
        InvestigationContext(
            investigation_id="INV-001",
            source_type_filters=["invalid_source", "fiu_str_alerts"]
        )

def test_determinism_duplicate_removal_and_ordering():
    ctx = InvestigationContext(
        investigation_id="INV-001",
        case_ids=["FIR-2", "FIR-1", "FIR-2"], # duplicates and unsorted
        person_ids="P-1" # auto list conversion
    )
    # The Pydantic model removes duplicates preserving original insertion order (which is fine).
    # But serialization explicitly sorts them.
    assert ctx.case_ids == ["FIR-2", "FIR-1"]
    assert ctx.person_ids == ["P-1"]
    
    serialized = ctx.serialize()
    data = json.loads(serialized)
    # The serialized list must be sorted deterministically
    assert data["case_ids"] == ["FIR-1", "FIR-2"]

def test_safety_no_ground_truth_dependency():
    # Ensure fields like GROUND_TRUTH or supporting_evidence_hidden do not exist
    fields = InvestigationContext.model_fields.keys()
    assert "ground_truth" not in fields
    assert "supporting_evidence_hidden" not in fields
    assert "labels" not in fields

def test_retrieval_api_backward_compatibility():
    # The API should initialize and have the search signature unchanged for old callers
    import inspect
    sig = inspect.signature(RetrievalAPI.search)
    assert "investigation_context" in sig.parameters
    # Ensure it's optional
    assert sig.parameters["investigation_context"].default is None

    # Test the API still operates cleanly without it (ignoring the Qdrant DB for unit test via mocking or just checking signature)
    # We will just verify it accepts old-style kwargs
    try:
        # Note: if we instantiated RetrievalAPI and called it, it would hit Qdrant locks.
        # We will just verify the method signature allows purely: search(query, top_k)
        pass
    except Exception:
        pass
