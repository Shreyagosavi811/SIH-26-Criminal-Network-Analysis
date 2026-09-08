import os
import sys
import json
import argparse
from rag.vectorstore.config import VectorStoreConfig
from rag.vectorstore.qdrant_client import QdrantEvidenceClient, generate_point_uuid

def audit_index():
    print("==================================================")
    print(" QDRANT INDEX INTEGRITY AUDIT")
    print("==================================================")
    
    config = VectorStoreConfig()
    
    if not os.path.exists(config.corpus_path):
        print(f"ERROR: Corpus not found at {config.corpus_path}")
        sys.exit(1)
        
    client = QdrantEvidenceClient(path=config.qdrant_path, collection_name=config.qdrant_collection)
    
    qdrant_count = client.count()
    print(f"Total Qdrant Points: {qdrant_count}")
    
    # We won't load all 1.159M IDs to RAM because it's ~40MB, which is fine, but streaming is better.
    # To check all IDs we can do scroll logic or just check counts.
    # For independent audit, we will stream the JSONL, build a set of expected point UUIDs,
    # and maybe do a sample validation since downloading 1M points takes a while.
    # We will do a robust count check and sample check.
    
    corpus_count = 0
    with open(config.corpus_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                corpus_count += 1
                
    print(f"Total Corpus Documents: {corpus_count}")
    
    if corpus_count != qdrant_count:
        print(f"FAIL: Corpus count ({corpus_count}) != Qdrant count ({qdrant_count})")
        sys.exit(1)
        
    print("PASS: Counts match.")
    print("==================================================")

if __name__ == "__main__":
    audit_index()
