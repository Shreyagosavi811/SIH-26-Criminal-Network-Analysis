import os, re
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class FieldNotesAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "field_intelligence_notes"
    @property
    def supported_extensions(self) -> List[str]: return [".txt"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
            
        docs = []
        lines = content.split("\n")
        for i, line in enumerate(lines):
            line = line.strip()
            if not line.startswith("[FNOTE-"): continue
            
            match = re.match(r"\[(FNOTE-[^\]]+)\]\s*(?:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\s*HRS:)?\s*(.*)", line)
            if match:
                fnote_id = match.group(1)
                ts_str = match.group(2)
                text_content = match.group(3)
                
                ts = None
                if ts_str:
                    ts = ts_str + ":00Z"
                    
                docs.append(self._create_doc(
                    record={"text": line},
                    scenario_instance_id=scenario_id,
                    source_record_id=fnote_id,
                    normalized_text=line,
                    source_path=path,
                    timestamp=ts,
                    entity_refs=[],
                    location_refs=[]
                ))
        return docs
