import json

filepath = 'd:\\Antigravity\\SIH-26-Criminal-Network-Analysis\\investigation_dataset_engine\\output\\RAG_CORPUS\\corpus_small.jsonl'
persons = {}

with open(filepath, 'r', encoding='utf-8') as f:
    for line in f:
        r = json.loads(line)
        stype = r.get('source_type')
        raw = r.get('raw_content', {})
        entities = r.get('entity_refs', [])
        
        # We only want actual names, not phone numbers or IPs
        names_in_record = []
        
        if stype == 'criminal_history_db':
            names_in_record.append(raw.get('person_reference'))
        elif stype == 'telecom_caf_kyc':
            names_in_record.append(raw.get('subscriber_name'))
        elif stype == 'cctns_fir_records':
            for acc in raw.get('accused_details', []):
                names_in_record.append(acc.get('name'))
            names_in_record.append(raw.get('complainant_name'))
        
        # Also, check entity_refs. If it contains spaces and no digits, it's likely a name
        for e in entities:
            if ' ' in e and not any(char.isdigit() for char in e) and e not in names_in_record:
                names_in_record.append(e)
                
        for name in names_in_record:
            if not name or name == 'Unknown' or name == 'System': continue
            name = name.strip()
            if name not in persons:
                persons[name] = {'name': name, 'sources': set(), 'records': []}
            persons[name]['sources'].add(stype)
            persons[name]['records'].append(r.get('source_record_id'))

# convert sets to lists for json
res = []
for k, v in persons.items():
    v['sources'] = list(v['sources'])
    res.append(v)
    
print(json.dumps(res, indent=2))
