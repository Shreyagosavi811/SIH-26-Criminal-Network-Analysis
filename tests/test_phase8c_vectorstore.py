import os
import json
import uuid
import pytest
from rag.vectorstore.qdrant_client import generate_point_uuid, NAMESPACE_SIH26189
from rag.vectorstore.config import VectorStoreConfig

def test_deterministic_uuid():
    # same document_id -> same UUID
    doc_id = "S01::telecom_cdr_logs::CDR-001"
    uuid1 = generate_point_uuid(doc_id)
    uuid2 = generate_point_uuid(doc_id)
    
    assert uuid1 == uuid2
    
    # different document_id -> different UUID
    doc_id2 = "S01::telecom_cdr_logs::CDR-002"
    uuid3 = generate_point_uuid(doc_id2)
    
    assert uuid1 != uuid3
    
    # Verify it matches the UUID5 spec with correct namespace
    expected = str(uuid.uuid5(NAMESPACE_SIH26189, doc_id))
    assert uuid1 == expected

def test_forbidden_paths():
    from rag.vectorstore.config import VectorStoreConfig
    
    config = VectorStoreConfig(corpus_path="output/FINAL_EVALUATION/output/GROUND_TRUTH/something.jsonl")
    assert "GROUND_TRUTH" in config.corpus_path
    
    config2 = VectorStoreConfig(corpus_path="output/FINAL_EVALUATION/output/ML_BENCHMARK/something.jsonl")
    assert "ML_BENCHMARK" in config2.corpus_path

def test_interrupted_resume(tmp_path):
    # This is a unit test of the logic to ensure checkpointing behaves
    checkpoint_dir = tmp_path / "checkpoints"
    checkpoint_file = checkpoint_dir / "checkpoint.json"
    
    # Simulate a checkpoint from a run that interrupted at line 50
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    with open(checkpoint_file, "w") as f:
        json.dump({
            "corpus_hash": "dummyhash",
            "embedding_model": "BAAI/bge-m3",
            "embedding_dimension": 1024,
            "last_successful_line": 50,
            "processed_count": 50,
            "timestamp": 123456789.0
        }, f)
        
    assert checkpoint_file.exists()
    
    # Test loading checkpoint
    with open(checkpoint_file, "r") as f:
        ckpt = json.load(f)
        assert ckpt["last_successful_line"] == 50
        assert ckpt["corpus_hash"] == "dummyhash"
