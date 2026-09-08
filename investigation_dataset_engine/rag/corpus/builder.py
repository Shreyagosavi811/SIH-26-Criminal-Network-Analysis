import os
from typing import Iterator, Optional
from rag.models.evidence import EvidenceDocument
from rag.adapters import ALL_ADAPTERS

class CorpusBuilder:
    """
    Coordinates Phase 8A source adapters to stream EvidenceDocuments from the OBSERVED dataset.
    """
    def __init__(self, observed_dir: str):
        self.observed_dir = observed_dir
        
    def stream_documents(self, small_scale: bool = False, max_per_source: int = 10) -> Iterator[EvidenceDocument]:
        """
        Streams EvidenceDocuments file by file.
        If small_scale is True, stops reading after max_per_source documents are yielded for each source type.
        """
        if "GROUND_TRUTH" in self.observed_dir or "ML_BENCHMARK" in self.observed_dir:
            raise ValueError(f"Isolation Violation: Path {self.observed_dir} contains evaluation-only directories.")
            
        counts = {adapter.source_type: 0 for adapter in ALL_ADAPTERS}
        
        if not os.path.exists(self.observed_dir):
            return
            
        # Iterate over scenario directories (e.g., S01, S02, ...)
        scenarios = sorted(os.listdir(self.observed_dir))
        for scenario in scenarios:
            scenario_path = os.path.join(self.observed_dir, scenario)
            if not os.path.isdir(scenario_path):
                continue
                
            # Iterate over files in the scenario
            files = sorted(os.listdir(scenario_path))
            for filename in files:
                file_path = os.path.join(scenario_path, filename)
                
                # Check for isolation in file path
                if "GROUND_TRUTH" in file_path or "ML_BENCHMARK" in file_path:
                    continue
                
                for adapter in ALL_ADAPTERS:
                    if adapter.can_handle(file_path):
                        if small_scale and counts[adapter.source_type] >= max_per_source:
                            continue
                            
                        # Parse the entire file into memory (since files are small, this is safe)
                        docs = adapter.parse(file_path)
                        
                        # Yield documents one by one
                        for doc in docs:
                            if small_scale and counts[adapter.source_type] >= max_per_source:
                                break
                            yield doc
                            counts[adapter.source_type] += 1
                        break # Only one adapter handles a file
                        
            # Early exit for small-scale if all counts met
            if small_scale:
                if all(c >= max_per_source for c in counts.values()):
                    break
