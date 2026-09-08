"""
SIH26189 Scenario Base Classes
Defines the ScenarioResult contract that every scenario builder must return.
"""
from dataclasses import dataclass, field
from typing import List, Dict, Any

from generator.models import GroundTruthManifest, InvestigationQuery, InvestigationAnswer
from generator.context import ScenarioContext


@dataclass
class HardNegative:
    """A pair of records/entities that share surface features but are NOT the same entity."""
    negative_id: str
    record_a_id: str
    record_b_id: str
    shared_features: List[str]       # e.g. ["same_name", "same_district"]
    true_label: bool = False          # always False for hard negatives


@dataclass
class EvidenceChain:
    """Maps a GT relationship claim to the observed record IDs that support it."""
    chain_id: str
    claim: str                        # human-readable e.g. "Person A linked to Person B"
    gt_edge_id: str
    supporting_record_ids: List[str]  # must exist in observed output
    source_types: List[str]           # e.g. ["cdr","bank","anpr"]
    source_diversity: int = 0

    def __post_init__(self):
        self.source_diversity = len(set(self.source_types))


@dataclass
class AlternativeHypothesis:
    hypothesis_id: str
    description: str
    supporting_features: List[str]
    why_weaker: str                   # why the ground-truth hypothesis is stronger


@dataclass
class ScenarioResult:
    """Full result returned by every scenario builder."""
    scenario_id: str
    ground_truth: GroundTruthManifest
    context: ScenarioContext
    query: InvestigationQuery
    answer: InvestigationAnswer
    hard_negatives: List[HardNegative] = field(default_factory=list)
    evidence_chains: List[EvidenceChain] = field(default_factory=list)
    alternative_hypotheses: List[AlternativeHypothesis] = field(default_factory=list)

    def summary(self) -> Dict[str, Any]:
        et: Dict[str, int] = {}
        for e in self.ground_truth.ground_truth_entities:
            t = e.canonical_id.split("-")[0]
            et[t] = et.get(t, 0) + 1
        edge_types: Dict[str, int] = {}
        for ed in self.ground_truth.ground_truth_relationships:
            edge_types[ed.relationship_type] = edge_types.get(ed.relationship_type, 0) + 1
        return {
            "scenario_id": self.scenario_id,
            "gt_entities": len(self.ground_truth.ground_truth_entities),
            "gt_edges": len(self.ground_truth.ground_truth_relationships),
            "entity_types": et,
            "edge_types": edge_types,
            "hard_negatives": len(self.hard_negatives),
            "alternative_hypotheses": len(self.alternative_hypotheses),
            "evidence_chains": len(self.evidence_chains),
            "source_diversity": {c.chain_id: c.source_diversity for c in self.evidence_chains},
            "minimum_hop_depth": self._min_hop(),
        }

    def _min_hop(self) -> int:
        edges = self.ground_truth.ground_truth_relationships
        if not edges:
            return 0
        # BFS from first entity to find depth
        adj: Dict[str, List[str]] = {}
        for e in edges:
            adj.setdefault(e.source_entity, []).append(e.target_entity)
        start = edges[0].source_entity
        visited, queue, depth = {start}, [start], 0
        while queue:
            nxt = []
            for n in queue:
                for nb in adj.get(n, []):
                    if nb not in visited:
                        visited.add(nb)
                        nxt.append(nb)
            if nxt:
                depth += 1
            queue = nxt
        return depth
