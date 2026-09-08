import os
import sys
import json
from rag.vectorstore.retrieval import RetrievalAPI

def smoke_test():
    print("==================================================")
    print(" RAG RETRIEVAL SMOKE TEST")
    print("==================================================")
    
    api = RetrievalAPI()
    
    # We will search for a known entity pattern or concept likely present in the 1000 docs.
    # The first 1000 docs will primarily be from cctns_fir_records or whatever is first alphabetically.
    # 'cbs_bank_transactions' is alphabetically first. Let's just search for "bank transaction" or "deposit".
    
    query = "large bank deposit or transfer"
    print(f"Query: '{query}'\\n")
    
    results = api.search(query, top_k=3)
    
    if not results:
        print("FAIL: No results returned.")
        sys.exit(1)
        
    for i, res in enumerate(results):
        score = res["score"]
        payload = res["payload"]
        print(f"Result {i+1} (Score: {score:.4f}):")
        print(f"  Doc ID     : {payload.get('document_id')}")
        print(f"  Source     : {payload.get('source_type')}")
        print(f"  Timestamp  : {payload.get('timestamp')}")
        print(f"  Provenance : {payload.get('provenance', {}).get('source_path')}")
        print()
        
    print("PASS: Smoke test returned valid structured results.")

if __name__ == "__main__":
    smoke_test()
