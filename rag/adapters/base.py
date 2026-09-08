import os
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

from rag.models.evidence import EvidenceDocument, Provenance

class SourceAdapter(ABC):
    """Base class for all Phase 8A source adapters."""
    
    @property
    @abstractmethod
    def source_type(self) -> str:
        """String identifier of the source, e.g., 'cctns_fir_records'."""
        pass
        
    @property
    @abstractmethod
    def supported_extensions(self) -> List[str]:
        """List of supported extensions, e.g., ['.json', '.csv']."""
        pass
        
    def can_handle(self, path: str) -> bool:
        """Determines if this adapter can handle the given path based on filename/extension."""
        if "GROUND_TRUTH" in path or "ML_BENCHMARK" in path:
            return False
        basename = os.path.basename(path)
        ext = os.path.splitext(basename)[1].lower()
        if ext not in self.supported_extensions:
            return False
        return basename.startswith(self.source_type)
        
    @abstractmethod
    def parse(self, path: str) -> List[EvidenceDocument]:
        """Parse the raw file and emit a list of EvidenceDocuments."""
        pass
        
    def _create_doc(
        self,
        record: Dict[str, Any],
        scenario_instance_id: str,
        source_record_id: str,
        normalized_text: str,
        source_path: str,
        timestamp: Optional[str] = None,
        entity_refs: Optional[List[str]] = None,
        location_refs: Optional[List[str]] = None
    ) -> EvidenceDocument:
        """Helper to create a deterministic EvidenceDocument."""
        
        # Derive scenario family. e.g. S11 -> S01, S100 -> S10.
        try:
            sid_int = int(scenario_instance_id.replace("S", ""))
            family_int = ((sid_int - 1) % 10) + 1
            scenario_family = f"S{family_int:02d}"
        except ValueError:
            scenario_family = scenario_instance_id
            
        doc_id = f"{scenario_instance_id}::{self.source_type}::{source_record_id}"
        
        prov = Provenance(
            source_path=source_path.replace("\\", "/"),  # Normalize for cross-platform stability
            ingestion_version="1.0"
        )
        
        return EvidenceDocument(
            document_id=doc_id,
            scenario_instance_id=scenario_instance_id,
            scenario_family=scenario_family,
            source_type=self.source_type,
            source_record_id=source_record_id,
            raw_content=record,
            normalized_text=normalized_text,
            timestamp=timestamp,
            entity_refs=list(set(entity_refs)) if entity_refs else [],
            location_refs=list(set(location_refs)) if location_refs else [],
            provenance=prov
        )
