import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
suspects = []
with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        stype = r.get('source_type')
        raw = r.get('raw_content', {})
        name = None
        if stype == 'criminal_history_db':
            name = raw.get('name') or raw.get('alias')
        elif stype == 'telecom_caf_kyc':
            name = raw.get('subscriber_name')
        elif stype == 'cctns_fir_records':
            # FIRs usually have accused names or complainant names
            acc = raw.get('accused_details', [])
            if acc:
                for a in acc: suspects.append({'name': a.get('name', 'Unknown'), 'source': r['source_record_id'], 'type': stype})
            continue

        if name:
            suspects.append({'name': name, 'source': r['source_record_id'], 'type': stype})

print(json.dumps(suspects, indent=2))
