import os
import json
import pandas as pd
from rag.adapters import ALL_ADAPTERS

def count_raw_records():
    observed_dir = os.path.join("output", "FINAL_EVALUATION", "output", "OBSERVED")
    
    counts = {
        "raw_counts": {},
        "adapter_counts": {},
        "jsonl_counts": {}
    }
    
    for a in ALL_ADAPTERS:
        counts["raw_counts"][a.source_type] = 0
        counts["adapter_counts"][a.source_type] = 0
        counts["jsonl_counts"][a.source_type] = 0
        
    for scenario in sorted(os.listdir(observed_dir)):
        scenario_path = os.path.join(observed_dir, scenario)
        if not os.path.isdir(scenario_path):
            continue
            
        for filename in os.listdir(scenario_path):
            file_path = os.path.join(scenario_path, filename)
            
            # Raw count logic
            if filename.endswith(".json"):
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    raw_c = len(data)
            elif filename.endswith(".csv"):
                df = pd.read_csv(file_path)
                raw_c = len(df)
            elif filename.endswith(".txt"):
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                    lines = content.split("\\n")
                    # Count how many lines look like they have a record
                    # The dataset generator might have counted the whole file as 1 record, or maybe it didn't count something?
                    raw_c = len([l for l in lines if l.strip().startswith("[FNOTE-")])
            
            # Find which source type this maps to
            matched_adapter = None
            for a in ALL_ADAPTERS:
                if a.can_handle(file_path):
                    matched_adapter = a
                    break
                    
            if matched_adapter:
                # Adapter count logic
                docs = matched_adapter.parse(file_path)
                counts["raw_counts"][matched_adapter.source_type] += raw_c
                counts["adapter_counts"][matched_adapter.source_type] += len(docs)
                
    # JSONL count logic
    jsonl_path = os.path.join("output", "RAG_CORPUS", "corpus_full.jsonl")
    seen_ids = set()
    total_jsonl = 0
    duplicate_ids = 0
    blank_lines = 0
    malformed = 0
    
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                blank_lines += 1
                continue
                
            try:
                doc = json.loads(line)
                stype = doc["source_type"]
                doc_id = doc["document_id"]
                counts["jsonl_counts"][stype] += 1
                total_jsonl += 1
                
                if doc_id in seen_ids:
                    duplicate_ids += 1
                seen_ids.add(doc_id)
            except Exception:
                malformed += 1
                
    print("SOURCE TYPE | RAW COUNT | ADAPTER COUNT | JSONL COUNT | DIFF A->B | DIFF B->C")
    for stype in sorted(counts["raw_counts"].keys()):
        a_count = counts["raw_counts"][stype]
        b_count = counts["adapter_counts"][stype]
        c_count = counts["jsonl_counts"][stype]
        diff_ab = b_count - a_count
        diff_bc = c_count - b_count
        print(f"{stype:<25} | {a_count:<10} | {b_count:<13} | {c_count:<11} | {diff_ab:<9} | {diff_bc}")
        
    print(f"\\nJSONL Duplicate IDs: {duplicate_ids}")
    print(f"JSONL Blank Lines: {blank_lines}")
    print(f"JSONL Malformed Lines: {malformed}")
    print(f"Total Unique JSONL: {len(seen_ids)}")
    print(f"Total Lines Parsed JSONL: {total_jsonl}")

if __name__ == "__main__":
    count_raw_records()
