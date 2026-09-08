import os
import sys
import time
import subprocess
import psutil

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_benchmark(batch_size: int, threads: int):
    print(f"\n==================================================")
    print(f" BENCHMARK: batch={batch_size}, threads={threads}")
    print(f"==================================================")
    
    env = os.environ.copy()
    env["EMBEDDING_BATCH_SIZE"] = str(batch_size)
    env["EMBEDDING_THREADS"] = str(threads)
    # The config now explicitly tells PyTorch how many threads to use via OMP_NUM_THREADS
    env["OMP_NUM_THREADS"] = str(threads)
    env["MKL_NUM_THREADS"] = str(threads)
    env["QDRANT_COLLECTION"] = "sih26189_evidence_benchmark_temp"
    env["ENVIRONMENT"] = "test"
    env["CHECKPOINT_DIR"] = os.path.join("output", "RAG_CORPUS", f"checkpoints_bench_10c_{batch_size}_{threads}")
    
    start_time = time.time()
    
    process = subprocess.Popen(
        [sys.executable, "-m", "scripts.index_rag_corpus", "--medium-scale"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    peak_ram = 0.0
    p = psutil.Process(process.pid)
    
    while process.poll() is None:
        try:
            mem = p.memory_info().rss / (1024 * 1024)
            if mem > peak_ram:
                peak_ram = mem
            time.sleep(0.5)
        except psutil.NoSuchProcess:
            break
            
    stdout, stderr = process.communicate()
    
    if process.returncode != 0:
        print(f"FAILED (Exit Code {process.returncode})")
        print("STDOUT:", stdout)
        print("STDERR:", stderr)
        return False, 0.0, 0, peak_ram
        
    elapsed = time.time() - start_time
    
    total_processed = 0
    for line in stdout.split('\n'):
        if line.startswith("Total Processed"):
            parts = line.split(":")
            if len(parts) > 1:
                total_processed = int(parts[1].strip())
                break
                
    docs_per_sec = total_processed / elapsed if elapsed > 0 else 0
    
    print(f"Processed: {total_processed} docs")
    print(f"Time     : {elapsed:.2f} s")
    print(f"Rate     : {docs_per_sec:.2f} docs/sec")
    print(f"Peak RAM : {peak_ram:.2f} MB")
    
    return True, elapsed, total_processed, peak_ram

def main():
    configs = [
        (32, 4),
        (32, 6),
        (32, 8),
        (64, 8)
    ]
    
    results = []
    for batch, threads in configs:
        success, elapsed, processed, peak_ram = run_benchmark(batch, threads)
        results.append({
            "batch": batch,
            "threads": threads,
            "success": success,
            "elapsed": elapsed,
            "processed": processed,
            "peak_ram": peak_ram
        })
        
    print("\n\nFINAL OUTPUT TABLE:")
    print("| Batch | Threads | Documents | Time | Docs/sec | Peak RAM | Result |")
    print("|---:|---:|---:|---:|---:|---:|---|")
    for r in results:
        status = "PASS" if r["success"] else "FAIL"
        rate = r["processed"] / r["elapsed"] if r["elapsed"] > 0 else 0
        docs = f"~{r['processed']}" if r['processed'] > 0 else "0"
        print(f"| {r['batch']} | {r['threads']} | {docs} | {r['elapsed']:.2f}s | {rate:.2f} | {r['peak_ram']:.0f} MB | {status} |")

if __name__ == "__main__":
    main()
