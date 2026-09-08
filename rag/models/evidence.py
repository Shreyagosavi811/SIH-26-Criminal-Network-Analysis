import json
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

@dataclass
class Provenance:
    source_path: str
    ingestion_version: str = "1.0"
    
@dataclass
class EvidenceDocument:
    document_id: str
    scenario_instance_id: str
    scenario_family: str
    source_type: str
    source_record_id: str
    raw_content: Dict[str, Any]
    normalized_text: str
    timestamp: Optional[str] = None
    entity_refs: List[str] = field(default_factory=list)
    location_refs: List[str] = field(default_factory=list)
    provenance: Optional[Provenance] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def to_json(self) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False)
