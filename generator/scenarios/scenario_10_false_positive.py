"""S10 — False Positive Discrimination (improved from v1.0)
Genuine criminal network + benign taxi driver who is co-located but innocent.
Both share tower, toll, and movement — but differ on CDR/financial/criminal evidence.
ML purpose: False Positive Detection, Evidence Weighting, Confidence Calibration.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext, VehicleCtx
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S10"
WIN = ("2026-08-10T00:00:00Z", "2026-08-10T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 1000)

    # True criminal network
    p0, ph0, acc0, veh0 = make_person(SID, 0, syn, 0, acc_idx=0, veh_idx=0)   # mastermind
    p1, ph1, _,    _    = make_person(SID, 1, syn, 1)                           # spotter
    p2, ph2, acc2, _    = make_person(SID, 2, syn, 2, acc_idx=2)                # mule

    # Benign taxi driver — co-located but innocent
    p3, ph3, acc3, veh3 = make_person(SID, 3, syn, 3, acc_idx=3, veh_idx=3)
    p3.occupation = "Commercial Taxi Driver"
    # Taxi driver shares district with mastermind (hard negative)
    p3.district = p0.district

    # Benign banker — only financial co-occurrence
    p4, ph4, acc4, _ = make_person(SID, 4, syn, 4, acc_idx=4)
    p4.occupation = "Bank Officer"

    persons = [p0, p1, p2, p3, p4]
    phones  = [ph0, ph1, ph2, ph3, ph4]
    accs    = [acc0, acc2, acc3, acc4]
    vehs    = [veh0, veh3]
    locs    = [make_location(SID, i, syn) for i in range(6)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="FALSE_POSITIVE_DISCRIMINATION",
        seed=seed+1000, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, vehicles=vehs, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.MASTERMIND,    p0.full_name, ["telecom_caf_kyc.json","telecom_cdr_logs.csv","cbs_bank_transactions.csv","toll_anpr_logs.csv"]),
        make_role(p1.id, GroundTruthRole.SPOTTER,       p1.full_name, ["cctns_fir_records.json","telecom_cdr_logs.csv","field_intelligence_notes.txt"]),
        make_role(p2.id, GroundTruthRole.MULE,          p2.full_name, ["telecom_caf_kyc.json","cbs_bank_transactions.csv","fiu_str_alerts.json"]),
        make_role(p3.id, GroundTruthRole.DISTRACTOR,    p3.full_name, ["telecom_caf_kyc.json","toll_anpr_logs.csv","cell_tower_dumps.json"]),
        make_role(p4.id, GroundTruthRole.BENIGN_PERSON, p4.full_name, ["cbs_bank_transactions.csv"]),
    ]

    timeline = [
        make_step(1,  SID, "2026-08-10T09:00:00Z", "BURNER_ACTIVATION",
                  f"{p0.full_name} activates burner SIM.", [p0.id, ph0.id], locs[0].id, ["CAF-S10-0001"]),
        make_step(2,  SID, "2026-08-10T09:30:00Z", "TAXI_HIRED_COLOCATION_1",
                  f"Mastermind hires taxi driver {p3.full_name} at {locs[0].name}.", [p0.id, p3.id, veh3.id],
                  locs[0].id, ["TDUMP-S10-0001","ANPR-S10-00001"]),
        make_step(3,  SID, "2026-08-10T10:30:00Z", "SUSPECT_CALLS_SPOTTER",
                  f"{p0.full_name} calls spotter {p1.full_name} mid-journey.", [p0.id, p1.id],
                  locs[0].id, ["CDR-S10-00001"]),
        make_step(4,  SID, "2026-08-10T11:00:00Z", "TAXI_COLOCATION_2",
                  f"Taxi drops mastermind at {locs[1].name} (toll). Both phones in same tower.", [p0.id, p3.id],
                  locs[1].id, ["ANPR-S10-00002","TDUMP-S10-0002"]),
        make_step(5,  SID, "2026-08-10T11:45:00Z", "TAXI_CONTINUES_ROUTE",
                  f"Taxi driver {p3.full_name} continues to next customer — alibi.", [p3.id, veh3.id],
                  locs[2].id, ["ANPR-S10-00003"]),
        make_step(6,  SID, "2026-08-10T14:00:00Z", "CYBER_EXTORTION",
                  f"Extortion committed. Spotter {p1.full_name} spotted near scene.", [p0.id, p1.id],
                  locs[3].id, ["FIR-S10-001","TDUMP-S10-0003","FNOTE-S10-0001"]),
        make_step(7,  SID, "2026-08-10T14:30:00Z", "FUND_TRANSFER",
                  f"Extorted funds transferred to mule {p2.full_name}.", [p0.id, p2.id, acc0.id, acc2.id],
                  None, ["CBS-S10-00001","CBS-S10-00002","FIU-S10-0001"]),
        make_step(8,  SID, "2026-08-10T15:00:00Z", "TAXI_NORMAL_FARE",
                  f"Taxi driver completes 3 more commercial fares (digital wallet receipts).", [p3.id],
                  locs[4].id, ["CBS-S10-00010","CBS-S10-00011","CBS-S10-00012"]),
        make_step(9,  SID, "2026-08-10T16:00:00Z", "FIELD_INTELLIGENCE",
                  f"Field unit: taxi driver has 12 commercial fares today, all digital.", [p3.id],
                  None, ["FNOTE-S10-0002"]),
        make_step(10, SID, "2026-08-10T17:00:00Z", "BENIGN_BANK_TRANSFER",
                  f"Benign banker {p4.full_name} — coincidental high-value transfer (salary).", [p4.id, acc4.id],
                  None, ["CBS-S10-00020"]),
    ]

    edges = [
        # True criminal syndicate
        make_edge(f"{SID}-E001", p0.id, ph0.id, "OWNS_BURNER_PHONE",    True,  [("telecom_caf_kyc.json","CAF-S10-0001")]),
        make_edge(f"{SID}-E002", p0.id, p1.id,  "COMMUNICATES_SPOTTER", False, [("telecom_cdr_logs.csv","CDR-S10-00001"),("field_intelligence_notes.txt","FNOTE-S10-0001")]),
        make_edge(f"{SID}-E003", p0.id, p2.id,  "FINANCIAL_CONDUIT",    False, [("cbs_bank_transactions.csv","CBS-S10-00001"),("fiu_str_alerts.json","FIU-S10-0001")]),
        make_edge(f"{SID}-E004", p1.id, locs[3].id,"PRESENT_AT_CRIME",  False, [("cctns_fir_records.json","FIR-S10-001"),("cell_tower_dumps.json","TDUMP-S10-0003")]),
        make_edge(f"{SID}-E005", p0.id, acc0.id,"OWNS_ACCOUNT",          True,  [("cbs_bank_transactions.csv","CBS-S10-00002")]),
        make_edge(f"{SID}-E006", p2.id, acc2.id,"MULE_ACCOUNT",          True,  [("cbs_bank_transactions.csv","CBS-S10-00001"),("fiu_str_alerts.json","FIU-S10-0001")]),
        # Benign co-location (taxi driver)
        make_edge(f"{SID}-E007", p3.id, p0.id,  "COMMERCIAL_TAXI_HIRE", True,  [("toll_anpr_logs.csv","ANPR-S10-00001"),("cell_tower_dumps.json","TDUMP-S10-0001")], 0.12),
        make_edge(f"{SID}-E008", p3.id, locs[2].id,"CONTINUES_COMMERCIAL_ROUTE", True, [("toll_anpr_logs.csv","ANPR-S10-00003")], 0.02),
        # Benign banker (financial coincidence)
        make_edge(f"{SID}-E009", p4.id, acc4.id,"BENIGN_HIGH_VALUE_TXN",True,  [("cbs_bank_transactions.csv","CBS-S10-00020")], 0.02),
        # Additional criminal evidence
        make_edge(f"{SID}-E010", p0.id, locs[3].id,"PRESENT_AT_CRIME",  False, [("cell_tower_dumps.json","TDUMP-S10-0003"),("field_intelligence_notes.txt","FNOTE-S10-0001")]),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="False-Positive Discrimination (Taxi Driver vs Criminal)",
        scenario_type="FALSE_POSITIVE_DISCRIMINATION",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, p0.id, "PERSON", WIN,
        f"Analyze all entities co-located with {p0.full_name}. Specifically determine whether taxi driver {p3.full_name} is a conscious co-conspirator or a false-positive commercial operator. Also evaluate if banker {p4.full_name} is involved in fund layering.",
        "HARD", "FALSE_POSITIVE_DISCRIMINATION")

    answer = make_answer(f"QRY-{SID}-001", SID,
        targets=[p0.id, p1.id, p2.id],
        chain=[
            EntityChainNode(canonical_id=p0.id, entity_type="PERSON", role_or_label="PRIMARY_SUSPECT", description="Burner SIM + CDR + fund transfer"),
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="SPOTTER", description="Named in FIR + CDR + field notes"),
            EntityChainNode(canonical_id=p2.id, entity_type="PERSON", role_or_label="MULE", description="Receives layered funds + FIU STR alert"),
        ],
        edges=edges[:6] + [edges[9]],
        evidence=[("telecom_cdr_logs.csv","CDR-S10-00001"),("cbs_bank_transactions.csv","CBS-S10-00001"),("fiu_str_alerts.json","FIU-S10-0001"),("cctns_fir_records.json","FIR-S10-001")],
        timeline=timeline,
        summary=f"Criminal: {p0.full_name}+{p1.full_name}+{p2.full_name} — CDR links, financial layering with FIU STR alert, spotter at crime scene. "
                f"FALSE POSITIVE: {p3.full_name} — co-located via commercial taxi hire but ZERO CDR calls to syndicate, ZERO suspicious transactions, ZERO criminal history, alibi via 12 digital fare receipts. "
                f"BENIGN: {p4.full_name} — high-value transfer is provable salary credit, no time correlation with crime.",
        confidence=0.96,
        fp_cands=[p3.id, p4.id],
        alt_hyp=[
            f"Taxi driver {p3.full_name} may have been used as an unwitting transport accomplice (hired vehicle).",
            f"Banker {p4.full_name}'s high-value transfer could superficially resemble fund layering if not checked against salary records.",
        ],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[
            build_hard_negative(f"HN-{SID}-001", p0.id, p3.id, ["same_district","co_located_3_times","same_tower","similar_movement_pattern"]),
            build_hard_negative(f"HN-{SID}-002", p2.id, p4.id, ["similar_transaction_volume","same_bank_type"]),
        ],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"{p0.full_name} criminally linked to {p1.full_name}",
                                 f"{SID}-E002", ["CDR-S10-00001","FIR-S10-001","FNOTE-S10-0001"],
                                 ["telecom_cdr_logs.csv","cctns_fir_records.json","field_intelligence_notes.txt"]),
            build_evidence_chain(f"EC-{SID}-002", f"Taxi driver {p3.full_name} is benign",
                                 f"{SID}-E007", ["ANPR-S10-00001","ANPR-S10-00003","CBS-S10-00010","FNOTE-S10-0002"],
                                 ["toll_anpr_logs.csv","toll_anpr_logs.csv","cbs_bank_transactions.csv","field_intelligence_notes.txt"]),
        ],
        alternative_hypotheses=[
            build_alt_hyp(f"AH-{SID}-001", f"Taxi driver {p3.full_name} is an intentional accomplice",
                          ["co_located_3_times","same_tower","same_movement_route"],
                          "Zero CDR calls to any syndicate member. Zero suspicious financial activity. 12 verifiable commercial fares (digital wallet). No criminal history. Alibi confirmed by field note FNOTE-S10-0002."),
            build_alt_hyp(f"AH-{SID}-002", f"Banker {p4.full_name} launders funds",
                          ["high_value_transfer","same_day"],
                          "Transfer timestamp precedes crime by 5 hours. Transaction is salary credit — regular monthly pattern, not an anomaly."),
        ],
    )
