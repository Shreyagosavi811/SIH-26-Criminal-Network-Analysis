import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class TelecomCafAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "telecom_caf_kyc"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = str(row.get("caf_id", f"ROW-{i}"))
            phone = str(row.get("phone_number"))
            sub = str(row.get("subscriber_name")) if row.get("subscriber_name") else ""
            
            text = (f"CAF {source_rec_id}: Phone number {phone} registered to {sub} "
                    f"at {row.get('synthetic_address', '')}, {row.get('district', '')}. "
                    f"Activated on {row.get('activation_date')}.")
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=str(row.get("activation_date")) if row.get("activation_date") else None,
                entity_refs=[phone, sub] if sub else [phone],
                location_refs=[str(row.get("district"))] if "district" in row and row["district"] else []
            ))
        return docs
