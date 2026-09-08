import json, os
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
