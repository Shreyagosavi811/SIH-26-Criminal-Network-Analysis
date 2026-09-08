"""Quick validation of all 10 scenario builders."""
import json
import os
import sys
sys.path.insert(0, '.')

from generator.scenarios.router import build_all_scenarios

results = build_all_scenarios(seed=26189, scale='mvp', noise_level=3)
stats = {}
for sid, r in results.items():
    s = r.summary()
    stats[f'S{sid:02d}'] = s
    ent = s['gt_entities']
    edg = s['gt_edges']
    hn  = s['hard_negatives']
    ev  = s['evidence_chains']
    alt = s['alternative_hypotheses']
    hop = s['minimum_hop_depth']
    print(f"S{sid:02d}: {ent} entities / {edg} edges | hn={hn} | ev={ev} | alt={alt} | hop={hop}")

os.makedirs('output/REPORTS', exist_ok=True)
with open('output/REPORTS/scenario_statistics.json', 'w') as f:
    json.dump(stats, f, indent=2)
print("\nscenario_statistics.json written.")
print("Router test: ", end="")
try:
    from generator.scenarios.router import get_scenario_builder
    get_scenario_builder(99)
    print("FAIL — should have raised ValueError")
except ValueError as e:
    print(f"PASS (ValueError correctly raised: {e})")
