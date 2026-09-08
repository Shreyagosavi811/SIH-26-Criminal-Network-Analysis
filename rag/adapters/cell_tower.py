import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class CellTowerAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "cell_tower_dumps"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = str(row.get("dump_id", f"ROW-{i}"))
            tower = str(row.get("tower_id"))
            phones = row.get("phone_numbers", [])
            
            text = (f"Cell Tower Dump {source_rec_id}: Tower {tower} logged {len(phones)} devices "
                    f"between {row.get('time_window_start')} and {row.get('time_window_end')}.")
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=row.get("time_window_start"),
                entity_refs=[str(p) for p in phones],
                location_refs=[tower]
            ))
        return docs
