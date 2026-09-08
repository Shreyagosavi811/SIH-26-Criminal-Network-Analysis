import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class FiuAlertsAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "fiu_str_alerts"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = str(row.get("alert_id", f"ROW-{i}"))
            acc = str(row.get("account_id"))
            txn_ref = str(row.get("transaction_reference")) if row.get("transaction_reference") else ""
            
            text = (f"FIU Alert {source_rec_id}: {row.get('alert_category')} detected on account {acc} "
                    f"at {row.get('alert_timestamp')}. Indicator: {row.get('risk_indicator')}. "
                    f"Reason: {row.get('reported_reason')}")
            
            entities = [acc]
            if txn_ref: entities.append(txn_ref)
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=row.get("alert_timestamp"),
                entity_refs=entities,
                location_refs=[]
            ))
        return docs
