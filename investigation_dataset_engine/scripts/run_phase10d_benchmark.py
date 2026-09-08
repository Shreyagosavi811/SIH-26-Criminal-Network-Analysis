import os
import sys
import time
import subprocess
import psutil

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_stability_benchmark():
    batch_size = 32
    threads = 6
    max_docs = 10000
    
    print(f"\n==================================================")
    print(f" PHASE 10D STABILITY BENCHMARK: batch={batch_size}, threads={threads}, docs={max_docs}")
    print(f"==================================================")
    
    env = os.environ.copy()
    env["EMBEDDING_BATCH_SIZE"] = str(batch_size)
    env["EMBEDDING_THREADS"] = str(threads)
    env["OMP_NUM_THREADS"] = str(threads)
    env["MKL_NUM_THREADS"] = str(threads)
    env["QDRANT_COLLECTION"] = "sih26189_evidence_phase10d_temp"
    env["ENVIRONMENT"] = "test"
    env["CHECKPOINT_DIR"] = os.path.join("output", "RAG_CORPUS", "checkpoints_phase10d")
    
    # We need a custom runner to limit to 10,000 docs, since CLI only has --medium-scale
    # We can create a tiny inline wrapper to invoke run_indexer with max_docs=10000
    wrapper_code = """
import sys
from rag.vectorstore.config import VectorStoreConfig
from scripts.index_rag_corpus import run_indexer

config = VectorStoreConfig()
run_indexer(config, max_docs=10000, limit_to_sources=False)
"""
    
    start_time = time.time()
    
    process = subprocess.Popen(
        [sys.executable, "-c", wrapper_code],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1 # Line buffered
    )
    
    p = psutil.Process(process.pid)
    
    checkpoints = [1000, 2000, 4000, 6000, 8000, 10000]
    results = []
    peak_ram = 0.0
    last_processed = 0
    last_time = start_time
    
    print(f"{'Checkpoint':>12} | {'Docs':>8} | {'Elapsed':>10} | {'Cum Docs/s':>12} | {'Int Docs/s':>12} | {'RAM (MB)':>10}")
    print("-" * 77)
    
    for line in iter(process.stdout.readline, ''):
        try:
            mem = p.memory_info().rss / (1024 * 1024)
            if mem > peak_ram:
                peak_ram = mem
        except psutil.NoSuchProcess:
            mem = peak_ram
            
        if "Processed" in line and "vectors..." in line:
            # Parse line like "  Processed 1000 vectors... (2.4 docs/sec)"
            parts = line.strip().split()
            if len(parts) >= 2 and parts[1].isdigit():
                processed = int(parts[1])
                
                # Close enough to one of our checkpoints?
                closest_ckpt = min(checkpoints, key=lambda x: abs(x - processed))
                if abs(closest_ckpt - processed) < 200 and closest_ckpt not in [r['ckpt'] for r in results]:
                    now = time.time()
                    elapsed = now - start_time
                    int_elapsed = now - last_time
                    int_docs = processed - last_processed
                    
                    cum_rate = processed / elapsed if elapsed > 0 else 0
                    int_rate = int_docs / int_elapsed if int_elapsed > 0 else 0
                    
                    results.append({
                        'ckpt': closest_ckpt,
                        'docs': processed,
                        'elapsed': elapsed,
                        'cum_rate': cum_rate,
                        'int_rate': int_rate,
                        'ram': mem
                    })
                    
                    print(f"{closest_ckpt:>12} | {processed:>8} | {elapsed:>9.1f}s | {cum_rate:>12.2f} | {int_rate:>12.2f} | {mem:>10.1f}")
                    
                    last_processed = processed
                    last_time = now
    
    process.stdout.close()
    process.wait()
    
    elapsed = time.time() - start_time
    total_processed = last_processed
    if total_processed == 0:
        # Fallback if parsing failed
        total_processed = 10000 if process.returncode == 0 else 0
        
    cum_rate = total_processed / elapsed if elapsed > 0 else 0
    
    print("-" * 77)
    print(f"FINAL       | {total_processed:>8} | {elapsed:>9.1f}s | {cum_rate:>12.2f} |          - | {peak_ram:>10.1f}")
    
    if process.returncode != 0:
        print(f"\nFAILED (Exit Code {process.returncode})")
        
    print(f"\nTotal Time: {elapsed:.2f}s")
    print(f"Peak RAM: {peak_ram:.2f} MB")
    
if __name__ == "__main__":
    run_stability_benchmark()
