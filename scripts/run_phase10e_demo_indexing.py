import os
import sys
import time

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from rag.vectorstore.config import VectorStoreConfig
from scripts.index_rag_corpus import run_indexer
import torch

def run_demo_indexing():
    print("==================================================")
    print(" PHASE 10E-D DEMO INDEXING")
    print("==================================================")
    
    # Force environmental boundaries
    batch_size = 32
    threads = 6
    os.environ["EMBEDDING_BATCH_SIZE"] = str(batch_size)
    os.environ["EMBEDDING_THREADS"] = str(threads)
    os.environ["OMP_NUM_THREADS"] = str(threads)
    os.environ["MKL_NUM_THREADS"] = str(threads)
    
    # Collection & Checkpoint boundary
    os.environ["QDRANT_COLLECTION"] = "sih26189_evidence_demo"
    os.environ["ENVIRONMENT"] = "test"
    os.environ["CHECKPOINT_DIR"] = os.path.join("output", "RAG_CORPUS", "checkpoints_demo")
    
    torch.set_num_threads(threads)
    
    config = VectorStoreConfig()
    
    # 3 target scenarios
    targets = ["S04", "S07", "S09"]
    
    # We pass max_docs=0 so it doesn't stop early and DO create a checkpoint.
    # The new target_scenarios filter will skip non-matching ones.
    start_time = time.time()
    try:
        run_indexer(config, max_docs=0, limit_to_sources=False, target_scenarios=targets)
    except Exception as e:
        print(f"FAILED: {e}")
        return False
        
    elapsed = time.time() - start_time
    print(f"Finished in {elapsed:.2f} seconds.")
    
    # Basic Validation Checks on Qdrant
    print("\n--- VALIDATION ---")
    from qdrant_client import QdrantClient
    client = QdrantClient(path=config.qdrant_path)
    count = client.count("sih26189_evidence_demo").count
    print(f"Total Qdrant Vectors: {count}")
    
    # Verify retrieval smoke test
    print("\n--- SMOKE TEST ---")
    from rag.vectorstore.retrieval import RetrievalAPI
    api = RetrievalAPI()
    
    queries = {
        "S04": "Show the financial connections between the entities in this investigation.",
        "S07": "Find the multi-hop connection between the relevant persons and associated entities.",
        "S09": "Reconstruct the sequence of events and movements across the investigation timeline."
    }
    
    for sq, q in queries.items():
        print(f"\nQuery ({sq}): {q}")
        res = api.search(
            query=q, 
            k=3,
            retrieval_mode="semantic"
        )
        for r in res:
            sid = r.document.scenario_instance_id
            print(f"  -> Match [{r.score:.3f}]: {r.document.document_id} ({sid})")

if __name__ == "__main__":
    run_demo_indexing()
