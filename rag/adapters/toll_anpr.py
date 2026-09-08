import pandas as pd, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class TollAnprAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "toll_anpr_logs"
    @property
    def supported_extensions(self) -> List[str]: return [".csv"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        df = pd.read_csv(path)
        
        docs = []
        for i, row_s in df.iterrows():
            row = row_s.to_dict()
            source_rec_id = str(row.get("anpr_id", f"ROW-{i}"))
            plate = str(row.get("vehicle_id_or_plate"))
            plaza = str(row.get("toll_plaza"))
            ts = str(row.get("timestamp"))
            
            text = f"ANPR {source_rec_id}: Vehicle {plate} spotted at {plaza} (lane {row.get('lane')}) travelling {row.get('direction')} at {ts}."
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=ts,
                entity_refs=[plate],
                location_refs=[plaza] if plaza else []
            ))
        return docs
