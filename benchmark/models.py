"""
SIH26189 Benchmark Data Models
All benchmark examples follow an input/label/metadata separation.
The `input` field contains ONLY what the ML model is allowed to see.
The `label` field contains the hidden evaluation target.
The `metadata` field contains benchmark bookkeeping (NOT model input).
"""
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional


# ── Entity Resolution ─────────────────────────────────────────────────────────

@dataclass
class MatchFeatures:
    name_similarity: float = 0.0
    phone_match: bool = False
    address_similarity: float = 0.0
    source_agreement: int = 0
    shared_features: List[str] = field(default_factory=list)


@dataclass
class ERInput:
    """What the model sees — no canonical IDs, no role labels."""
    record_a_id: str
    record_b_id: str
    entity_type: str       # PERSON, PHONE, ACCOUNT, VEHICLE
    source_a: str
    source_b: str
    match_features: Dict[str, Any] = field(default_factory=dict)
    attributes_a: Dict[str, Any] = field(default_factory=dict)
    attributes_b: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ERExample:
    pair_id: str
    input: ERInput
    label: bool                    # same_entity
    metadata: Dict[str, Any] = field(default_factory=dict)
    # metadata holds: scenario_id, noise_level, noise_ratio, negative_type (easy/hard)

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["label"] = int(self.label)
        return d


# ── Link Prediction ───────────────────────────────────────────────────────────

@dataclass
class LPInput:
    source_entity: str   # observed record ID (not canonical ID)
    target_entity: str
    relation_type: str
    supporting_record_ids: List[str] = field(default_factory=list)
    context_records: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class LPExample:
    candidate_id: str
    input: LPInput
    label: int   # 1=edge exists, 0=no edge
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ── Multi-Hop ─────────────────────────────────────────────────────────────────

@dataclass
class MHInput:
    source_record_id: str       # observed source record (not canonical ID)
    target_record_id: str       # observed target record
    context_records: List[Dict[str, Any]] = field(default_factory=list)
    max_hops: int = 4


@dataclass
class MHExample:
    query_id: str
    input: MHInput
    label: bool                      # connected or not
    hop_count: int                   # HIDDEN — for eval only (in metadata)
    metadata: Dict[str, Any] = field(default_factory=dict)
    # metadata contains: valid_path (hidden), supporting_evidence, scenario_id

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["label"] = int(self.label)
        # hop_count is moved to metadata by build step; keep in model output eval
        return d


# ── Anomaly Detection ─────────────────────────────────────────────────────────

@dataclass
class ADInput:
    entity_record_id: str
    entity_type: str
    domain: str              # financial, communication, movement, vehicle, temporal
    observations: List[Dict[str, Any]] = field(default_factory=list)
    evidence_ids: List[str] = field(default_factory=list)


@dataclass
class ADExample:
    anomaly_id: str
    input: ADInput
    label: int               # 1=anomalous, 0=normal
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ── Temporal Reasoning ────────────────────────────────────────────────────────

@dataclass
class TRInput:
    event_a_id: str
    event_b_id: str
    event_a_timestamp: Optional[str] = None
    event_b_timestamp: Optional[str] = None
    context_records: List[Dict[str, Any]] = field(default_factory=list)
    relation_choices: List[str] = field(default_factory=lambda: ["BEFORE", "AFTER", "OVERLAP", "UNKNOWN"])


@dataclass
class TRExample:
    query_id: str
    input: TRInput
    label: str               # BEFORE, AFTER, OVERLAP, UNKNOWN
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ── False Positive Discrimination ─────────────────────────────────────────────

@dataclass
class FPInput:
    case_id: str
    candidate_record_id: str
    suspicious_features: List[str] = field(default_factory=list)
    supporting_evidence_ids: List[str] = field(default_factory=list)
    contradicting_evidence_ids: List[str] = field(default_factory=list)
    observations: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class FPExample:
    case_id: str
    input: FPInput
    label: int               # 1=genuinely suspicious, 0=false positive (benign)
    alternative_hypothesis: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ── Evidence Retrieval ────────────────────────────────────────────────────────

@dataclass
class EVInput:
    claim_id: str
    claim: str
    candidate_record_ids: List[str] = field(default_factory=list)
    source_types: List[str] = field(default_factory=list)


@dataclass
class EVExample:
    claim_id: str
    input: EVInput
    label: int               # 1=supported, 0=unsupported
    supporting_record_ids: List[str] = field(default_factory=list)   # hidden eval
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ── Split and Statistics ──────────────────────────────────────────────────────

@dataclass
class BenchmarkSplit:
    split_name: str
    entity_resolution: List[ERExample] = field(default_factory=list)
    link_prediction:   List[LPExample] = field(default_factory=list)
    multi_hop:         List[MHExample] = field(default_factory=list)
    anomaly_detection: List[ADExample] = field(default_factory=list)
    temporal_reasoning:List[TRExample] = field(default_factory=list)
    false_positive:    List[FPExample] = field(default_factory=list)
    evidence_retrieval:List[EVExample] = field(default_factory=list)

    def counts(self) -> Dict[str, int]:
        return {
            "entity_resolution":  len(self.entity_resolution),
            "link_prediction":    len(self.link_prediction),
            "multi_hop":          len(self.multi_hop),
            "anomaly_detection":  len(self.anomaly_detection),
            "temporal_reasoning": len(self.temporal_reasoning),
            "false_positive":     len(self.false_positive),
            "evidence_retrieval": len(self.evidence_retrieval),
            "total": sum([len(self.entity_resolution), len(self.link_prediction),
                          len(self.multi_hop), len(self.anomaly_detection),
                          len(self.temporal_reasoning), len(self.false_positive),
                          len(self.evidence_retrieval)]),
        }


@dataclass
class BenchmarkStats:
    total_examples: int = 0
    per_task: Dict[str, int] = field(default_factory=dict)
    per_scenario: Dict[str, int] = field(default_factory=dict)
    positives: int = 0
    negatives: int = 0
    hard_negatives: int = 0
    noise_level_dist: Dict[str, int] = field(default_factory=dict)
    split_sizes: Dict[str, Dict[str, int]] = field(default_factory=dict)
    hop_length_dist: Dict[str, int] = field(default_factory=dict)
    entity_type_dist: Dict[str, int] = field(default_factory=dict)
    leakage_passed: bool = False
