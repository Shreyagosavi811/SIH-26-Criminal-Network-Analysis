import os
import json
import time
from generator.engine import DatasetEngine
from benchmark.config import ALL_SCENARIOS

def main():
    print("=================================================================")
    print("   SIH26189 — Final Evaluation Scale Generation (Phase 7C)")
    print("=================================================================")
    
    BASE_DIR = os.path.join("output", "FINAL_EVALUATION")
    SEED = 26189
    SCALE = "final"
    NOISE_LEVEL = 3  # Use 3 uniformly to avoid split leakage
    
    engine = DatasetEngine(
        base_dir=BASE_DIR,
        seed=SEED,
        noise_level=NOISE_LEVEL,
        scale=SCALE
    )
    
    total_scenarios = 0
    total_gt_entities = 0
    total_gt_edges = 0
    total_observed = 0
    total_audit_passed = 0
    
    start_time = time.time()
    
    for sid in ALL_SCENARIOS:
        print(f"Generating Instance S{sid:02d} ... ", end="", flush=True)
        stats = engine.run_scenario(sid)
        
        passed_str = "PASS" if stats['audit_passed'] else "FAIL"
        if stats['audit_passed']:
            total_audit_passed += 1
            
        print(f"[{passed_str}] GT:{stats['gt_entities']} entities | {stats['total_observed_records']} obs | Noise: {stats['noise_statistics']['measured_noise_ratio']:.2%}")
        
        total_scenarios += 1
        total_gt_entities += stats['gt_entities']
        total_gt_edges += stats['gt_edges']
        total_observed += stats['total_observed_records']

    elapsed = time.time() - start_time
    
    print("\n=================================================================")
    print("   FINAL SCALE GENERATION COMPLETE")
    print("=================================================================")
    print(f"  Scenarios generated : {total_scenarios}")
    print(f"  GT Entities         : {total_gt_entities}")
    print(f"  GT Edges            : {total_gt_edges}")
    print(f"  Observed Records    : {total_observed}")
    print(f"  Audit Pass Rate     : {total_audit_passed}/{total_scenarios}")
    print(f"  Time Elapsed        : {elapsed:.2f} seconds")
    print(f"  Output Directory    : {BASE_DIR}")
    print("=================================================================")

if __name__ == "__main__":
    main()
