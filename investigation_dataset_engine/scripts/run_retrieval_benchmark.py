import json
import os
import argparse
import time
import sqlite3
import hashlib
from tqdm import tqdm
from rag.vectorstore.retrieval import RetrievalAPI
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
    for t in targets:
        if not t: continue
        c = resolve_canonical_id(t)
        if c: canon.append(c)
    return canon

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

def get_cache_key(query, top_k, db_count):
    raw = f"{query}_{top_k}_{db_count}"
    return hashlib.sha256(raw.encode()).hexdigest()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--split", type=str, default="validation")
    parser.add_argument("--sample", type=int, default=0)
    args = parser.parse_args()
    
    benchmark_file = f"output/FINAL_EVALUATION/output/ML_BENCHMARK/{args.split}.json"
    if not os.path.exists(benchmark_file):
        print(f"File not found: {benchmark_file}")
        return
        
    with open(benchmark_file, 'r') as f:
        data = json.load(f)
        
    api = RetrievalAPI()
    db_count = api.qdrant_client.count()
    print(f"Current Qdrant Index Size: {db_count}")
    
    conn = setup_cache("output/RAG_BENCHMARK/eval_cache.sqlite")
    c = conn.cursor()
    
    tasks = ["evidence_retrieval", "anomaly_detection", "multi_hop", "link_prediction", "entity_resolution", "false_positive"]
    K_VALUES = [1, 3, 5, 10, 20]
    
    metrics = {t: {f"recall_{k}": 0 for k in K_VALUES} for t in tasks}
    for t in tasks:
        for k in K_VALUES:
            metrics[t][f"precision_{k}"] = 0
            metrics[t][f"hit_rate_{k}"] = 0
        metrics[t]["mrr"] = 0
        metrics[t]["count"] = 0
        metrics[t]["failed"] = 0
        metrics[t]["cache_hits"] = 0
        metrics[t]["total_latency"] = 0.0
        
    for task in tasks:
        items = data.get(task, [])
        if args.sample > 0: items = items[:args.sample]
            
        for item in tqdm(items, desc=task):
            expected = build_expected_ids(task, item)
            if not expected: continue # Skip negative examples with no targets
                
            query = build_query(task, item)
            cache_key = get_cache_key(query, 20, db_count)
            
            start_time = time.time()
            c.execute("SELECT retrieved_ids FROM cache WHERE query_hash=?", (cache_key,))
            row = c.fetchone()
            
            if row:
                retrieved = json.loads(row[0])
                metrics[task]["cache_hits"] += 1
                metrics[task]["total_latency"] += (time.time() - start_time)
            else:
                try:
                    results = api.search(query, top_k=20)
                    retrieved = [r["payload"]["document_id"] for r in results]
                    c.execute("INSERT OR REPLACE INTO cache (query_hash, retrieved_ids) VALUES (?, ?)", 
                              (cache_key, json.dumps(retrieved)))
                    conn.commit()
                    metrics[task]["total_latency"] += (time.time() - start_time)
                except Exception as e:
                    metrics[task]["failed"] += 1
                    continue
                    
            for k in K_VALUES:
                metrics[task][f"recall_{k}"] += calculate_recall(retrieved, expected, k)
                metrics[task][f"precision_{k}"] += calculate_precision(retrieved, expected, k)
                metrics[task][f"hit_rate_{k}"] += calculate_hit_rate(retrieved, expected, k)
            metrics[task]["mrr"] += calculate_mrr(retrieved, expected)
            metrics[task]["count"] += 1
            
    conn.close()
    
    # Save Results
    os.makedirs("output/RAG_BENCHMARK", exist_ok=True)
    out_file = f"output/RAG_BENCHMARK/metrics_{args.split}.json"
    
    final_metrics = {"split": args.split, "db_count": db_count, "tasks": {}}
    for task in tasks:
        c_val = metrics[task]["count"]
        if c_val > 0:
            final_metrics["tasks"][task] = {
                "count": c_val,
                "failed": metrics[task]["failed"],
                "cache_hits": metrics[task]["cache_hits"],
                "avg_latency": metrics[task]["total_latency"] / c_val,
                "mrr": metrics[task]["mrr"] / c_val
            }
            for k in K_VALUES:
                final_metrics["tasks"][task][f"recall_{k}"] = metrics[task][f"recall_{k}"] / c_val
                final_metrics["tasks"][task][f"precision_{k}"] = metrics[task][f"precision_{k}"] / c_val
                final_metrics["tasks"][task][f"hit_rate_{k}"] = metrics[task][f"hit_rate_{k}"] / c_val
                
    with open(out_file, "w") as f:
        json.dump(final_metrics, f, indent=2)
        
    print(f"\\nSaved metrics to {out_file}")

if __name__ == "__main__":
    main()
