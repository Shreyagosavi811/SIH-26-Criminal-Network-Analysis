import os
import pytest
from rag.vectorstore.config import VectorStoreConfig

def test_config_defaults_to_test():
    """Verify that by default, the environment is test and paths resolve correctly."""
    # Ensure ENVIRONMENT is not set in env during this test
    if "ENVIRONMENT" in os.environ:
        del os.environ["ENVIRONMENT"]
    if "QDRANT_COLLECTION" in os.environ:
        del os.environ["QDRANT_COLLECTION"]
    if "CHECKPOINT_DIR" in os.environ:
        del os.environ["CHECKPOINT_DIR"]

    config = VectorStoreConfig()
    assert config.environment == "test"
    assert config.qdrant_collection == "sih26189_evidence_test"
    assert config.checkpoint_dir.endswith("checkpoints_test")
    assert config.embedding_batch_size == 8
    assert config.embedding_threads == 4
    
    # Threading env var is set on init
    assert os.environ.get("OMP_NUM_THREADS") == "4"

def test_config_production_mode(monkeypatch):
    """Verify that production environment resolves production paths."""
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("QDRANT_COLLECTION", raising=False)
    monkeypatch.delenv("CHECKPOINT_DIR", raising=False)
    
    config = VectorStoreConfig()
    assert config.environment == "production"
    assert config.qdrant_collection == "sih26189_evidence_prod"
    assert config.checkpoint_dir.endswith("checkpoints_prod")

def test_config_overrides(monkeypatch):
    """Verify that explicit environment overrides still work (backwards compatibility)."""
    monkeypatch.setenv("ENVIRONMENT", "test")
    monkeypatch.setenv("QDRANT_COLLECTION", "sih26189_evidence_custom")
    monkeypatch.setenv("CHECKPOINT_DIR", "custom_checkpoints")
    monkeypatch.setenv("EMBEDDING_BATCH_SIZE", "32")
    monkeypatch.setenv("EMBEDDING_THREADS", "8")
    
    config = VectorStoreConfig()
    assert config.qdrant_collection == "sih26189_evidence_custom"
    assert config.checkpoint_dir == "custom_checkpoints"
    assert config.embedding_batch_size == 32
    assert config.embedding_threads == 8
    assert os.environ.get("OMP_NUM_THREADS") == "8"

def test_existing_phase8c_compatibility(monkeypatch):
    """Ensure that the fields expected by Phase 8C indexing are present."""
    config = VectorStoreConfig()
    
    # These fields must exist for index_rag_corpus.py and others to run
    assert hasattr(config, "embedding_model")
    assert hasattr(config, "embedding_device")
    assert hasattr(config, "embedding_batch_size")
    assert hasattr(config, "qdrant_path")
    assert hasattr(config, "qdrant_collection")
    assert hasattr(config, "corpus_path")
    assert hasattr(config, "checkpoint_dir")
    assert hasattr(config, "forbidden_paths")
