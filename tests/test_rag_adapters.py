import os
import json
import pytest
from rag.models.evidence import EvidenceDocument, Provenance
from rag.adapters import (
    ALL_ADAPTERS,
    CctnsAdapter,
    CriminalHistoryAdapter,
    TelecomCdrAdapter,
    TelecomCafAdapter,
    BankTransactionsAdapter,
    FiuAlertsAdapter,
    TollAnprAdapter,
    CellTowerAdapter,
    OsintAdapter,
    FieldNotesAdapter
)

OBSERVED_DIR = os.path.join(
    "output", "FINAL_EVALUATION", "output", "OBSERVED", "S01"
)

def test_all_adapters_registered():
    assert len(ALL_ADAPTERS) == 10
    types = {a.source_type for a in ALL_ADAPTERS}
    expected = {
        "cctns_fir_records",
        "criminal_history_db",
        "telecom_cdr_logs",
        "telecom_caf_kyc",
        "cbs_bank_transactions",
        "fiu_str_alerts",
        "toll_anpr_logs",
        "cell_tower_dumps",
        "osint_social_posts",
        "field_intelligence_notes"
    }
    assert types == expected

def test_ground_truth_and_ml_benchmark_isolation():
    for adapter in ALL_ADAPTERS:
        assert not adapter.can_handle("path/to/GROUND_TRUTH/cctns_fir_records.json")
        assert not adapter.can_handle("path/to/ML_BENCHMARK/train.json")

def test_evidence_document_serialization():
    doc = EvidenceDocument(
        document_id="S01::cctns_fir_records::FIR-100",
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="cctns_fir_records",
        source_record_id="FIR-100",
        raw_content={"fir_no": "FIR-100"},
        normalized_text="FIR 100 registered.",
        timestamp="2026-01-01T10:00:00Z",
        entity_refs=["PER-001"],
        location_refs=["LOC-001"],
        provenance=Provenance(source_path="OBSERVED/S01/cctns_fir_records.json")
    )
    d = doc.to_dict()
    assert d["document_id"] == "S01::cctns_fir_records::FIR-100"
    assert d["provenance"]["source_path"] == "OBSERVED/S01/cctns_fir_records.json"
    
    js = doc.to_json()
    loaded = json.loads(js)
    assert loaded["document_id"] == doc.document_id

@pytest.mark.skipif(not os.path.exists(OBSERVED_DIR), reason="FINAL_EVALUATION S01 data not present")
def test_parse_s01_files():
    for adapter in ALL_ADAPTERS:
        # Find matching file in S01
        file_found = None
        for filename in os.listdir(OBSERVED_DIR):
            full_path = os.path.join(OBSERVED_DIR, filename)
            if adapter.can_handle(full_path):
                file_found = full_path
                break
        
        assert file_found is not None, f"No matching file found for {adapter.source_type} in {OBSERVED_DIR}"
        
        docs = adapter.parse(file_found)
        assert len(docs) > 0, f"Adapter {adapter.source_type} parsed 0 documents from {file_found}"
        
        # Verify first document
        first_doc = docs[0]
        assert first_doc.scenario_instance_id == "S01"
        assert first_doc.scenario_family == "S01"
        assert first_doc.source_type == adapter.source_type
        assert first_doc.normalized_text != ""
        assert first_doc.provenance is not None
        assert "\\" not in first_doc.provenance.source_path
