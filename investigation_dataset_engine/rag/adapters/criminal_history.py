import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class CriminalHistoryAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "criminal_history_db"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = str(row.get("history_record_id", f"ROW-{i}"))
            person = str(row.get("person_reference")) if row.get("person_reference") else ""
            text = (f"Criminal history record {source_rec_id} for {person}. "
                    f"Case {row.get('case_reference')} ({row.get('case_year')}): "
                    f"{row.get('offence_category')}. Status: {row.get('court_status')}, "
                    f"Disposal: {row.get('disposal_status')}.")
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=None,
                entity_refs=[person] if person else [],
                location_refs=[str(row.get("district"))] if "district" in row and row["district"] else []
            ))
        return docs
