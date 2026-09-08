import os
import sys
import time
import subprocess
import psutil

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

def run_benchmark(batch_size: int, threads: int = 4):
    print(f"\n==================================================")
    print(f" BENCHMARK: batch={batch_size}, threads={threads}")
    print(f"==================================================")
    
    env = os.environ.copy()
    env["EMBEDDING_BATCH_SIZE"] = str(batch_size)
    env["EMBEDDING_THREADS"] = str(threads)
    env["QDRANT_COLLECTION"] = "sih26189_evidence_benchmark_temp"
    env["ENVIRONMENT"] = "test"
    # Isolate checkpoint so it starts fresh each time
    env["CHECKPOINT_DIR"] = os.path.join("output", "RAG_CORPUS", f"checkpoints_bench_{batch_size}")
    
    start_time = time.time()
    
    # Run indexer as a subprocess to accurately capture peak memory of the process
    # and to ensure a clean state for BGE-M3 model loading
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
            mem = p.memory_info().rss / (1024 * 1024) # MB
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
    
    # Parse output to find total processed
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
        (8, 4),
        (16, 4),
        (32, 4)
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
