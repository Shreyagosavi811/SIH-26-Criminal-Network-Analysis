"""
SIH26189 v1.1 — Evidence Reachability Validator
For every benchmark claim (EvidenceMapping in answer.supporting_evidence and
answer.relationship_graph.evidence_path), verify the referenced record_id exists
in the ScenarioContext's RecordRegistry (populated during serialization).

IMPORTANT: This validator runs AFTER serialization, not before.
Before serialization, use it against the ground-truth evidence chains (EvidenceChain list)
to flag records that are referenced in answers but never generated in observed output.
"""
from typing import List, Tuple, Dict, Any, Optional
from generator.context import RecordRegistry
from generator.models import InvestigationAnswer, GroundTruthEdge, EvidenceMapping
from generator.scenarios.base import EvidenceChain


class EvidenceValidator:

    def validate_answer_reachability(
        self,
        answer: InvestigationAnswer,
        registry: RecordRegistry,
    ) -> Tuple[bool, List[str]]:
        """
        Every record_id referenced in answer.supporting_evidence and
        answer.relationship_graph must exist in the registry.
        """
        errors = []

        # Check direct supporting evidence
        for em in answer.supporting_evidence:
            if not registry.exists(em.source, em.record_id):
                errors.append(
                    f"Answer {answer.query_id}: record '{em.record_id}' "
                    f"in source '{em.source}' not found in registry"
                )

        # Check edge evidence paths
        for edge in answer.relationship_graph:
            for em in edge.evidence_path:
                if not registry.exists(em.source, em.record_id):
                    errors.append(
                        f"Edge {edge.edge_id}: record '{em.record_id}' "
                        f"in source '{em.source}' not found in registry"
                    )

        return (len(errors) == 0, errors)

    def validate_evidence_chains_reachability(
        self,
        chains: List[EvidenceChain],
        registry: RecordRegistry,
    ) -> Tuple[bool, List[str]]:
        """
        Every record_id in each EvidenceChain.supporting_record_ids must exist
        in the registry under the corresponding source type.
        """
        errors = []
        all_registered = set()
        for source_records in registry.all_records().values():
            all_registered.update(source_records)

        for chain in chains:
            for rid in chain.supporting_record_ids:
                if rid not in all_registered:
                    errors.append(
                        f"EvidenceChain '{chain.chain_id}': record '{rid}' "
                        f"not found in any registered source"
                    )
        return (len(errors) == 0, errors)

    def validate_no_direct_ae_path(
        self,
        edges: List[GroundTruthEdge],
        entity_a: str,
        entity_e: str,
    ) -> Tuple[bool, List[str]]:
        """
        For multi-hop scenarios: verify there is NO direct edge from entity_a to entity_e.
        Such a direct edge would short-circuit the intended multi-hop discovery.
        """
        errors = []
        for edge in edges:
            if edge.source_entity == entity_a and edge.target_entity == entity_e:
                errors.append(
                    f"Direct edge {entity_a}→{entity_e} found ({edge.edge_id}). "
                    f"This defeats multi-hop discovery requirement."
                )
            # Also check reverse if bidirectional
            if edge.source_entity == entity_e and edge.target_entity == entity_a:
                errors.append(
                    f"Direct reverse edge {entity_e}→{entity_a} found ({edge.edge_id})."
                )
        return (len(errors) == 0, errors)

    def validate_pre_serialization_chains(
        self,
        chains: List[EvidenceChain],
        answer: InvestigationAnswer,
    ) -> Tuple[bool, List[str]]:
        """
        Pre-serialization: verify that every supporting_record_id in EvidenceChains
        is also referenced somewhere in the answer's supporting_evidence or edge paths.
        Warns if evidence chain references records not in the answer (inconsistency).
        """
        errors = []
        answer_records = {em.record_id for em in answer.supporting_evidence}
        for edge in answer.relationship_graph:
            for em in edge.evidence_path:
                answer_records.add(em.record_id)

        for chain in chains:
            for rid in chain.supporting_record_ids:
                if rid not in answer_records:
                    errors.append(
                        f"EvidenceChain '{chain.chain_id}': record '{rid}' "
                        f"referenced in chain but not in answer — possible inconsistency"
                    )
        return (len(errors) == 0, errors)
