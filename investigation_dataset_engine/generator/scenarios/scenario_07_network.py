"""S7 — Four-Hop Criminal Network Discovery
Chain: A→PhoneX→B→AccountY→C→VehicleZ→D→CommQ→E
No direct A→E observed record exists. Evidence is fragmented across sources.
Distractor paths of similar apparent strength are included.
ML purpose: Graph Reconstruction, Multi-Hop Reasoning (2/3/4-hop), Entity Resolution.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S07"
WIN = ("2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 700)

    # True chain: pA → pB → pC → pD → pE (4 hops)
    pA, phA, accA, _    = make_person(SID, 0, syn, 0, acc_idx=0)
    pB, phB, accB, _    = make_person(SID, 1, syn, 1, acc_idx=1)
    pC, phC, accC, vehC = make_person(SID, 2, syn, 2, acc_idx=2, veh_idx=2)
    pD, phD, accD, _    = make_person(SID, 3, syn, 3, acc_idx=3)
    pE, phE, _,    _    = make_person(SID, 4, syn, 4)

    # Distractors: pX→pY look similar to one true link but are disconnected
    pX, phX, accX, _    = make_person(SID, 5, syn, 5, acc_idx=5)
    pY, phY, _,    _    = make_person(SID, 6, syn, 6)

    persons = [pA, pB, pC, pD, pE, pX, pY]
    phones  = [phA, phB, phC, phD, phE, phX, phY]
    accs    = [accA, accB, accC, accD, accX]
    vehs    = [vehC]
    locs    = [make_location(SID, i, syn) for i in range(5)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="FOUR_HOP_NETWORK",
        seed=seed+700, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, vehicles=vehs, locations=locs,
    )

    roles = [
        make_role(pA.id, GroundTruthRole.MASTERMIND, pA.full_name, ["telecom_cdr_logs.csv","telecom_caf_kyc.json"]),
        make_role(pB.id, GroundTruthRole.ASSOCIATE,  pB.full_name, ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(pC.id, GroundTruthRole.ASSOCIATE,  pC.full_name, ["cbs_bank_transactions.csv","toll_anpr_logs.csv"]),
        make_role(pD.id, GroundTruthRole.ASSOCIATE,  pD.full_name, ["toll_anpr_logs.csv","telecom_cdr_logs.csv"]),
        make_role(pE.id, GroundTruthRole.MULE,       pE.full_name, ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(pX.id, GroundTruthRole.DISTRACTOR, pX.full_name, ["telecom_cdr_logs.csv"]),
        make_role(pY.id, GroundTruthRole.DISTRACTOR, pY.full_name, ["telecom_cdr_logs.csv"]),
    ]

    # Timeline: fragmented evidence, no single record shows full A→E path
    timeline = [
        make_step(1, SID, "2026-08-05T09:00:00Z", "HOP1_A_CALLS_B",
                  f"{pA.full_name} calls {pB.full_name} (1-hop).", [pA.id, pB.id], locs[0].id, ["CDR-S07-00001"]),
        make_step(2, SID, "2026-08-06T10:00:00Z", "HOP2_B_TRANSFERS_TO_C_ACC",
                  f"{pB.full_name} transfers to {pC.full_name} account (2-hop).", [pB.id, pC.id, accB.id, accC.id], None, ["CBS-S07-00001"]),
        make_step(3, SID, "2026-08-08T11:00:00Z", "HOP3_C_VEHICLE_WITH_D",
                  f"{pC.full_name}'s vehicle seen with {pD.full_name} at toll (3-hop).", [pC.id, pD.id, vehC.id], locs[1].id, ["ANPR-S07-00001"]),
        make_step(4, SID, "2026-08-10T14:00:00Z", "HOP4_D_CALLS_E",
                  f"{pD.full_name} calls {pE.full_name} to coordinate (4-hop).", [pD.id, pE.id], locs[2].id, ["CDR-S07-00002"]),
        make_step(5, SID, "2026-08-12T09:00:00Z", "DISTRACTOR_PATH",
                  f"Distractor {pX.full_name} calls {pY.full_name} — no connection to true chain.", [pX.id, pY.id], locs[3].id, ["CDR-S07-00010"]),
        make_step(6, SID, "2026-08-15T10:00:00Z", "FINAL_MULE_ACTIVITY",
                  f"Mule {pE.full_name} receives final funds.", [pE.id, accD.id], None, ["CBS-S07-00002"]),
    ]

    # True chain edges — each hop is a different source type
    edges = [
        # A→B: phone/CDR (hop 1)
        make_edge(f"{SID}-E001", pA.id, phA.id, "OWNS_PHONE",          True,  [("telecom_caf_kyc.json","CAF-S07-0001")]),
        make_edge(f"{SID}-E002", pA.id, pB.id,  "CALLS_HOP1",          False, [("telecom_cdr_logs.csv","CDR-S07-00001")]),
        # B→C: account/bank (hop 2)
        make_edge(f"{SID}-E003", pB.id, accB.id,"OWNS_ACCOUNT",        True,  [("telecom_caf_kyc.json","CAF-S07-0002")]),
        make_edge(f"{SID}-E004", accB.id, accC.id,"TRANSFERS_HOP2",    True,  [("cbs_bank_transactions.csv","CBS-S07-00001")]),
        make_edge(f"{SID}-E005", pC.id, accC.id,"RECEIVES_ACCOUNT",    True,  [("telecom_caf_kyc.json","CAF-S07-0003")]),
        # C→D: vehicle/ANPR (hop 3)
        make_edge(f"{SID}-E006", pC.id, vehC.id,"OWNS_VEHICLE",        True,  [("toll_anpr_logs.csv","ANPR-S07-00001")]),
        make_edge(f"{SID}-E007", vehC.id, pD.id,"CO_PASSENGER_HOP3",   False, [("toll_anpr_logs.csv","ANPR-S07-00001"),("field_intelligence_notes.txt","FNOTE-S07-0001")]),
        # D→E: communication (hop 4)
        make_edge(f"{SID}-E008", pD.id, pE.id,  "CALLS_HOP4",          False, [("telecom_cdr_logs.csv","CDR-S07-00002")]),
        make_edge(f"{SID}-E009", pE.id, accD.id,"RECEIVES_FUNDS_HOP4", False, [("cbs_bank_transactions.csv","CBS-S07-00002")]),
        # No direct A→E edge (must be discovered via traversal)
        # Distractor path — looks like hop 1 but disconnected from true chain
        make_edge(f"{SID}-E010", pX.id, pY.id,  "DISTRACTOR_CALL",     False, [("telecom_cdr_logs.csv","CDR-S07-00010")], 0.05),
        make_edge(f"{SID}-E011", pX.id, accX.id,"DISTRACTOR_ACCOUNT",  True,  [("cbs_bank_transactions.csv","CBS-S07-00010")], 0.05),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Four-Hop Criminal Network Discovery",
        scenario_type="FOUR_HOP_NETWORK",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, pA.id, "PERSON", WIN,
        f"Starting from {pA.full_name}, reconstruct the complete criminal network. Evidence is fragmented across CDR, banking, and ANPR sources. Identify all 4 hops to the terminal entity.",
        "HARD", "NETWORK_DISCOVERY")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[pA.id, pB.id, pC.id, pD.id, pE.id],
        chain=[
            EntityChainNode(canonical_id=pA.id,  entity_type="PERSON",  role_or_label="HOP0_ORIGIN",  description=f"Starting point: {pA.full_name}"),
            EntityChainNode(canonical_id=pB.id,  entity_type="PERSON",  role_or_label="HOP1_CDR",     description=f"Connected via CDR call"),
            EntityChainNode(canonical_id=accC.id,entity_type="ACCOUNT", role_or_label="HOP2_BANK",    description=f"Connected via fund transfer"),
            EntityChainNode(canonical_id=pD.id,  entity_type="PERSON",  role_or_label="HOP3_VEHICLE", description=f"Connected via vehicle co-presence"),
            EntityChainNode(canonical_id=pE.id,  entity_type="PERSON",  role_or_label="HOP4_TERMINAL",description=f"Terminal entity: {pE.full_name}"),
        ],
        edges=[edges[1], edges[3], edges[6], edges[7]],
        evidence=[("telecom_cdr_logs.csv","CDR-S07-00001"),("cbs_bank_transactions.csv","CBS-S07-00001"),
                  ("toll_anpr_logs.csv","ANPR-S07-00001"),("telecom_cdr_logs.csv","CDR-S07-00002")],
        timeline=timeline[:4],
        summary=f"4-hop chain: {pA.full_name}→(CDR)→{pB.full_name}→(Bank)→{pC.full_name}→(Vehicle ANPR)→{pD.full_name}→(CDR)→{pE.full_name}. No single record shows full chain. Distractor path pX→pY uses similar source types but is disconnected.",
        confidence=0.88,
        alt_hyp=[f"Distractor path {pX.full_name}→{pY.full_name} could appear to extend the true chain if graph traversal is not source-diverse."],
        fp_cands=[pX.id, pY.id],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[
            build_hard_negative(f"HN-{SID}-001", pA.id, pX.id, ["same_call_pattern","same_network_operator"]),
            build_hard_negative(f"HN-{SID}-002", pE.id, pY.id, ["same_district","similar_transaction_volume"]),
        ],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"2-hop: {pA.full_name}→{pB.full_name}→{pC.full_name}",
                                 f"{SID}-E004", ["CDR-S07-00001","CBS-S07-00001"], ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
            build_evidence_chain(f"EC-{SID}-002", f"4-hop: full chain {pA.full_name}→{pE.full_name}",
                                 f"{SID}-E009", ["CDR-S07-00001","CBS-S07-00001","ANPR-S07-00001","CDR-S07-00002"],
                                 ["telecom_cdr_logs.csv","cbs_bank_transactions.csv","toll_anpr_logs.csv","telecom_cdr_logs.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"Distractor {pX.full_name} is a 5th network member",
            ["similar_call_patterns","same_district"],
            "Distractor has no account transfer link, no vehicle co-presence, and CDR timing does not correlate with true chain events.")],
    )
