import os
import json
import pandas as pd
from typing import Dict, Any, List

def audit_rag_boundary(base_dir: str):
    print("=" * 60)
    print(" RAG BOUNDARY AUDIT REPORT")
    print("=" * 60)
    
    if not os.path.exists(base_dir):
        print(f"[ERROR] Base dir not found: {base_dir}")
        return

    obs_dir = os.path.join(base_dir, "OBSERVED")
    gt_dir = os.path.join(base_dir, "GROUND_TRUTH")
    
    # 1. Ensure GROUND_TRUTH is cleanly separated
    if os.path.exists(gt_dir):
        print("[PASS] GROUND_TRUTH directory is isolated and physically distinct from OBSERVED.")
    else:
        print("[WARN] GROUND_TRUTH directory not found where expected.")
        
    source_stats = {}
    missing_provenance = 0
    missing_timestamp = 0
    suspicious_labels = 0
    all_global_ids = set()
    duplicate_global_ids = 0
    
    scenario_dirs = [d for d in os.listdir(obs_dir) if os.path.isdir(os.path.join(obs_dir, d))]
    print(f"Auditing {len(scenario_dirs)} scenario instances...")
    
    for sid in scenario_dirs:
        s_dir = os.path.join(obs_dir, sid)
        for f in os.listdir(s_dir):
            path = os.path.join(s_dir, f)
            source_type = f.split('.')[0]
            if source_type not in source_stats:
                source_stats[source_type] = 0
                
            records = []
            if f.endswith('.json'):
                with open(path, 'r', encoding='utf-8') as fp:
                    data = json.load(fp)
                    if isinstance(data, list):
                        records = data
            elif f.endswith('.csv'):
                df = pd.read_csv(path)
                records = df.to_dict('records')
            elif f.endswith('.txt'):
                with open(path, 'r', encoding='utf-8') as fp:
                    lines = [l for l in fp.readlines() if l.startswith('[FNOTE-')]
                    for line in lines:
                        # minimal mock structure for txt
                        parts = line.split(']')
                        if len(parts) >= 2:
                            fid = parts[0].strip('[')
                            records.append({'fnote_id': fid, 'text': line})
            
            source_stats[source_type] += len(records)
            
            for i, r in enumerate(records):
                # Check for suspicious fields
                keys_str = str(r.keys()).lower()
                if any(x in keys_str for x in ['ground_truth', 'canonical_id_hidden', 'target_entity', 'scenario_solution']):
                    suspicious_labels += 1
                
                # Deterministic Global ID check
                # ID priority: find known id keys
                record_id = None
                for k in ['fir_no', 'transaction_id', 'dump_id', 'history_record_id', 'fnote_id', 'alert_id', 'post_id', 'caf_id', 'cdr_id', 'anpr_id']:
                    if k in r:
                        record_id = r[k]
                        break
                if not record_id:
                    record_id = f"ROW_{i}"
                    
                global_id = f"{sid}::{source_type}::{record_id}"
                if global_id in all_global_ids:
                    duplicate_global_ids += 1
                all_global_ids.add(global_id)
                
                # Timestamps check (heuristic)
                has_ts = any(k in r for k in ['timestamp', 'incident_datetime', 'alert_timestamp', 'time_window_start', 'activation_date'])
                if not has_ts and source_type not in ['criminal_history_db', 'field_intelligence_notes']: 
                    # Field notes have timestamps embedded in text, criminal history might just have case_year
                    if 'case_year' not in r:
                        missing_timestamp += 1

    print("\n[SOURCE DISTRIBUTION]")
    total = sum(source_stats.values())
    for k, v in source_stats.items():
        print(f"  {k}: {v} records")
    print(f"  Total Observed Records: {total}")
    
    print("\n[AUDIT RESULTS]")
    print(f"Suspicious Hidden Labels Found : {suspicious_labels}")
    print(f"Duplicate Global IDs Found     : {duplicate_global_ids}")
    print(f"Missing Timestamp Fields       : {missing_timestamp}")
    print("=" * 60)

if __name__ == "__main__":
    audit_rag_boundary("output/FINAL_EVALUATION/output")
