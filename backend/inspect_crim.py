import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('source_type') == 'criminal_history_db':
            print(json.dumps(r, indent=2))
            break
