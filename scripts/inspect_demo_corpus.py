import json
from collections import defaultdict
from datetime import datetime

corpus_path = "output/RAG_CORPUS/corpus_full.jsonl"
target_scenarios = ["S04", "S07", "S09"]

scenario_counts = {s: 0 for s in target_scenarios}
source_counts = {s: defaultdict(int) for s in target_scenarios}
timestamps = {s: [] for s in target_scenarios}

print(f"Scanning {corpus_path} for target scenarios...")

total_lines = 0
with open(corpus_path, "r", encoding="utf-8") as f:
    for line in f:
        total_lines += 1
        if not line.strip(): continue
        
        doc = json.loads(line)
        # Check if it belongs to one of the target scenarios
        sid = doc.get("scenario_instance_id", "")
        # A document might have a scenario instance like "S04-..."
        matched = False
        for ts in target_scenarios:
            if sid.startswith(ts):
                scenario_counts[ts] += 1
                stype = doc.get("source_type", "unknown")
                source_counts[ts][stype] += 1
                
                ts_val = doc.get("timestamp")
                if ts_val:
                    timestamps[ts].append(ts_val)
                matched = True
                break
                
        if total_lines % 100000 == 0:
            print(f"  Scanned {total_lines} lines...")

print("\n--- RESULTS ---")
print("| Scenario | Family | Documents | Source Types | Earliest Timestamp | Latest Timestamp |")
print("| -------- | ------ | --------: | -----------: | ------------------ | ---------------- |")

family_names = {
    "S04": "Financial Multi-Hop",
    "S07": "Four-Hop Network",
    "S09": "Timeline Reconstruction"
}

for ts in target_scenarios:
    count = scenario_counts[ts]
    types_count = len(source_counts[ts])
    
    ts_list = sorted(timestamps[ts])
    earliest = ts_list[0] if ts_list else "N/A"
    latest = ts_list[-1] if ts_list else "N/A"
    
    print(f"| {ts} | {family_names[ts]} | {count} | {types_count} | {earliest} | {latest} |")

print("\n--- SOURCE TYPE BREAKDOWN ---")
print("| Scenario | Source Type | Documents |")
print("| -------- | ----------- | --------: |")
for ts in target_scenarios:
    for stype, c in sorted(source_counts[ts].items()):
        print(f"| {ts} | {stype} | {c} |")
