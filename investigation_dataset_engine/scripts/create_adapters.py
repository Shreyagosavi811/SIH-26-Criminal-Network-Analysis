import os

adapters = {
    'cctns.py': '''import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class CctnsAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "cctns_fir_records"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = row.get("fir_no", f"ROW-{i}")
            
            comp_val = row.get("complainant")
            comp_name = comp_val.get("name") if isinstance(comp_val, dict) else (str(comp_val) if comp_val else "")
            
            accused_list = row.get("accused_persons", [])
            acc_names = [a.get("name") if isinstance(a, dict) else str(a) for a in accused_list]
            
            entities = []
            if comp_name: entities.append(comp_name)
            entities.extend(acc_names)
            
            locs = []
            if "incident_location" in row and row["incident_location"]: locs.append(str(row["incident_location"]))
            if "police_station" in row and row["police_station"]: locs.append(str(row["police_station"]))
            
            acc_str = ", ".join(acc_names)
            text = (f"FIR {row.get('fir_no')} registered at {row.get('police_station')} "
                    f"on {row.get('registration_datetime')}. Complainant: {comp_name}. "
                    f"Accused: {acc_str}. "
                    f"Summary: {row.get('complaint_summary')}")
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=row.get("registration_datetime"),
                entity_refs=entities,
                location_refs=locs
            ))
        return docs
''',
    
    'criminal_history.py': '''import json, os
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
''',

    'telecom_cdr.py': '''import pandas as pd, os
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
''',

    'telecom_caf.py': '''import json, os
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
''',

    'bank_transactions.py': '''import pandas as pd, os
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
''',

    'fiu_alerts.py': '''import json, os
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
''',

    'toll_anpr.py': '''import pandas as pd, os
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
''',

    'cell_tower.py': '''import json, os
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
''',

    'osint.py': '''import json, os
from typing import List
from rag.adapters.base import SourceAdapter
from rag.models.evidence import EvidenceDocument

class OsintAdapter(SourceAdapter):
    @property
    def source_type(self) -> str: return "osint_social_posts"
    @property
    def supported_extensions(self) -> List[str]: return [".json"]
    
    def parse(self, path: str) -> List[EvidenceDocument]:
        if not self.can_handle(path): return []
        scenario_id = os.path.basename(os.path.dirname(path))
        with open(path, "r", encoding="utf-8") as f: data = json.load(f)
        
        docs = []
        for i, row in enumerate(data):
            source_rec_id = str(row.get("post_id", f"ROW-{i}"))
            acc = str(row.get("synthetic_account"))
            
            text = (f"OSINT Post {source_rec_id}: Account '{acc}' posted on {row.get('platform')} "
                    f"at {row.get('timestamp')}: '{row.get('text')}'.")
            
            locs = []
            if "location_hint" in row and row["location_hint"]:
                locs.append(str(row["location_hint"]))
                
            mentions = row.get("mentioned_entities", [])
            mention_strs = [m.get("name") if isinstance(m, dict) else str(m) for m in mentions]
            
            docs.append(self._create_doc(
                record=row,
                scenario_instance_id=scenario_id,
                source_record_id=source_rec_id,
                normalized_text=text,
                source_path=path,
                timestamp=row.get("timestamp"),
                entity_refs=[acc] + mention_strs,
                location_refs=locs
            ))
        return docs
''',

    'field_notes.py': '''import os, re
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
        lines = content.split("\\n")
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
'''
}

for name, code in adapters.items():
    with open(os.path.join("rag", "adapters", name), "w", encoding="utf-8") as f:
        f.write(code)

init_code = '''
from .base import SourceAdapter
from .cctns import CctnsAdapter
from .criminal_history import CriminalHistoryAdapter
from .telecom_cdr import TelecomCdrAdapter
from .telecom_caf import TelecomCafAdapter
from .bank_transactions import BankTransactionsAdapter
from .fiu_alerts import FiuAlertsAdapter
from .toll_anpr import TollAnprAdapter
from .cell_tower import CellTowerAdapter
from .osint import OsintAdapter
from .field_notes import FieldNotesAdapter

ALL_ADAPTERS = [
    CctnsAdapter(),
    CriminalHistoryAdapter(),
    TelecomCdrAdapter(),
    TelecomCafAdapter(),
    BankTransactionsAdapter(),
    FiuAlertsAdapter(),
    TollAnprAdapter(),
    CellTowerAdapter(),
    OsintAdapter(),
    FieldNotesAdapter()
]
'''
with open(os.path.join("rag", "adapters", "__init__.py"), "w", encoding="utf-8") as f:
    f.write(init_code.strip())
