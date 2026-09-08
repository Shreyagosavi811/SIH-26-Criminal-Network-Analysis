import json
import os
from collections import defaultdict

def identify_source_type(record_id: str) -> str:
    # E.g. FIU-S04-0001 or CAF-NOISE-26190-1707
    prefix = record_id.split('-')[0]
    
    mapping = {
        "FIU": "fiu_str_alerts",
        "CBS": "cbs_bank_transactions",
        "TDUMP": "tower_dumps",
        "FNOTE": "field_intelligence_notes",
        "ANPR": "toll_anpr_logs",
        "CDR": "telecom_cdr_logs",
        "CAF": "kyc_caf_records",
        "FIR": "cctns_fir_records",
        "CRIM": "criminal_history",
        "OSINT": "osint_social_media",
        "OBS": None # OBS-PER-S01-000 is an entity, not a document
    }
    return mapping.get(prefix, None)

def extract_scenario_id(record_id: str) -> str:
    parts = record_id.split('-')
    if len(parts) >= 2:
        if parts[1].startswith("S") and parts[1][1:].isdigit():
            return parts[1]
        elif parts[1] == "NOISE":
            return "NOISE"
        elif parts[1] == "BENIGN":
            return "BENIGN"
    return "UNKNOWN"

def resolve_canonical_id(record_id: str) -> str:
    source_type = identify_source_type(record_id)
    scenario_id = extract_scenario_id(record_id)
    
    if not source_type:
        return None # Cannot resolve
        
    if scenario_id in ["NOISE", "BENIGN"]:
        return f"{scenario_id}::{source_type}::{record_id}"
    elif scenario_id != "UNKNOWN":
        return f"{scenario_id}::{source_type}::{record_id}"
    return None

def full_schema_audit():
    benchmark_dir = "output/FINAL_EVALUATION/output/ML_BENCHMARK/"
    files = ["train.json", "validation.json", "test.json", "challenge.json"]
    
    resolvable = 0
    unresolvable = 0
    unresolvable_samples = set()
    
    print("==================================================")
    print(" PHASE 8D ID RESOLUTION & SCHEMA AUDIT")
    print("==================================================")
    
    for fname in files:
        fpath = os.path.join(benchmark_dir, fname)
        if not os.path.exists(fpath): continue
        with open(fpath, 'r') as f:
            data = json.load(f)
            
        for task in ["evidence_retrieval", "anomaly_detection", "multi_hop", "link_prediction", "entity_resolution", "false_positive"]:
            for item in data.get(task, []):
                targets = []
                if task == "evidence_retrieval":
                    targets = item.get("supporting_record_ids", [])
                elif task == "anomaly_detection":
                    targets = item.get("input", {}).get("evidence_ids", [])
                elif task == "multi_hop":
                    targets = item.get("metadata", {}).get("supporting_evidence_hidden", [])
                elif task == "link_prediction":
                    targets = item.get("input", {}).get("supporting_record_ids", [])
                elif task == "entity_resolution":
                    if "input" in item:
                        targets = [item["input"].get("record_a_id"), item["input"].get("record_b_id")]
                elif task == "false_positive":
                    targets = item.get("input", {}).get("supporting_evidence_ids", []) + item.get("input", {}).get("contradicting_evidence_ids", [])
                
                for t in targets:
                    if not t: continue
                    canon = resolve_canonical_id(t)
                    if canon:
                        resolvable += 1
                    else:
                        unresolvable += 1
                        if len(unresolvable_samples) < 10:
                            unresolvable_samples.add(t)

    print(f"Total Target IDs Analyzed : {resolvable + unresolvable}")
    print(f"Resolvable Canonical IDs  : {resolvable}")
    print(f"Unresolvable Target IDs   : {unresolvable}")
    
    if unresolvable > 0:
        print(f"Unresolvable Samples: {list(unresolvable_samples)}")
        
if __name__ == "__main__":
    full_schema_audit()
