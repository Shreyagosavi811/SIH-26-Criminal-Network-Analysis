import os
import sys
import time
import json
import argparse
from typing import Dict, Any
from rag.corpus.builder import CorpusBuilder
from rag.corpus.writer import CorpusWriter, DuplicateDocumentError

def main():
    parser = argparse.ArgumentParser(description="Phase 8B RAG Corpus Generation")
    parser.add_argument("--small-scale", action="store_true", help="Run small-scale validation (max 10 docs per source)")
    parser.add_argument("--observed-dir", type=str, default=os.path.join("output", "FINAL_EVALUATION", "output", "OBSERVED"), help="Path to frozen observed records")
    parser.add_argument("--output-dir", type=str, default=os.path.join("output", "RAG_CORPUS"), help="Output directory for RAG corpus")
    
    args = parser.parse_args()
    
    print("==================================================")
    print(" PHASE 8B RAG CORPUS GENERATION")
    print("==================================================")
    print(f"Mode: {'SMALL-SCALE VALIDATION' if args.small_scale else 'FULL CORPUS'}")
    print(f"Input: {args.observed_dir}")
    print(f"Output: {args.output_dir}")
    
    if not os.path.exists(args.observed_dir):
        print(f"ERROR: Input directory {args.observed_dir} not found.")
        sys.exit(1)
        
    start_time = time.time()
    
    builder = CorpusBuilder(args.observed_dir)
    
    output_filename = "corpus_small.jsonl" if args.small_scale else "corpus_full.jsonl"
    output_path = os.path.join(args.output_dir, output_filename)
    
    writer = CorpusWriter(output_path)
    
    try:
        # Create generator stream
        doc_stream = builder.stream_documents(small_scale=args.small_scale, max_per_source=10)
        
        # Consume stream and write
        stats = writer.write(doc_stream)
        
    except DuplicateDocumentError as e:
        print(f"\\n[FAIL] Deduplication Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\\n[FAIL] Unexpected Error: {e}")
        sys.exit(1)
        
    elapsed = time.time() - start_time
    output_size = os.path.getsize(output_path) if os.path.exists(output_path) else 0
    
    print("\n==================================================")
    print(" CORPUS STATISTICS")
    print("==================================================")
    print(f"Total Documents Generated: {stats['total_documents']}")
    print(f"Total Written to File    : {writer.total_written}")
    print(f"Processing Time          : {elapsed:.2f} seconds")
    print(f"Output File Size         : {output_size / (1024*1024):.2f} MB")
    
    print("\n[PER-SOURCE COUNTS]")
    for src, count in sorted(stats['per_source_counts'].items()):
        print(f"  {src}: {count}")
        
    print("\n[PER-SCENARIO COUNTS]")
    for sc, count in sorted(stats['per_scenario_counts'].items()):
        print(f"  {sc}: {count}")
        
    print("\n[DATA INTEGRITY]")
    print(f"Missing Normalized Text : {stats['missing_normalized_text']}")
    print(f"Missing Raw Content     : {stats['missing_raw_content']}")
    print(f"Missing Provenance      : {stats['missing_provenance']}")
    print(f"Malformed Documents     : {stats['malformed_documents']}")
    print(f"Entity Refs Extracted   : {stats['entity_reference_counts']}")
    print(f"Location Refs Extracted : {stats['location_reference_counts']}")
    
    print("\n[LEAKAGE AUDIT]")
    if writer.leakage_findings:
        print(f"FAIL: Found {len(writer.leakage_findings)} structured leakage violations.")
        for finding in writer.leakage_findings[:10]:
            print(f"  - {finding['type']} in {finding['field']} (term: '{finding['term']}') on DOC {finding['doc_id']}")
        if len(writer.leakage_findings) > 10:
            print(f"  ... and {len(writer.leakage_findings) - 10} more.")
        sys.exit(1)
    else:
        print("PASS: Zero structured leakage violations found.")
        
    print("\n[DEDUPLICATION]")
    print(f"PASS: Zero duplicate document IDs found.")
    
    print("==================================================")
    print(" STATUS: PASS")
    print("==================================================")

if __name__ == "__main__":
    main()
