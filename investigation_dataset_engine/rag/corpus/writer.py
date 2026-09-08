import os
import json
from typing import Iterator, Dict, Any, Tuple
from rag.models.evidence import EvidenceDocument

FORBIDDEN_LEAKAGE_TERMS = {
    "ground_truth",
    "ground-truth",
    "gt_",
    "is_criminal",
    "criminal_label",
    "true_role",
    "true_relationship",
    "benchmark",
    "answer",
    "gold",
    "target_label",
    "oracle",
    "hidden_label"
}

class DuplicateDocumentError(Exception):
    pass

class CorpusWriter:
    def __init__(self, output_path: str):
        self.output_path = output_path
        self.seen_ids = set()
        self.total_written = 0
        self.leakage_findings = []
        
    def _audit_structured_leakage(self, doc: EvidenceDocument) -> None:
        """
        Audits structured metadata and schema fields for forbidden terms.
        Distinguishes between structured fields (where leakage is bad) and 
        raw/normalized text (where an innocent occurrence is fine).
        """
        # Check provenance path
        if doc.provenance and doc.provenance.source_path:
            path_lower = doc.provenance.source_path.lower()
            for term in FORBIDDEN_LEAKAGE_TERMS:
                if term in path_lower:
                    self.leakage_findings.append({
                        "type": "STRUCTURED_LEAKAGE",
                        "field": "provenance.source_path",
                        "term": term,
                        "doc_id": doc.document_id,
                        "source_path": doc.provenance.source_path
                    })
        
        # Check raw content KEYS (not values, to avoid false positives on innocent text)
        if isinstance(doc.raw_content, dict):
            for key in doc.raw_content.keys():
                key_lower = str(key).lower()
                for term in FORBIDDEN_LEAKAGE_TERMS:
                    if term in key_lower:
                        self.leakage_findings.append({
                            "type": "STRUCTURED_LEAKAGE",
                            "field": f"raw_content.key({key})",
                            "term": term,
                            "doc_id": doc.document_id,
                            "source_path": doc.provenance.source_path if doc.provenance else "UNKNOWN"
                        })
                        
    def write(self, stream: Iterator[EvidenceDocument]) -> Dict[str, Any]:
        """
        Consumes the stream of EvidenceDocuments and writes them to a JSONL file.
        Returns statistics about the generation process.
        """
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)
        
        stats = {
            "total_documents": 0,
            "per_source_counts": {},
            "per_scenario_counts": {},
            "missing_normalized_text": 0,
            "missing_raw_content": 0,
            "missing_provenance": 0,
            "malformed_documents": 0,
            "entity_reference_counts": 0,
            "location_reference_counts": 0
        }
        
        with open(self.output_path, "w", encoding="utf-8") as f:
            for doc in stream:
                # 1. Validation & Audit
                if doc.document_id in self.seen_ids:
                    raise DuplicateDocumentError(f"Duplicate document ID detected: {doc.document_id}")
                self.seen_ids.add(doc.document_id)
                
                self._audit_structured_leakage(doc)
                
                # 2. Stats Collection
                stats["total_documents"] += 1
                stats["per_source_counts"][doc.source_type] = stats["per_source_counts"].get(doc.source_type, 0) + 1
                stats["per_scenario_counts"][doc.scenario_family] = stats["per_scenario_counts"].get(doc.scenario_family, 0) + 1
                
                if not doc.normalized_text:
                    stats["missing_normalized_text"] += 1
                if not doc.raw_content:
                    stats["missing_raw_content"] += 1
                if not doc.provenance:
                    stats["missing_provenance"] += 1
                
                stats["entity_reference_counts"] += len(doc.entity_refs)
                stats["location_reference_counts"] += len(doc.location_refs)
                
                # 3. Serialization
                try:
                    json_str = doc.to_json()
                    f.write(json_str + "\n")
                    self.total_written += 1
                except Exception as e:
                    stats["malformed_documents"] += 1
                    
        return stats
