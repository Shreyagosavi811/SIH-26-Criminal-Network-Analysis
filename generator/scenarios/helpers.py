"""
SIH26189 Scenario Helpers
Shared entity-construction utilities used by all scenario builders.
"""
import random
from typing import List, Tuple, Optional
from generator.attributes import DemographicSynthesizer
from generator.context import (
    ScenarioContext, PersonCtx, AccountCtx, PhoneCtx,
    VehicleCtx, LocationCtx, RecordRegistry
)
from generator.models import (
    GroundTruthEntityRoleMap, GroundTruthRole, GroundTruthEdge,
    TimelineStep, EvidenceMapping, EntityChainNode,
    InvestigationQuery, InvestigationAnswer
)
from generator.scenarios.base import EvidenceChain, HardNegative, AlternativeHypothesis


# ── Entity factory helpers ──────────────────────────────────────────────────

def make_person(sid: str, idx: int, syn: DemographicSynthesizer,
                phone_idx: int, acc_idx: Optional[int] = None,
                veh_idx: Optional[int] = None, state_code: str = "DL") -> Tuple[PersonCtx, PhoneCtx, Optional[AccountCtx], Optional[VehicleCtx]]:
    pid = f"PER-{sid}-{idx:03d}"
    phid = f"PHN-{sid}-{idx:03d}"
    acc = None
    veh = None
    msisdn = syn.generate_phone_msisdn(phone_idx)
    loc_info = syn.get_location(idx)

    person = PersonCtx(
        id=pid,
        full_name=syn.generate_name(idx),
        alias=None,
        phone_id=phid,
        msisdn=msisdn,
        account_id=f"ACC-{sid}-{idx:03d}" if acc_idx is not None else None,
        account_number=None,
        vehicle_id=f"VEH-{sid}-{idx:03d}" if veh_idx is not None else None,
        plate=None,
        address=f"{loc_info[0]}, {loc_info[1]}",
        district=loc_info[1],
        occupation=syn.generate_occupation(idx),
        operator=syn.generate_operator(idx),
        activation_date="2026-07-01T00:00:00Z",
    )
    phone = PhoneCtx(
        id=phid, owner_id=pid,
        msisdn=msisdn,
        imei=syn.generate_imei(phone_idx),
        operator=syn.generate_operator(idx),
        activation_date="2026-07-01T00:00:00Z",
    )
    if acc_idx is not None:
        acc_no, bank, ifsc = syn.generate_bank_account(acc_idx)
        person.account_number = acc_no
        acc = AccountCtx(
            id=f"ACC-{sid}-{idx:03d}", owner_id=pid,
            account_number=acc_no, bank_name=bank, ifsc=ifsc,
            opening_date="2024-01-01T00:00:00Z",
            opening_balance=100000.0, current_balance=100000.0,
        )
    if veh_idx is not None:
        plate = syn.generate_vehicle_plate(veh_idx, state_code)
        person.plate = plate
        veh = VehicleCtx(
            id=f"VEH-{sid}-{idx:03d}", owner_id=pid,
            plate=plate,
            make_model=syn.generate_vehicle_model(veh_idx),
            color=["White", "Black", "Silver", "Blue", "Red"][veh_idx % 5],
        )
    return person, phone, acc, veh


def make_location(sid: str, idx: int, syn: DemographicSynthesizer) -> LocationCtx:
    loc = syn.get_location(idx)
    return LocationCtx(
        id=f"LOC-{sid}-{idx:03d}",
        name=loc[0], district=loc[1], state=loc[2],
        lat=loc[3], lon=loc[4],
        location_type=loc[5],
        tower_id=loc[6],
        plaza_id=loc[7],
    )


def make_role(canonical_id: str, role: GroundTruthRole, name: str, sources: List[str]) -> GroundTruthEntityRoleMap:
    return GroundTruthEntityRoleMap(canonical_id=canonical_id, role_in_scenario=role, real_name=name, associated_sources=sources)


def make_edge(eid: str, src: str, tgt: str, rel: str, direct: bool,
              evidence: List[Tuple[str, str]], confidence: float = 0.90,
              t_start: str = None, t_end: str = None) -> GroundTruthEdge:
    return GroundTruthEdge(
        edge_id=eid,
        source_entity=src, target_entity=tgt,
        relationship_type=rel,
        is_direct_or_inferred="DIRECT" if direct else "INFERRED",
        evidence_path=[EvidenceMapping(source=s, record_id=r) for s, r in evidence],
        ground_truth_confidence=confidence,
        temporal_start=t_start, temporal_end=t_end,
    )


def make_step(step: int, sid: str, ts: str, etype: str, desc: str,
              entities: List[str], loc: str = None, records: List[str] = None) -> TimelineStep:
    return TimelineStep(
        step=step, event_id=f"EVT-{sid}-{step:03d}",
        timestamp=ts, event_type=etype, description=desc,
        entity_ids=entities, location_id=loc,
        supporting_evidence_records=records or [],
    )


def make_query(qid: str, sid: str, start_entity: str, etype: str,
               window: Tuple[str, str], text: str, difficulty: str,
               reasoning: str) -> InvestigationQuery:
    return InvestigationQuery(
        query_id=qid, scenario_id=sid,
        starting_entity=start_entity, starting_entity_type=etype,
        time_window={"start": window[0], "end": window[1]},
        query_text=text, difficulty_level=difficulty,
        expected_reasoning_type=reasoning,
    )


def make_answer(qid: str, sid: str, targets: List[str],
                chain: List[EntityChainNode], edges: List[GroundTruthEdge],
                evidence: List[Tuple[str, str]], timeline: List[TimelineStep],
                summary: str, confidence: float,
                alt_hyp: List[str] = None,
                fp_cands: List[str] = None) -> InvestigationAnswer:
    return InvestigationAnswer(
        query_id=qid, scenario_id=sid,
        target_entities=targets,
        entity_chain=chain,
        relationship_graph=edges,
        supporting_evidence=[EvidenceMapping(source=s, record_id=r) for s, r in evidence],
        timeline=timeline,
        reasoning_summary=summary,
        confidence=confidence,
        alternative_hypotheses=alt_hyp or [],
        false_positive_candidates=fp_cands or [],
        ground_truth_match=True,
    )


def build_evidence_chain(cid: str, claim: str, gt_edge_id: str,
                         record_ids: List[str], sources: List[str]) -> EvidenceChain:
    return EvidenceChain(
        chain_id=cid, claim=claim, gt_edge_id=gt_edge_id,
        supporting_record_ids=record_ids, source_types=sources,
    )


def build_hard_negative(nid: str, a: str, b: str, features: List[str]) -> HardNegative:
    return HardNegative(negative_id=nid, record_a_id=a, record_b_id=b,
                        shared_features=features, true_label=False)


def build_alt_hyp(hid: str, desc: str, features: List[str], why_weaker: str) -> AlternativeHypothesis:
    return AlternativeHypothesis(hypothesis_id=hid, description=desc,
                                 supporting_features=features, why_weaker=why_weaker)
