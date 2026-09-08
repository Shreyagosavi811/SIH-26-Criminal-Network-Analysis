import os
import sys
import json
import time
import hashlib
import argparse
from typing import Dict, Any, List
from sentence_transformers import SentenceTransformer

# Setup PYTHONPATH for local imports if run directly
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from rag.vectorstore.config import VectorStoreConfig
from rag.vectorstore.qdrant_client import QdrantEvidenceClient

def hash_file(filepath: str) -> str:
    """Computes SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def verify_no_leakage(payload: Dict[str, Any]) -> bool:
    """
    Ensures that payload structure does not contain forbidden keys.
    """
    forbidden = {"ground_truth", "gold", "benchmark", "is_criminal", "oracle"}
    
    # Check payload keys
    for key in payload.keys():
        if any(f in key.lower() for f in forbidden):
            return False
            
    # Check provenance path
    prov_path = payload.get("provenance", {}).get("source_path", "").lower()
    if any(f in prov_path for f in forbidden):
        return False
        
    return True

def run_indexer(config: VectorStoreConfig, max_docs: int = 0, limit_to_sources: bool = False, target_scenarios: list = None):
    print("==================================================")
    print(" PHASE 8C RAG VECTOR INDEXING")
    print("==================================================")
    print(f"Model: {config.embedding_model} (Device: {config.embedding_device})")
    print(f"Batch Size: {config.embedding_batch_size}")
    print(f"Qdrant: {config.qdrant_path} / {config.qdrant_collection}")
    
    # Isolation checks
    for forbidden in config.forbidden_paths:
        if forbidden in config.corpus_path:
            print(f"ERROR: Forbidden path detected in corpus_path: {config.corpus_path}")
            sys.exit(1)
            
    if not os.path.exists(config.corpus_path):
        print(f"ERROR: Corpus not found at {config.corpus_path}")
        sys.exit(1)
        
    # 1. Corpus Identity
    print("\\n[1] Verifying Corpus Identity...")
    corpus_size = os.path.getsize(config.corpus_path)
    corpus_hash = hash_file(config.corpus_path)
    print(f"Corpus Hash: {corpus_hash}")
    print(f"Corpus Size: {corpus_size / (1024*1024):.2f} MB")
    
    # 2. Checkpoint Logic
    checkpoint_file = os.path.join(config.checkpoint_dir, "checkpoint.json")
    os.makedirs(config.checkpoint_dir, exist_ok=True)
    
    start_line = 0
    total_processed = 0
    total_failed = 0
    
    # For small-scale logic
    source_counts = {}
    
    if os.path.exists(checkpoint_file) and not max_docs: # We don't resume small scale runs
        with open(checkpoint_file, "r") as f:
            ckpt = json.load(f)
            if ckpt.get("corpus_hash") != corpus_hash:
                print("ERROR: Corpus hash mismatch. Cannot resume. Delete checkpoint to restart.")
                sys.exit(1)
            if ckpt.get("embedding_model") != config.embedding_model:
                print("ERROR: Embedding model mismatch. Cannot resume.")
                sys.exit(1)
            
            start_line = ckpt.get("last_successful_line", 0)
            total_processed = ckpt.get("processed_count", 0)
            print(f"\\n[!] RESUMING from line {start_line} (Processed: {total_processed})")
            
    # 3. Model Loading & Dimension Validation
    print(f"\n[2] Loading model {config.embedding_model}...")
    import torch
    torch.set_num_threads(config.embedding_threads)
    model = SentenceTransformer(config.embedding_model, device=config.embedding_device)
    embedding_dim = model.get_sentence_embedding_dimension()
    print(f"Actual Embedding Dimension: {embedding_dim}")
    
    # 4. Qdrant Client Setup
    print(f"\n[3] Initializing Qdrant Collection...")
    client = QdrantEvidenceClient(path=config.qdrant_path, collection_name=config.qdrant_collection)
    try:
        client.ensure_collection(vector_size=embedding_dim)
    except Exception as e:
        print(f"ERROR: Failed to connect or create Qdrant collection. Is Docker running? ({e})")
        sys.exit(1)
        
    # 5. Indexing Loop
    print(f"\\n[4] Starting Streaming Upsert Loop...")
    
    batch_docs = []
    batch_texts = []
    line_number = 0
    skipped = 0
    
    start_time = time.time()
    
    def process_batch():
        nonlocal batch_docs, batch_texts, total_processed, total_failed
        if not batch_docs:
            return True
            
        try:
            # 1. Encode
            embeddings = model.encode(batch_texts, convert_to_numpy=True).tolist()
            
            # 2. Check for NaN/Inf (finite vector validation)
            import math
            for emb in embeddings:
                if any(math.isnan(v) or math.isinf(v) for v in emb):
                    raise ValueError("Non-finite vector generated.")
            
            # 3. Upsert
            client.upsert_batch(batch_docs, embeddings)
            total_processed += len(batch_docs)
            
            # 4. Checkpoint
            if not max_docs: # Don't checkpoint test runs
                with open(checkpoint_file, "w") as f:
                    json.dump({
                        "corpus_hash": corpus_hash,
                        "embedding_model": config.embedding_model,
                        "embedding_dimension": embedding_dim,
                        "last_successful_line": line_number,
                        "processed_count": total_processed,
                        "timestamp": time.time()
                    }, f)
                    
            batch_docs.clear()
            batch_texts.clear()
            return True
            
        except Exception as e:
            total_failed += len(batch_docs)
            print(f"\\n[ERROR] Batch Failed at line {line_number}: {e}")
            # Real implementation might retry 3 times here.
            # For Phase 8C, we catch and report.
            return False

    with open(config.corpus_path, "r", encoding="utf-8") as f:
        for line in f:
            line_number += 1
            if line_number <= start_line:
                continue
                
            if not line.strip():
                continue
                
            doc = json.loads(line)
            
            # Phase 10E-D Demo Selection Filtering
            if target_scenarios:
                sid = doc.get("scenario_instance_id", "")
                if not any(sid.startswith(ts) for ts in target_scenarios):
                    skipped += 1
                    continue
            
            # Small scale filtering by source type (10 per source type if max_docs == 100)
            if limit_to_sources and max_docs:
                stype = doc.get("source_type", "unknown")
                if source_counts.get(stype, 0) >= (max_docs // 10):
                    skipped += 1
                    continue
                source_counts[stype] = source_counts.get(stype, 0) + 1
            
            text = doc.get("normalized_text", "")
            if not text:
                skipped += 1
                continue
                
            if not verify_no_leakage(doc):
                print(f"ERROR: Leakage detected in document {doc.get('document_id')}")
                sys.exit(1)
                
            # Document chunking bypass check (Phase 8C assumes 1 doc = 1 vector)
            # If length > 20000 chars, it's very large, but we still embed it for now.
            if len(text) > 50000:
                print(f"WARNING: Long document {doc.get('document_id')} ({len(text)} chars)")
                
            batch_docs.append(doc)
            batch_texts.append(text)
            
            if len(batch_docs) >= config.embedding_batch_size:
                success = process_batch()
                if not success:
                    sys.exit(1)
                    
                # Progress print
                if total_processed % 1000 == 0:
                    elapsed = time.time() - start_time
                    rate = total_processed / elapsed if elapsed > 0 else 0
                    print(f"  Processed {total_processed} vectors... ({rate:.1f} docs/sec)")
                    
            if max_docs and total_processed >= max_docs:
                break
                
    # Final batch
    if batch_docs:
        process_batch()
        
    elapsed = time.time() - start_time
    
    print("\\n==================================================")
    print(" INDEXING COMPLETE")
    print("==================================================")
    print(f"Total Processed : {total_processed}")
    print(f"Total Failed    : {total_failed}")
    print(f"Total Skipped   : {skipped}")
    print(f"Time Elapsed    : {elapsed:.2f} seconds")
    
    # Qdrant Independent count
    qdrant_count = client.count()
    print(f"Qdrant DB Count : {qdrant_count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--small-scale", action="store_true", help="Index 100 docs (10 per source)")
    parser.add_argument("--medium-scale", action="store_true", help="Index 1000 docs")
    args = parser.parse_args()
    
    config = VectorStoreConfig()
    
    if args.small_scale:
        run_indexer(config, max_docs=100, limit_to_sources=True)
    elif args.medium_scale:
        run_indexer(config, max_docs=1000, limit_to_sources=False)
    else:
        run_indexer(config)
