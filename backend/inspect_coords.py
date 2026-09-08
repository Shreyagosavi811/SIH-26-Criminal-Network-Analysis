import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        raw = r.get('raw_content', {})
        if 'lat' in raw or 'lon' in raw:
            print(f"Has coords: {r.get('source_type')} - {r.get('source_record_id')} -> {raw.get('lat')}, {raw.get('lon')}")
