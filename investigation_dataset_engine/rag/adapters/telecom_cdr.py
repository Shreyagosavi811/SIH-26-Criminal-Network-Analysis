import pandas as pd, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class TelecomCdrAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "telecom_cdr_logs"
    @property
    def supported_extensions(self) -> List[str]: return [".csv"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        df = pd.read_csv(path)
        
        docs = []
        for i, row_s in df.iterrows():
            row = row_s.to_dict()
            source_rec_id = str(row.get("cdr_id", f"ROW-{i}"))
            caller = str(row.get("caller_phone"))
            receiver = str(row.get("receiver_phone"))
            dur = row.get("duration_seconds")
            ts = str(row.get("timestamp"))
            
            text = f"CDR {source_rec_id}: {row.get('call_type')} call from {caller} to {receiver} lasting {dur}s at {ts}."
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=ts,
                entity_refs=[caller, receiver],
                location_refs=[str(row.get("tower_id"))] if "tower_id" in row and pd.notna(row["tower_id"]) else []
            ))
        return docs
