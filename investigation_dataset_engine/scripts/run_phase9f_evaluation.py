import json
import os
import argparse
import time
import sqlite3
import hashlib
from collections import defaultdict
from tqdm import tqdm
from datetime import datetime

from rag.vectorstore.retrieval import RetrievalAPI
from rag.investigation.context import InvestigationContext
from rag.vectorstore.qdrant_client import generate_point_uuid
from scripts.audit_canonical_ids import resolve_canonical_id

def calculate_recall(retrieved_ids, expected_ids, k):
    if not expected_ids: return 0.0
    hits = set(retrieved_ids[:k]).intersection(set(expected_ids))
    return len(hits) / len(expected_ids)

def calculate_precision(retrieved_ids, expected_ids, k):
    ret = retrieved_ids[:k]
    if not ret: return 0.0
    if not expected_ids: return 0.0
    hits = set(ret).intersection(set(expected_ids))
    return len(hits) / len(ret)

def calculate_mrr(retrieved_ids, expected_ids):
    if not expected_ids: return 0.0
    for i, rid in enumerate(retrieved_ids):
        if rid in expected_ids: return 1.0 / (i + 1)
    return 0.0

def calculate_hit_rate(retrieved_ids, expected_ids, k):
    if not expected_ids: return 0.0
    hits = set(retrieved_ids[:k]).intersection(set(expected_ids))
    return 1.0 if len(hits) > 0 else 0.0

def build_query(task, item):
    if task == "evidence_retrieval": return item.get("input", {}).get("claim", "")
    elif task == "anomaly_detection":
        obs = item.get("input", {}).get("observations", [])
        return " ".join([f"{o.get('category', '')} {o.get('risk', '')}" for o in obs])
    elif task == "multi_hop":
        src = item.get("input", {}).get("source_record_id", "")
        tgt = item.get("input", {}).get("target_record_id", "")
        return f"Connection between {src} and {tgt}"
    elif task == "link_prediction":
        src = item.get("input", {}).get("source_entity", "")
        rel = item.get("input", {}).get("relation_type", "")
        tgt = item.get("input", {}).get("target_entity", "")
        return f"{src} {rel} {tgt}"
    elif task == "entity_resolution":
        attr = item.get("input", {}).get("attributes_a", {})
        return " ".join(str(v) for v in attr.values())
    elif task == "false_positive":
        susp = item.get("input", {}).get("suspicious_features", [])
        return " ".join(susp)
    return ""

def build_expected_ids(task, item):
    targets = []
    if task == "evidence_retrieval": targets = item.get("supporting_record_ids", [])
    elif task == "anomaly_detection": targets = item.get("input", {}).get("evidence_ids", [])
    elif task == "multi_hop": targets = item.get("metadata", {}).get("supporting_evidence_hidden", [])
    elif task == "link_prediction": targets = item.get("input", {}).get("supporting_record_ids", [])
    elif task == "entity_resolution":
        if "input" in item: targets = [item["input"].get("record_a_id"), item["input"].get("record_b_id")]
    elif task == "false_positive":
        targets = item.get("input", {}).get("supporting_evidence_ids", []) + item.get("input", {}).get("contradicting_evidence_ids", [])
    
    canon = []
    unresolved = []
    for t in targets:
        if not t: continue
        c = resolve_canonical_id(t)
        if c: canon.append(c)
        else: unresolved.append(t)
    return canon, unresolved

def build_investigation_context(task, item):
    """
    Safely builds InvestigationContext from VISIBLE fields only.
    No hidden target IDs are passed into context.
    """
    ctx_data = {"investigation_id": f"{task}_{item.get('id', 'unknown')}"}
    
    # Try to extract context from input directly
    inp = item.get("input", {})
    if "context_records" in inp and inp["context_records"]:
        # temporal constraints, spatial constraints could be here, but they are often empty for temporal_reasoning.
        pass
        
    if "source_entity" in inp: ctx_data["entity_ids"] = [inp["source_entity"]]
    if "target_entity" in inp: ctx_data["entity_ids"] = ctx_data.get("entity_ids", []) + [inp["target_entity"]]
    
    # Do not parse anything from 'metadata' or 'supporting_record_ids'
    
    if len(ctx_data) > 1: # more than just investigation_id
        return InvestigationContext(**ctx_data)
    return None

def setup_cache(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS cache (
                 query_hash TEXT PRIMARY KEY,
                 retrieved_ids TEXT
                 )''')
    conn.commit()
    return conn

def get_cache_key(query, top_k, db_count, retrieval_mode, entity_expansion, rerank, context_hash):
    raw = f"{query}_{top_k}_{db_count}_{retrieval_mode}_{entity_expansion}_{rerank}_{context_hash}"
    return hashlib.sha256(raw.encode()).hexdigest()

def check_target_in_index(api, canonical_id):
    point_id = generate_point_uuid(canonical_id)
    try:
        points = api.qdrant_client.client.retrieve(
            collection_name=api.qdrant_client.collection_name, 
            ids=[point_id]
        )
        return len(points) > 0
    except Exception:
        return False

def run_evaluation_for_split(split: str, sample: int = 0):
    benchmark_file = f"output/FINAL_EVALUATION/output/ML_BENCHMARK/{split}.json"
    if not os.path.exists(benchmark_file):
        print(f"File not found: {benchmark_file}")
        return
        
    with open(benchmark_file, 'r') as f:
        data = json.load(f)
        
    api = RetrievalAPI()
    db_count = api.qdrant_client.count()
    print(f"Current Qdrant Index Size: {db_count}")
    
    import functools
    original_encode = api.model.encode
    @functools.lru_cache(maxsize=128)
    def cached_encode(text, convert_to_numpy=True):
        return original_encode(text, convert_to_numpy=convert_to_numpy)
    api.model.encode = cached_encode
    
    conn = setup_cache("output/RAG_EVALUATION/eval_cache_9f.sqlite")
    c = conn.cursor()
    
    tasks = ["evidence_retrieval", "anomaly_detection", "multi_hop", "link_prediction", "entity_resolution", "false_positive", "temporal_reasoning"]
    K_VALUES = [1, 3, 5, 10, 20]
    
    modes = [
        {"name": "semantic", "kwargs": {"retrieval_mode": "semantic", "entity_expansion": False, "rerank": False}},
        {"name": "hybrid", "kwargs": {"retrieval_mode": "hybrid", "entity_expansion": False, "rerank": False}},
        {"name": "hybrid_expansion", "kwargs": {"retrieval_mode": "hybrid", "entity_expansion": True, "rerank": False}},
        {"name": "hybrid_expansion_rerank", "kwargs": {"retrieval_mode": "hybrid", "entity_expansion": True, "rerank": True}},
    ]
    
    # Track absent vs present
    absent_targets = 0
    indexed_targets = 0
    unresolved_targets = 0
    target_cache = {} # canon_id -> bool
    
    metrics = {mode["name"]: {t: {f"recall_{k}": 0 for k in K_VALUES} for t in tasks} for mode in modes}
    for mode in modes:
        for t in tasks:
            for k in K_VALUES:
                metrics[mode["name"]][t][f"precision_{k}"] = 0
                metrics[mode["name"]][t][f"hit_rate_{k}"] = 0
            metrics[mode["name"]][t]["mrr"] = 0
            metrics[mode["name"]][t]["count"] = 0
            metrics[mode["name"]][t]["failed"] = 0
            metrics[mode["name"]][t]["cache_hits"] = 0
            metrics[mode["name"]][t]["total_latency"] = 0.0

    for task in tasks:
        items = data.get(task, [])
        if sample > 0: items = items[:sample]
            
        for item in tqdm(items, desc=f"Evaluating {task} ({split})"):
            if task == "temporal_reasoning":
                # Marked as N/A for retrieval
                for mode in modes:
                    metrics[mode["name"]][task]["count"] += 1
                continue
                
            expected, unresolved = build_expected_ids(task, item)
            unresolved_targets += len(unresolved)
            if not expected: 
                continue # No targets, so not evaluable
                
            # Check coverage
            for ex in expected:
                if ex not in target_cache:
                    target_cache[ex] = check_target_in_index(api, ex)
                if target_cache[ex]:
                    indexed_targets += 1
                else:
                    absent_targets += 1
                
            query = build_query(task, item)
            ctx = build_investigation_context(task, item)
            ctx_hash = ctx.serialize() if ctx else ""
            
            for mode in modes:
                mode_name = mode["name"]
                kwargs = mode["kwargs"]
                
                cache_key = get_cache_key(
                    query, 20, db_count, 
                    kwargs["retrieval_mode"], 
                    kwargs["entity_expansion"], 
                    kwargs["rerank"], 
                    ctx_hash
                )
                
                start_time = time.time()
                c.execute("SELECT retrieved_ids FROM cache WHERE query_hash=?", (cache_key,))
                row = c.fetchone()
                
                if row:
                    retrieved = json.loads(row[0])
                    metrics[mode_name][task]["cache_hits"] += 1
                    metrics[mode_name][task]["total_latency"] += (time.time() - start_time)
                else:
                    try:
                        results = api.search(query, top_k=20, investigation_context=ctx, **kwargs)
                        retrieved = [r["payload"]["document_id"] for r in results]
                        c.execute("INSERT OR REPLACE INTO cache (query_hash, retrieved_ids) VALUES (?, ?)", 
                                  (cache_key, json.dumps(retrieved)))
                        conn.commit()
                        metrics[mode_name][task]["total_latency"] += (time.time() - start_time)
                    except Exception as e:
                        print(f"Retrieval failed for {task}: {e}")
                        metrics[mode_name][task]["failed"] += 1
                        continue
                        
                for k in K_VALUES:
                    metrics[mode_name][task][f"recall_{k}"] += calculate_recall(retrieved, expected, k)
                    metrics[mode_name][task][f"precision_{k}"] += calculate_precision(retrieved, expected, k)
                    metrics[mode_name][task][f"hit_rate_{k}"] += calculate_hit_rate(retrieved, expected, k)
                metrics[mode_name][task]["mrr"] += calculate_mrr(retrieved, expected)
                metrics[mode_name][task]["count"] += 1
            
    conn.close()
    
    # Save Results
    os.makedirs("output/RAG_EVALUATION", exist_ok=True)
    out_file = f"output/RAG_EVALUATION/metrics_{split}.json"
    
    final_metrics = {
        "split": split, 
        "db_count": db_count,
        "coverage": {
            "indexed_targets": indexed_targets,
            "absent_targets": absent_targets,
            "unresolved_targets": unresolved_targets
        },
        "modes": {}
    }
    
    for mode in modes:
        mode_name = mode["name"]
        final_metrics["modes"][mode_name] = {"tasks": {}, "macro": {}, "micro": {}}
        
        # Calculate per task and micro average
        micro_sum = {f"recall_{k}": 0 for k in K_VALUES}
        micro_sum.update({f"precision_{k}": 0 for k in K_VALUES})
        micro_sum.update({f"hit_rate_{k}": 0 for k in K_VALUES})
        micro_sum["mrr"] = 0
        total_count = 0
        
        macro_sum = {f"recall_{k}": 0 for k in K_VALUES}
        macro_sum.update({f"precision_{k}": 0 for k in K_VALUES})
        macro_sum.update({f"hit_rate_{k}": 0 for k in K_VALUES})
        macro_sum["mrr"] = 0
        task_count = 0
        
        for task in tasks:
            c_val = metrics[mode_name][task]["count"]
            if c_val > 0 and task != "temporal_reasoning":
                task_metrics = {
                    "count": c_val,
                    "failed": metrics[mode_name][task]["failed"],
                    "cache_hits": metrics[mode_name][task]["cache_hits"],
                    "avg_latency": metrics[mode_name][task]["total_latency"] / c_val,
                    "mrr": metrics[mode_name][task]["mrr"] / c_val
                }
                for k in K_VALUES:
                    task_metrics[f"recall_{k}"] = metrics[mode_name][task][f"recall_{k}"] / c_val
                    task_metrics[f"precision_{k}"] = metrics[mode_name][task][f"precision_{k}"] / c_val
                    task_metrics[f"hit_rate_{k}"] = metrics[mode_name][task][f"hit_rate_{k}"] / c_val
                    
                final_metrics["modes"][mode_name]["tasks"][task] = task_metrics
                
                # Accumulate for macro
                task_count += 1
                for k in K_VALUES:
                    macro_sum[f"recall_{k}"] += task_metrics[f"recall_{k}"]
                    macro_sum[f"precision_{k}"] += task_metrics[f"precision_{k}"]
                    macro_sum[f"hit_rate_{k}"] += task_metrics[f"hit_rate_{k}"]
                macro_sum["mrr"] += task_metrics["mrr"]
                
                # Accumulate for micro
                total_count += c_val
                for k in K_VALUES:
                    micro_sum[f"recall_{k}"] += metrics[mode_name][task][f"recall_{k}"]
                    micro_sum[f"precision_{k}"] += metrics[mode_name][task][f"precision_{k}"]
                    micro_sum[f"hit_rate_{k}"] += metrics[mode_name][task][f"hit_rate_{k}"]
                micro_sum["mrr"] += metrics[mode_name][task]["mrr"]
            elif task == "temporal_reasoning":
                final_metrics["modes"][mode_name]["tasks"][task] = {"status": "N/A - Context Missing", "count": c_val}
                
        if total_count > 0:
            final_metrics["modes"][mode_name]["micro"] = {
                "count": total_count,
                "mrr": micro_sum["mrr"] / total_count
            }
            for k in K_VALUES:
                final_metrics["modes"][mode_name]["micro"][f"recall_{k}"] = micro_sum[f"recall_{k}"] / total_count
                final_metrics["modes"][mode_name]["micro"][f"precision_{k}"] = micro_sum[f"precision_{k}"] / total_count
                final_metrics["modes"][mode_name]["micro"][f"hit_rate_{k}"] = micro_sum[f"hit_rate_{k}"] / total_count
                
        if task_count > 0:
            final_metrics["modes"][mode_name]["macro"] = {
                "task_count": task_count,
                "mrr": macro_sum["mrr"] / task_count
            }
            for k in K_VALUES:
                final_metrics["modes"][mode_name]["macro"][f"recall_{k}"] = macro_sum[f"recall_{k}"] / task_count
                final_metrics["modes"][mode_name]["macro"][f"precision_{k}"] = macro_sum[f"precision_{k}"] / task_count
                final_metrics["modes"][mode_name]["macro"][f"hit_rate_{k}"] = macro_sum[f"hit_rate_{k}"] / task_count
                
    with open(out_file, "w") as f:
        json.dump(final_metrics, f, indent=2)
        
    print(f"\nSaved metrics to {out_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--split", type=str, default="validation")
    parser.add_argument("--sample", type=int, default=0)
    args = parser.parse_args()
    
    run_evaluation_for_split(args.split, args.sample)
