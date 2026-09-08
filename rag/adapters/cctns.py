import json, os
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
