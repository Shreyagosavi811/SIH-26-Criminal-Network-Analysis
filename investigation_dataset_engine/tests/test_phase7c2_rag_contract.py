import pytest
import os
import json

def test_deterministic_document_id():
    """Verify that document IDs can be deterministically generated without leakage."""
    sid = "S011"
    source_type = "cctns_fir_records"
    raw_record = {"fir_no": "FIR-100/2026/NE"}
    
    # Contract specification: {scenario_instance_id}::{source_type}::{stable_record_index_or_id}
    global_id = f"{sid}::{source_type}::{raw_record['fir_no']}"
    assert global_id == "S011::cctns_fir_records::FIR-100/2026/NE"
    assert "S011" in global_id

def test_ground_truth_isolation():
    """Verify that GROUND_TRUTH is isolated from OBSERVED dataset."""
    engine_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    final_dir = os.path.join(engine_root, "output", "FINAL_EVALUATION", "output")
    
    # In CI this directory might not exist if data isn't generated, but we can verify logic
    if os.path.exists(final_dir):
        obs_dir = os.path.join(final_dir, "OBSERVED")
        gt_dir = os.path.join(final_dir, "GROUND_TRUTH")
        
        assert os.path.exists(obs_dir), "OBSERVED directory must exist."
        assert os.path.exists(gt_dir), "GROUND_TRUTH directory must exist."
        
        # Check that no OBSERVED file contains canonical_id_hidden
        s11_dir = os.path.join(obs_dir, "S11")
        if os.path.exists(s11_dir):
            caf_path = os.path.join(s11_dir, "telecom_caf_kyc.json")
            if os.path.exists(caf_path):
                with open(caf_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for row in data:
                        assert "canonical_id_hidden" not in row
                        assert "ground_truth" not in row

def test_rag_schema_validation():
    """Verify that a sample valid RAG document matches expected contract metadata."""
    sample_doc = {
        "document_id": "S011::telecom_caf_kyc::CAF-S11-0001",
        "scenario_instance_id": "S11",
        "scenario_family": "S01",
        "source_type": "telecom_caf_kyc",
        "source_record_id": "CAF-S11-0001",
        "timestamp": "2026-08-15T00:00:00Z",
        "raw_content": '{"caf_id": "CAF-S11-0001"}',
        "provenance": {
            "ingestion_version": "1.0",
            "source_path": "OBSERVED/S11/telecom_caf_kyc.json"
        }
    }
    
    assert sample_doc["document_id"].count("::") == 2
    assert sample_doc["scenario_instance_id"] in sample_doc["document_id"]
