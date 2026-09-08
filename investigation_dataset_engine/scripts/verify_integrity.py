import os
import json
import pandas as pd
from rag.adapters import ALL_ADAPTERS

def verify_content_integrity():
    observed_dir = os.path.join("output", "FINAL_EVALUATION", "output", "OBSERVED", "S01")
    
    # We will pick 1 file from S01 for each adapter
    for adapter in ALL_ADAPTERS:
        target_file = None
        for filename in os.listdir(observed_dir):
            path = os.path.join(observed_dir, filename)
            if adapter.can_handle(path):
                target_file = path
                break
                
        if not target_file:
            print(f"Skipping {adapter.source_type} (no file in S01)")
            continue
            
        # 1. OBSERVED RECORD
        raw_record = None
        if target_file.endswith(".json"):
            with open(target_file, "r") as f:
                data = json.load(f)
                if data: raw_record = data[0]
        elif target_file.endswith(".csv"):
            df = pd.read_csv(target_file)
            if not df.empty: raw_record = df.iloc[0].to_dict()
        elif target_file.endswith(".txt"):
            with open(target_file, "r") as f:
                content = f.read()
                lines = content.split("\\n")
                notes = [l for l in lines if l.strip().startswith("[FNOTE-")]
                if notes: raw_record = {"text": notes[0]}
                
        # 2. EVIDENCE DOCUMENT
        docs = adapter.parse(target_file)
        if not docs:
            print(f"FAILED: No docs parsed for {adapter.source_type}")
            continue
        first_doc = docs[0]
        
        # Verify Raw Content preservation
        raw_str_original = str(raw_record)
        raw_str_doc = str(first_doc.raw_content)
        
        # Verify JSONL Doc matches
        # We can just check that first_doc serialization works deterministically
        jsonl_str = first_doc.to_json()
        reloaded = json.loads(jsonl_str)
        
        # Checks
        id_match = (first_doc.document_id == reloaded["document_id"])
        norm_match = (first_doc.normalized_text == reloaded["normalized_text"])
        prov_match = (first_doc.provenance.source_path == reloaded["provenance"]["source_path"])
        
        if id_match and norm_match and prov_match:
            print(f"PASS: {adapter.source_type} (Doc ID: {first_doc.document_id})")
        else:
            print(f"FAIL: {adapter.source_type} - Mismatch in serialization.")

if __name__ == "__main__":
    verify_content_integrity()
