import os
import json
from typing import List, Dict, Any, Optional

class CorpusService:
    _instance = None
    _records: List[Dict[str, Any]] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(CorpusService, cls).__new__(cls)
            cls._instance._load_corpus()
        return cls._instance

    def _load_corpus(self):
        # Calculate path dynamically to support running from any CWD
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(base_dir, "../../../"))
        corpus_path = os.path.join(
            project_root, 
            "investigation_dataset_engine", 
            "output", 
            "RAG_CORPUS", 
            "corpus_small.jsonl"
        )

        if not os.path.exists(corpus_path):
            raise RuntimeError(f"MVP Corpus missing at {corpus_path}. Only corpus_small.jsonl is permitted.")

        with open(corpus_path, "r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                record = json.loads(line)
                
                # Guardrail: Never load ground truth
                if "GROUND_TRUTH" in record.get("provenance", {}).get("source_path", ""):
                    raise RuntimeError("Data leakage error: GROUND_TRUTH record detected.")
                
                # Guardrail: Sanitize provenance paths
                if "provenance" in record and "source_path" in record["provenance"]:
                    # Just keep the filename/source_type, not the internal path structure
                    raw_path = record["provenance"]["source_path"]
                    filename = os.path.basename(raw_path)
                    record["provenance"]["source_path"] = f"Redacted / {filename}"

                self._records.append(record)

        if len(self._records) != 100:
            raise RuntimeError(f"MVP Corpus validation failed. Expected 100 records, got {len(self._records)}.")

    def get_all_records(self) -> List[Dict[str, Any]]:
        return self._records

    def get_scenarios(self) -> Dict[str, int]:
        scenarios = {}
        for r in self._records:
            sid = r.get("scenario_instance_id")
            if sid:
                scenarios[sid] = scenarios.get(sid, 0) + 1
        return scenarios

    def get_records(self, scenario_id: Optional[str] = None, source_type: Optional[str] = None, entity_id: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        filtered = self._records

        if scenario_id:
            filtered = [r for r in filtered if r.get("scenario_instance_id") == scenario_id]
        if source_type:
            filtered = [r for r in filtered if r.get("source_type") == source_type]
        if entity_id:
            # Case insensitive exact match in entity_refs
            eid_lower = entity_id.lower()
            filtered = [
                r for r in filtered 
                if any(eid_lower == str(er).lower() for er in r.get("entity_refs", []))
            ]

        return filtered[offset:offset+limit]

    def search_records(self, query: str, scenario_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        # Deterministic retrieval
        filtered = self._records
        if scenario_id:
            filtered = [r for r in filtered if r.get("scenario_instance_id") == scenario_id]

        q_lower = query.lower()
        results = []

        for r in filtered:
            score = 0
            # Simple scoring based on matches in normalized_text and entities
            text = str(r.get("normalized_text", "")).lower()
            if q_lower in text:
                score += 1
            
            for ent in r.get("entity_refs", []):
                if q_lower in str(ent).lower():
                    score += 2

            for loc in r.get("location_refs", []):
                if q_lower in str(loc).lower():
                    score += 1

            if q_lower in str(r.get("source_type", "")).lower():
                score += 1

            if score > 0:
                results.append((score, r))

        # Sort by score descending
        results.sort(key=lambda x: x[0], reverse=True)
        return [r for score, r in results[:limit]]

# Create a singleton instance immediately to validate during startup
corpus_service = CorpusService()
