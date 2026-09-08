import pandas as pd, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class BankTransactionsAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "cbs_bank_transactions"
    @property
    def supported_extensions(self) -> List[str]: return [".csv"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        df = pd.read_csv(path)
        
        docs = []
        for i, row_s in df.iterrows():
            row = row_s.to_dict()
            source_rec_id = str(row.get("transaction_id", f"ROW-{i}"))
            src = str(row.get("source_account"))
            dst = str(row.get("destination_account"))
            amt = row.get("amount")
            ts = str(row.get("timestamp"))
            
            text = f"Bank Transaction {source_rec_id}: {src} sent INR {amt} to {dst} via {row.get('channel', 'UNKNOWN')} at {ts}."
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=ts,
                entity_refs=[src, dst],
                location_refs=[str(row.get("branch_id"))] if "branch_id" in row and pd.notna(row["branch_id"]) else []
            ))
        return docs
