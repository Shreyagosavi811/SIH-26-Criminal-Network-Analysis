import json
import urllib.request

try:
    req = urllib.request.Request('http://localhost:8000/api/records')
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        records = data.get('records', [])
        
        seen_types = set()
        for r in records:
            stype = r.get('source_type')
            if stype not in seen_types:
                seen_types.add(stype)
                print(f"\n--- {stype} ---")
                print(json.dumps(r, indent=2))
except Exception as e:
    print(f"Error: {e}")
