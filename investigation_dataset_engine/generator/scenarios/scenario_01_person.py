"""S1 — Person-Centric Investigation
Starting point: a known PERSON.
Graph: Person→Phone→CDR→Location→Vehicle→ANPR→Account→Transaction→FIR→SocialAccount
Includes 1 distractor person with similar name/address.
ML purpose: Entity Resolution, Link Prediction, Graph Traversal, Evidence Retrieval.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge,
    make_step, make_query, make_answer,
    build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S01"
WIN = ("2026-08-15T00:00:00Z", "2026-08-17T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed)

    # ── Persons ─────────────────────────────────────────────────────────────
    # 0=Target suspect, 1=Associate, 2=Mule, 3=Witness, 4=Distractor(same name)
    p0, ph0, acc0, veh0 = make_person(SID, 0, syn, 0, acc_idx=0, veh_idx=0)
    p1, ph1, acc1, _    = make_person(SID, 1, syn, 1, acc_idx=1)
    p2, ph2, acc2, _    = make_person(SID, 2, syn, 2, acc_idx=2)
    p3, ph3, _,    _    = make_person(SID, 3, syn, 3)           # witness
    p4, ph4, _,    _    = make_person(SID, 4, syn, 4)           # distractor

    # Make distractor share same surname as p0 (hard negative)
    p4.full_name = p0.full_name.split()[0] + " " + p4.full_name.split()[-1]
    p4.district = p0.district

    persons = [p0, p1, p2, p3, p4]
    phones  = [ph0, ph1, ph2, ph3, ph4]
    accs    = [acc0, acc1, acc2]
    vehs    = [veh0]
    locs    = [make_location(SID, i, syn) for i in range(5)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="PERSON_CENTRIC",
        seed=seed, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones,
        vehicles=vehs, locations=locs,
    )

    # ── Ground Truth Roles ───────────────────────────────────────────────────
    roles = [
        make_role(p0.id, GroundTruthRole.MASTERMIND, p0.full_name,
                  ["cctns_fir_records.json","telecom_cdr_logs.csv","cbs_bank_transactions.csv","toll_anpr_logs.csv"]),
        make_role(p1.id, GroundTruthRole.ASSOCIATE,  p1.full_name,
                  ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(p2.id, GroundTruthRole.MULE,       p2.full_name,
                  ["cbs_bank_transactions.csv","fiu_str_alerts.json"]),
        make_role(p3.id, GroundTruthRole.BENIGN_PERSON, p3.full_name,
                  ["cctns_fir_records.json"]),
        make_role(p4.id, GroundTruthRole.DISTRACTOR,  p4.full_name,
                  ["telecom_caf_kyc.json"]),
    ]

    # ── Timeline ─────────────────────────────────────────────────────────────
    timeline = [
        make_step(1, SID, "2026-08-15T08:00:00Z", "SUSPECT_ACTIVATES_BURNER",
                  f"{p0.full_name} activates new SIM.", [p0.id, ph0.id],
                  locs[0].id, ["CAF-S01-0001"]),
        make_step(2, SID, "2026-08-15T10:30:00Z", "CALL_TO_ASSOCIATE",
                  f"Target calls associate {p1.full_name}.", [p0.id, p1.id],
                  locs[0].id, ["CDR-S01-00001"]),
        make_step(3, SID, "2026-08-15T12:00:00Z", "VEHICLE_OBSERVED",
                  f"Target's vehicle {veh0.plate} seen at toll.", [p0.id, veh0.id],
                  locs[1].id, ["ANPR-S01-00001"]),
        make_step(4, SID, "2026-08-15T14:00:00Z", "FINANCIAL_LAYERING",
                  f"Funds transferred via {p2.full_name}'s account.", [p0.id, p2.id, acc2.id],
                  None, ["CBS-S01-00001","CBS-S01-00002","FIU-S01-0001"]),
        make_step(5, SID, "2026-08-15T16:00:00Z", "FIR_REGISTERED",
                  "FIR registered at police station.", [p0.id, p3.id],
                  locs[2].id, ["FIR-S01-001"]),
        make_step(6, SID, "2026-08-16T09:00:00Z", "SOCIAL_OSINT",
                  "Target's alias posts coded message on Telegram.", [p0.id],
                  None, ["OSINT-S01-0001"]),
    ]

    # ── GT Edges ─────────────────────────────────────────────────────────────
    edges = [
        make_edge(f"{SID}-E001", p0.id, ph0.id,  "OWNS_PHONE",        True,  [("telecom_caf_kyc.json","CAF-S01-0001")]),
        make_edge(f"{SID}-E002", p0.id, p1.id,   "COMMUNICATES_WITH", False, [("telecom_cdr_logs.csv","CDR-S01-00001"),("field_intelligence_notes.txt","FNOTE-S01-0001")]),
        make_edge(f"{SID}-E003", p0.id, veh0.id, "OWNS_VEHICLE",      True,  [("toll_anpr_logs.csv","ANPR-S01-00001")]),
        make_edge(f"{SID}-E004", p0.id, acc0.id, "OWNS_ACCOUNT",      True,  [("cbs_bank_transactions.csv","CBS-S01-00001")]),
        make_edge(f"{SID}-E005", p0.id, p2.id,   "FINANCIAL_CONDUIT", False, [("cbs_bank_transactions.csv","CBS-S01-00002"),("fiu_str_alerts.json","FIU-S01-0001")]),
        make_edge(f"{SID}-E006", p1.id, acc1.id, "OWNS_ACCOUNT",      True,  [("cbs_bank_transactions.csv","CBS-S01-00003")]),
        make_edge(f"{SID}-E007", p2.id, acc2.id, "OWNS_ACCOUNT",      True,  [("cbs_bank_transactions.csv","CBS-S01-00004")]),
        make_edge(f"{SID}-E008", p0.id, locs[2].id, "PRESENT_AT",     False, [("cctns_fir_records.json","FIR-S01-001"),("cell_tower_dumps.json","TDUMP-S01-0001")]),
        make_edge(f"{SID}-E009", p0.id, locs[1].id, "OBSERVED_AT_TOLL", True, [("toll_anpr_logs.csv","ANPR-S01-00001")]),
        make_edge(f"{SID}-E010", p1.id, p2.id,   "ASSOCIATE_OF",     False, [("telecom_cdr_logs.csv","CDR-S01-00002")]),
        # Distractor: p4 shares same district but no criminal link
        make_edge(f"{SID}-E011", p4.id, locs[0].id, "RESIDES_NEAR",   True,  [("telecom_caf_kyc.json","CAF-S01-0005")], confidence=0.15),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Person-Centric Investigation",
        scenario_type="PERSON_CENTRIC",
        master_timeline=timeline,
        ground_truth_entities=roles,
        ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, p0.id, "PERSON", WIN,
        f"Starting from known individual {p0.full_name}, map all connected entities (phones, accounts, vehicles, associates) and determine criminal network structure.",
        "HARD", "NETWORK_DISCOVERY")

    answer = make_answer(
        f"QRY-{SID}-001", SID,
        targets=[p0.id, p1.id, p2.id],
        chain=[
            EntityChainNode(canonical_id=p0.id, entity_type="PERSON", role_or_label="PRIMARY_SUSPECT", description="Target person"),
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="ASSOCIATE", description="Communicates with target"),
            EntityChainNode(canonical_id=p2.id, entity_type="PERSON", role_or_label="FINANCIAL_MULE", description="Receives layered funds"),
        ],
        edges=edges[:10],
        evidence=[("telecom_cdr_logs.csv","CDR-S01-00001"),("cbs_bank_transactions.csv","CBS-S01-00002"),("toll_anpr_logs.csv","ANPR-S01-00001")],
        timeline=timeline,
        summary=f"{p0.full_name} uses burner phone, communicates with {p1.full_name}, routes funds through {p2.full_name}. {p4.full_name} is a same-surname distractor with no criminal links.",
        confidence=0.93,
        alt_hyp=["The similar-named person (distractor) may be confused with the target due to same district and partial name match."],
        fp_cands=[p4.id],
    )

    hard_negs = [
        build_hard_negative(f"HN-{SID}-001", p0.id, p4.id, ["same_first_name","same_district","similar_address"]),
    ]
    ev_chains = [
        build_evidence_chain(f"EC-{SID}-001", f"{p0.full_name} linked to {p1.full_name}",
                             f"{SID}-E002", ["CDR-S01-00001","FNOTE-S01-0001"], ["telecom_cdr_logs.csv","field_intelligence_notes.txt"]),
        build_evidence_chain(f"EC-{SID}-002", f"{p0.full_name} routed funds via {p2.full_name}",
                             f"{SID}-E005", ["CBS-S01-00002","FIU-S01-0001"], ["cbs_bank_transactions.csv","fiu_str_alerts.json"]),
    ]
    alt_hyps = [
        build_alt_hyp(f"AH-{SID}-001",
                      f"Distractor {p4.full_name} mistaken for target due to name similarity",
                      ["same_first_name","same_district"],
                      "Distractor has no CDR calls to associates, no suspicious transactions, no ANPR sightings at crime locations."),
    ]

    return ScenarioResult(SID, gt, ctx, query, answer, hard_negs, ev_chains, alt_hyps)
