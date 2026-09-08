import json
import os
import glob
from collections import defaultdict

def audit_schema():
    benchmark_dir = "output/FINAL_EVALUATION/output/ML_BENCHMARK/"
    files = ["train.json", "validation.json", "test.json", "challenge.json"]
    
    total_counts = defaultdict(int)
    split_counts = {}
    
    task_queries = defaultdict(set)
    task_targets = defaultdict(set)
    id_samples = defaultdict(list)
    temporal_evaluable = 0
    temporal_total = 0
    
    for fname in files:
        fpath = os.path.join(benchmark_dir, fname)
        if not os.path.exists(fpath):
            continue
            
        with open(fpath, 'r') as f:
            data = json.load(f)
            
        split = data.get("split", fname.split('.')[0])
        split_counts[split] = 0
        
        for task in ["evidence_retrieval", "anomaly_detection", "multi_hop", "link_prediction", "entity_resolution", "false_positive", "temporal_reasoning"]:
            items = data.get(task, [])
            count = len(items)
            total_counts[task] += count
            split_counts[split] += count
            
            for item in items:
                # evidence_retrieval
                if task == "evidence_retrieval":
                    task_queries[task].add("input.claim")
                    task_targets[task].add("supporting_record_ids")
                    for tid in item.get("supporting_record_ids", []):
                        if len(id_samples[task]) < 5: id_samples[task].append(tid)
                        
                # anomaly_detection
                elif task == "anomaly_detection":
                    task_queries[task].add("input.observations")
                    task_targets[task].add("input.evidence_ids")
                    for tid in item.get("input", {}).get("evidence_ids", []):
                        if len(id_samples[task]) < 5: id_samples[task].append(tid)
                        
                # multi_hop
                elif task == "multi_hop":
                    task_queries[task].add("input.source_record_id + target_record_id")
                    if "supporting_evidence_hidden" in item.get("metadata", {}):
                        task_targets[task].add("metadata.supporting_evidence_hidden")
                        for tid in item["metadata"]["supporting_evidence_hidden"]:
                            if len(id_samples[task]) < 5: id_samples[task].append(tid)
                            
                # link_prediction
                elif task == "link_prediction":
                    task_queries[task].add("input.source_entity + relation_type + target_entity")
                    if "supporting_record_ids" in item.get("input", {}):
                        task_targets[task].add("input.supporting_record_ids")
                        for tid in item["input"]["supporting_record_ids"]:
                            if len(id_samples[task]) < 5: id_samples[task].append(tid)
                            
                # entity_resolution
                elif task == "entity_resolution":
                    task_queries[task].add("input.attributes_a")
                    task_targets[task].add("input.record_a_id + input.record_b_id")
                    if "input" in item:
                        if len(id_samples[task]) < 5: id_samples[task].append(item["input"].get("record_a_id"))
                        if len(id_samples[task]) < 5: id_samples[task].append(item["input"].get("record_b_id"))
                        
                # false_positive
                elif task == "false_positive":
                    task_queries[task].add("input.suspicious_features + observations")
                    task_targets[task].add("input.supporting_evidence_ids + contradicting_evidence_ids")
                    for tid in item.get("input", {}).get("supporting_evidence_ids", []):
                        if len(id_samples[task]) < 5: id_samples[task].append(tid)
                    for tid in item.get("input", {}).get("contradicting_evidence_ids", []):
                        if len(id_samples[task]) < 5: id_samples[task].append(tid)
                        
                # temporal_reasoning
                elif task == "temporal_reasoning":
                    temporal_total += 1
                    task_queries[task].add("input.event_a_id + event_b_id + timestamps")
                    # Look for ANY field containing evidence
                    found_evidence = False
                    for key, val in item.items():
                        if "evidence" in key.lower() or "record" in key.lower() and val:
                            if key == "input" and "context_records" in val and val["context_records"]:
                                found_evidence = True
                    if found_evidence:
                        temporal_evaluable += 1
                        task_targets[task].add("UNKNOWN_EVIDENCE_FIELD")
                    else:
                        task_targets[task].add("NONE (No valid document ID mapping found)")

    print("=" * 50)
    print(" BENCHMARK SCHEMA AUDIT")
    print("=" * 50)
    print("\\n1. SPLIT COUNTS:")
    for split, count in split_counts.items():
        print(f"  - {split}: {count}")
        
    print("\\n2. TASK COUNTS:")
    for task, count in total_counts.items():
        print(f"  - {task}: {count}")
        
    print("\\n3. TEMPORAL REASONING ELIGIBILITY:")
    print(f"  - Total: {temporal_total}")
    print(f"  - Evaluable for retrieval: {temporal_evaluable}")
    print(f"  - Non-evaluable: {temporal_total - temporal_evaluable}")
    print(f"  - Reason: 'context_records' is empty and no other field maps to evidence document IDs.")

    print("\\n4. QUERY & TARGET SCHEMA MAPPING:")
    for task in total_counts.keys():
        print(f"\\n  [{task}]")
        print(f"    Queries  : {', '.join(task_queries[task])}")
        print(f"    Targets  : {', '.join(task_targets[task])}")
        print(f"    ID Sample: {id_samples[task]}")

if __name__ == "__main__":
    audit_schema()
