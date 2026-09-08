"""
SIH26189 Topology Synthesizer & Scenario Builders
Generates abstract ground-truth topology graphs for investigation scenarios.
Implements Scenario 10 (False-Positive Discrimination) and generic scenario builders.
"""

from typing import Dict, Any, List, Tuple
from generator.models import (
    GroundTruthManifest, GroundTruthEntityRoleMap, GroundTruthRole,
    GroundTruthEdge, TimelineStep, EvidenceMapping, InvestigationQuery, InvestigationAnswer, EntityChainNode
)


def build_scenario_10_topology(scenario_id: str = "SCN-2026-SCN10-001") -> Tuple[GroundTruthManifest, InvestigationQuery, InvestigationAnswer, Dict[str, Any]]:
    """
    Builds Scenario 10: False-Positive Discrimination
    Primary Suspect uses an innocent commercial taxi 3 times across Delhi/NCR.
    Taxi Driver (PER-004) is co-located 3 times (Cell Tower Dumps + Toll ANPR) with Primary Suspect (PER-001),
    creating a strong superficial co-location signal.
    However, Taxi Driver has NO CDR communication, NO financial ties, and NO FIR records with the syndicate.
    """
    
    # 1. Ground Truth Role Assignments
    entities_role_map = [
        GroundTruthEntityRoleMap(
            canonical_id=f"{scenario_id}-PER-0001",
            role_in_scenario=GroundTruthRole.MASTERMIND,
            real_name="Vikram Choudhury",
            associated_sources=["telecom_caf_kyc", "telecom_cdr_logs", "cbs_bank_transactions", "toll_anpr_logs"]
        ),
        GroundTruthEntityRoleMap(
            canonical_id=f"{scenario_id}-PER-0002",
            role_in_scenario=GroundTruthRole.SPOTTER,
            real_name="Rajesh 'Chhota' Sharma",
            associated_sources=["cctns_fir_records", "criminal_history_db", "telecom_cdr_logs", "field_intelligence_notes"]
        ),
        GroundTruthEntityRoleMap(
            canonical_id=f"{scenario_id}-PER-0003",
            role_in_scenario=GroundTruthRole.MULE,
            real_name="Amit Patel",
            associated_sources=["telecom_caf_kyc", "cbs_bank_transactions", "fiu_str_alerts"]
        ),
        GroundTruthEntityRoleMap(
            canonical_id=f"{scenario_id}-PER-0004",
            role_in_scenario=GroundTruthRole.DISTRACTOR,  # False-positive candidate!
            real_name="Ramesh Kumar",
            associated_sources=["telecom_caf_kyc", "toll_anpr_logs", "cell_tower_dumps"]
        ),
        GroundTruthEntityRoleMap(
            canonical_id=f"{scenario_id}-PER-0005",
            role_in_scenario=GroundTruthRole.BENIGN_PERSON,
            real_name="Suresh Verma",
            associated_sources=["cbs_bank_transactions"]
        ),
    ]

    # 2. Master Timeline Construction
    timeline = [
        TimelineStep(
            step=1,
            event_id=f"{scenario_id}-EVT-001",
            timestamp="2026-08-10T09:00:00Z",
            event_type="SIM_ACTIVATION",
            description="Burner SIM activated for Primary Suspect Vikram Choudhury.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PHN-0001"],
            supporting_evidence_records=["CAF-KYC-PHN-0001"]
        ),
        TimelineStep(
            step=2,
            event_id=f"{scenario_id}-EVT-002",
            timestamp="2026-08-10T10:00:00Z",
            event_type="TAXI_HIRING_CO_LOCATION_1",
            description="Suspect hires commercial Taxi (Ramesh Kumar) at Connaught Place.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0004", f"{scenario_id}-VEH-0001"],
            location_id=f"{scenario_id}-LOC-0001",
            supporting_evidence_records=["TOWER-DUMP-LOC-0001", "ANPR-TOLL-0001"]
        ),
        TimelineStep(
            step=3,
            event_id=f"{scenario_id}-EVT-003",
            timestamp="2026-08-10T11:30:00Z",
            event_type="BURNER_CALL",
            description="Primary Suspect calls Spotter Rajesh Sharma to confirm target location.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0002", f"{scenario_id}-PHN-0001", f"{scenario_id}-PHN-0002"],
            supporting_evidence_records=["CDR-PHN-0001-0002-1"]
        ),
        TimelineStep(
            step=4,
            event_id=f"{scenario_id}-EVT-004",
            timestamp="2026-08-10T12:30:00Z",
            event_type="TOLL_PASSAGE_CO_LOCATION_2",
            description="Taxi carrying Suspect passes Kherki Daula Toll Plaza.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0004", f"{scenario_id}-VEH-0001"],
            location_id=f"{scenario_id}-LOC-0002",
            supporting_evidence_records=["ANPR-TOLL-0002", "TOWER-DUMP-LOC-0002"]
        ),
        TimelineStep(
            step=5,
            event_id=f"{scenario_id}-EVT-005",
            timestamp="2026-08-10T14:00:00Z",
            event_type="CYBER_EXTORTION_INCIDENT",
            description="Cyber fraud and extortion committed at Vasant Kunj spot. Spotter spotted near scene.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0002", f"{scenario_id}-FIR-0001"],
            location_id=f"{scenario_id}-LOC-0003",
            supporting_evidence_records=["FIR-2026-104-VK", "TOWER-DUMP-LOC-0003", "FIELD-NOTE-001"]
        ),
        TimelineStep(
            step=6,
            event_id=f"{scenario_id}-EVT-006",
            timestamp="2026-08-10T14:30:00Z",
            event_type="MULE_FUND_LAYERING",
            description="Extorted funds transferred from Victim Acc to Mule Acc 1 (Amit Patel) and layered to Mastermind.",
            entity_ids=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0003", f"{scenario_id}-ACC-0002", f"{scenario_id}-ACC-0003"],
            supporting_evidence_records=["CBS-TXN-9901", "CBS-TXN-9902", "FIU-STR-2026-0042"]
        )
    ]

    # 3. Ground Truth Relationships
    relationships = [
        # True criminal syndicate edges
        GroundTruthEdge(
            edge_id=f"{scenario_id}-EDGE-001",
            source_entity=f"{scenario_id}-PER-0001",
            target_entity=f"{scenario_id}-PHN-0001",
            relationship_type="OWNS_PHONE",
            is_direct_or_inferred="DIRECT",
            evidence_path=[EvidenceMapping(source="telecom_caf_kyc", record_id="CAF-KYC-PHN-0001")],
            ground_truth_confidence=1.0
        ),
        GroundTruthEdge(
            edge_id=f"{scenario_id}-EDGE-002",
            source_entity=f"{scenario_id}-PER-0001",
            target_entity=f"{scenario_id}-PER-0002",
            relationship_type="COMMUNICATES_WITH",
            is_direct_or_inferred="INFERRED",
            evidence_path=[
                EvidenceMapping(source="telecom_cdr_logs", record_id="CDR-PHN-0001-0002-1"),
                EvidenceMapping(source="field_intelligence_notes", record_id="FIELD-NOTE-001")
            ],
            ground_truth_confidence=0.95
        ),
        GroundTruthEdge(
            edge_id=f"{scenario_id}-EDGE-003",
            source_entity=f"{scenario_id}-PER-0002",
            target_entity=f"{scenario_id}-PER-0003",
            relationship_type="FINANCIAL_CONDUIT",
            is_direct_or_inferred="INFERRED",
            evidence_path=[
                EvidenceMapping(source="cbs_bank_transactions", record_id="CBS-TXN-9901"),
                EvidenceMapping(source="fiu_str_alerts", record_id="FIU-STR-2026-0042")
            ],
            ground_truth_confidence=0.92
        ),
        # Distractor / False positive edge
        GroundTruthEdge(
            edge_id=f"{scenario_id}-EDGE-004",
            source_entity=f"{scenario_id}-PER-0001",
            target_entity=f"{scenario_id}-PER-0004",
            relationship_type="CO_LOCATED_COMMERCIAL_TAXI",
            is_direct_or_inferred="DIRECT",
            evidence_path=[
                EvidenceMapping(source="cell_tower_dumps", record_id="TOWER-DUMP-LOC-0001"),
                EvidenceMapping(source="toll_anpr_logs", record_id="ANPR-TOLL-0002")
            ],
            ground_truth_confidence=0.20  # Low true investigative confidence (Benign co-location)
        )
    ]

    manifest = GroundTruthManifest(
        scenario_id=scenario_id,
        scenario_name="False-Positive Commercial Taxi Discrimination",
        scenario_type="FALSE_POSITIVE_DISCRIMINATION",
        master_timeline=timeline,
        ground_truth_entities=entities_role_map,
        ground_truth_relationships=relationships
    )

    # 4. Investigation Query Construction
    query = InvestigationQuery(
        query_id=f"QRY-{scenario_id}-001",
        scenario_id=scenario_id,
        starting_entity=f"{scenario_id}-PER-0001",
        starting_entity_type="PERSON",
        time_window={"start": "2026-08-10T00:00:00Z", "end": "2026-08-10T23:59:59Z"},
        geographic_constraints={"district": "Delhi/NCR"},
        query_text="Analyze all entity co-locations and transactions around Primary Suspect PER-0001. Specifically evaluate whether Taxi Driver PER-0004 (Vehicle VEH-0001) is a conscious co-conspirator or a false-positive commercial driver.",
        difficulty_level="MEDIUM",
        expected_reasoning_type="FALSE_POSITIVE_DISCRIMINATION"
    )

    # 5. Expected Benchmark Answer
    answer = InvestigationAnswer(
        query_id=query.query_id,
        scenario_id=scenario_id,
        target_entities=[f"{scenario_id}-PER-0001", f"{scenario_id}-PER-0002", f"{scenario_id}-PER-0003"],
        entity_chain=[
            EntityChainNode(canonical_id=f"{scenario_id}-PER-0001", entity_type="PERSON", role_or_label="MASTERMIND", description="Primary Suspect/Mastermind"),
            EntityChainNode(canonical_id=f"{scenario_id}-PER-0002", entity_type="PERSON", role_or_label="SPOTTER", description="Spotter named in FIR narrative & CDR logs"),
            EntityChainNode(canonical_id=f"{scenario_id}-PER-0003", entity_type="PERSON", role_or_label="MULE", description="Financial Mule receiving layered funds")
        ],
        relationship_graph=relationships,
        supporting_evidence=[
            EvidenceMapping(source="telecom_cdr_logs", record_id="CDR-PHN-0001-0002-1"),
            EvidenceMapping(source="cbs_bank_transactions", record_id="CBS-TXN-9901"),
            EvidenceMapping(source="cctns_fir_records", record_id="FIR-2026-104-VK")
        ],
        timeline=timeline,
        reasoning_summary="Primary Suspect PER-0001 communicated directly via CDR with Spotter PER-0002 and transferred extorted funds to Mule PER-0003. Taxi Driver PER-0004 was co-located 3 times purely due to commercial taxi hiring, supported by ANPR toll logs and tower dumps, but shows ZERO CDR communications, ZERO bank transfers, and ZERO criminal history.",
        confidence=0.96,
        alternative_hypotheses=["PER-0004 was an unwitting getaway driver hired via cash."],
        false_positive_candidates=[f"{scenario_id}-PER-0004"],
        ground_truth_match=True
    )

    context_data = {
        "scenario_id": scenario_id,
        "primary_suspect_id": f"{scenario_id}-PER-0001",
        "accomplice_id": f"{scenario_id}-PER-0002",
        "mule_id": f"{scenario_id}-PER-0003",
        "taxi_driver_id": f"{scenario_id}-PER-0004",
        "benign_banker_id": f"{scenario_id}-PER-0005"
    }

    return manifest, query, answer, context_data
