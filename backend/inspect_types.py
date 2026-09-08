import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
types = set()
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        types.add(r.get('source_type'))

print(types)
