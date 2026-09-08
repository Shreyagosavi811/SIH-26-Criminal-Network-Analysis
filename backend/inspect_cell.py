import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
count = 0
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        if r.get('source_type') == 'cell_tower_dumps':
            count += 1
            print(f"Record {count}:")
            print(json.dumps({
                'source_record_id': r.get('source_record_id'),
                'document_id': r.get('document_id'),
                'scenario_instance_id': r.get('scenario_instance_id'),
                'timestamp': r.get('timestamp'),
                'entity_refs': r.get('entity_refs'),
                'location_refs': r.get('location_refs'),
                'raw_content': r.get('raw_content'),
                'normalized_text': r.get('normalized_text')
            }, indent=2))
