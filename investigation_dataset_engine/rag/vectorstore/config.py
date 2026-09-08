import os
from dataclasses import dataclass, field

@dataclass
class VectorStoreConfig:
    environment: str = field(default_factory=lambda: os.getenv("ENVIRONMENT", "test"))

    # Embedding Configuration
    embedding_model: str = field(default_factory=lambda: os.getenv("EMBEDDING_MODEL", "BAAI/bge-m3"))
    embedding_device: str = field(default_factory=lambda: os.getenv("EMBEDDING_DEVICE", "cpu")) # Enforced CPU-first
    embedding_batch_size: int = field(default_factory=lambda: int(os.getenv("EMBEDDING_BATCH_SIZE", "8")))
    embedding_threads: int = field(default_factory=lambda: int(os.getenv("EMBEDDING_THREADS", "4")))
    
    # Qdrant Configuration
    qdrant_path: str = field(default_factory=lambda: os.getenv("QDRANT_PATH", os.path.join("output", "qdrant_storage")))
    qdrant_collection: str = field(init=False)
    
    # Corpus Configuration
    corpus_path: str = field(default_factory=lambda: os.getenv("CORPUS_PATH", os.path.join("output", "RAG_CORPUS", "corpus_full.jsonl")))
    checkpoint_dir: str = field(init=False)
    
    # Isolation paths (to enforce security)
    forbidden_paths: list[str] = field(default_factory=lambda: ["GROUND_TRUTH", "ML_BENCHMARK"])

    def __post_init__(self):
        # Set CPU threads for underlying numeric libraries
        os.environ["OMP_NUM_THREADS"] = str(self.embedding_threads)
        
        base_coll = os.getenv("QDRANT_COLLECTION")
        self.qdrant_collection = base_coll if base_coll else (
            "sih26189_evidence_prod" if self.environment == "production" else "sih26189_evidence_test"
        )
        
        base_ckpt = os.getenv("CHECKPOINT_DIR")
        env_suffix = "prod" if self.environment == "production" else "test"
        self.checkpoint_dir = base_ckpt if base_ckpt else os.path.join("output", "RAG_CORPUS", f"checkpoints_{env_suffix}")
