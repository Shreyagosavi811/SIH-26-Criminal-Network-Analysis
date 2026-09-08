import json
import os

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
seen_types = set()
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        stype = r.get('source_type')
        if stype not in seen_types:
            seen_types.add(stype)
            print(f"\n--- {stype} ---")
            print(json.dumps(r, indent=2))
