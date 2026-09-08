import os
import json
import pytest
from typing import Iterator
from rag.models.evidence import EvidenceDocument, Provenance
from rag.corpus.builder import CorpusBuilder
from rag.corpus.writer import CorpusWriter, DuplicateDocumentError

def test_ground_truth_isolation():
    builder = CorpusBuilder(os.path.join("output", "FINAL_EVALUATION", "output", "GROUND_TRUTH"))
    with pytest.raises(ValueError, match="Isolation Violation"):
        list(builder.stream_documents())

def test_benchmark_isolation():
    builder = CorpusBuilder(os.path.join("output", "FINAL_EVALUATION", "output", "ML_BENCHMARK"))
    with pytest.raises(ValueError, match="Isolation Violation"):
        list(builder.stream_documents())

def test_duplicate_document_id_detection(tmp_path):
    output_file = tmp_path / "corpus.jsonl"
    writer = CorpusWriter(str(output_file))
    
    doc1 = EvidenceDocument(
        document_id="DOC_001",
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="cctns",
        source_record_id="REC_01",
        raw_content={"key": "val"},
        normalized_text="Test Text",
        provenance=Provenance(source_path="OBSERVED/S01/file.json")
    )
    
    doc2 = EvidenceDocument(
        document_id="DOC_001", # Duplicate ID
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="cctns",
        source_record_id="REC_02",
        raw_content={"key": "val2"},
        normalized_text="Test Text 2",
        provenance=Provenance(source_path="OBSERVED/S01/file.json")
    )
    
    def mock_stream() -> Iterator[EvidenceDocument]:
        yield doc1
        yield doc2
        
    with pytest.raises(DuplicateDocumentError, match="Duplicate document ID detected: DOC_001"):
        writer.write(mock_stream())

def test_hidden_label_leakage(tmp_path):
    output_file = tmp_path / "corpus_leak.jsonl"
    writer = CorpusWriter(str(output_file))
    
    doc = EvidenceDocument(
        document_id="DOC_002",
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="cctns",
        source_record_id="REC_01",
        raw_content={"ground_truth_role": "criminal"}, # Leakage in key
        normalized_text="Test Text",
        provenance=Provenance(source_path="OBSERVED/S01/file.json")
    )
    
    def mock_stream() -> Iterator[EvidenceDocument]:
        yield doc
        
    writer.write(mock_stream())
    
    assert len(writer.leakage_findings) > 0
    assert writer.leakage_findings[0]["type"] == "STRUCTURED_LEAKAGE"
    assert writer.leakage_findings[0]["term"] == "ground_truth"

def test_legitimate_suspicious_text_allowed(tmp_path):
    output_file = tmp_path / "corpus_legit.jsonl"
    writer = CorpusWriter(str(output_file))
    
    doc = EvidenceDocument(
        document_id="DOC_003",
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="osint",
        source_record_id="REC_01",
        raw_content={"text": "I set a new benchmark today!"}, # "benchmark" in value is allowed
        normalized_text="I set a new benchmark today!",
        provenance=Provenance(source_path="OBSERVED/S01/file.json")
    )
    
    def mock_stream() -> Iterator[EvidenceDocument]:
        yield doc
        
    writer.write(mock_stream())
    assert len(writer.leakage_findings) == 0

def test_streaming_and_serialization(tmp_path):
    output_file = tmp_path / "corpus_stream.jsonl"
    writer = CorpusWriter(str(output_file))
    
    doc = EvidenceDocument(
        document_id="DOC_004",
        scenario_instance_id="S01",
        scenario_family="S01",
        source_type="cctns",
        source_record_id="REC_01",
        raw_content={"key": "val"},
        normalized_text="Text",
        entity_refs=["E1"],
        location_refs=["L1"],
        timestamp="2026-01-01",
        provenance=Provenance(source_path="OBSERVED/S01/file.json")
    )
    
    def mock_stream() -> Iterator[EvidenceDocument]:
        yield doc
        
    stats = writer.write(mock_stream())
    assert stats["total_documents"] == 1
    assert stats["missing_normalized_text"] == 0
    assert stats["entity_reference_counts"] == 1
    
    with open(output_file, "r") as f:
        lines = f.readlines()
        assert len(lines) == 1
        data = json.loads(lines[0])
        assert data["document_id"] == "DOC_004"
        assert data["raw_content"]["key"] == "val"
