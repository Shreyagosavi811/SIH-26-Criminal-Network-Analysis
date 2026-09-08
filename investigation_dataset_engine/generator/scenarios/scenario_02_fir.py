"""S2 — FIR-Centric Investigation
Starting point: FIR_CASE.
Graph: FIR→Persons(victim+suspects+witnesses)→Phones→Locations→Vehicles→Evidence→Organization
One suspect is a plausible false positive (alibi + legitimate activity).
ML purpose: FIR Entity Extraction, Relationship Discovery, Evidence Association.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S02"
WIN = ("2026-08-20T00:00:00Z", "2026-08-22T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 200)
    # 0=victim, 1=suspect_A, 2=suspect_B(fp), 3=witness_1, 4=witness_2, 5=co-accused
    p0, ph0, acc0, _    = make_person(SID, 0, syn, 0, acc_idx=0)
    p1, ph1, acc1, veh1 = make_person(SID, 1, syn, 1, acc_idx=1, veh_idx=0)
    p2, ph2, _,    veh2 = make_person(SID, 2, syn, 2, veh_idx=1)  # false positive
    p3, ph3, _,    _    = make_person(SID, 3, syn, 3)
    p4, ph4, _,    _    = make_person(SID, 4, syn, 4)
    p5, ph5, acc5, _    = make_person(SID, 5, syn, 5, acc_idx=5)

    # Give FP (p2) same vehicle type as suspect p1 (hard negative)
    veh2.make_model = veh1.make_model
    veh2.color = veh1.color

    persons = [p0, p1, p2, p3, p4, p5]
    phones  = [ph0, ph1, ph2, ph3, ph4, ph5]
    accs    = [acc0, acc1, acc5]
    vehs    = [veh1, veh2]
    locs    = [make_location(SID, i, syn) for i in range(5)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="FIR_CENTRIC",
        seed=seed+200, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones,
        vehicles=vehs, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.BENIGN_PERSON, p0.full_name, ["cctns_fir_records.json"]),
        make_role(p1.id, GroundTruthRole.MASTERMIND,    p1.full_name, ["cctns_fir_records.json","telecom_cdr_logs.csv","toll_anpr_logs.csv"]),
        make_role(p2.id, GroundTruthRole.DISTRACTOR,    p2.full_name, ["cctns_fir_records.json","toll_anpr_logs.csv"]),
        make_role(p3.id, GroundTruthRole.BENIGN_PERSON, p3.full_name, ["cctns_fir_records.json"]),
        make_role(p4.id, GroundTruthRole.BENIGN_PERSON, p4.full_name, ["cctns_fir_records.json"]),
        make_role(p5.id, GroundTruthRole.ASSOCIATE,     p5.full_name, ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
    ]

    timeline = [
        make_step(1, SID, "2026-08-20T13:00:00Z", "FIR_INCIDENT",
                  "Robbery at market. Victim reports loss.", [p0.id], locs[0].id, ["FIR-S02-001"]),
        make_step(2, SID, "2026-08-20T13:05:00Z", "SUSPECT_VEHICLE_ANPR",
                  f"Vehicle {veh1.plate} captured near crime scene.", [p1.id, veh1.id],
                  locs[0].id, ["ANPR-S02-00001"]),
        make_step(3, SID, "2026-08-20T13:07:00Z", "DISTRACTOR_VEHICLE_ANPR",
                  f"Vehicle {veh2.plate} (same model) also seen near area.", [p2.id, veh2.id],
                  locs[0].id, ["ANPR-S02-00002"]),
        make_step(4, SID, "2026-08-20T14:30:00Z", "SUSPECT_CALL",
                  f"{p1.full_name} calls co-accused {p5.full_name} post-incident.", [p1.id, p5.id],
                  None, ["CDR-S02-00001"]),
        make_step(5, SID, "2026-08-20T15:00:00Z", "FINANCIAL_MOVE",
                  f"Funds transferred to {p5.full_name}'s account.", [p1.id, p5.id, acc5.id],
                  None, ["CBS-S02-00001"]),
        make_step(6, SID, "2026-08-20T16:00:00Z", "WITNESS_STATEMENT",
                  f"Witness {p3.full_name} describes suspect matching {p1.full_name}.", [p3.id, p1.id],
                  locs[0].id, ["FIR-S02-001"]),
    ]

    edges = [
        make_edge(f"{SID}-E001", p1.id, p0.id,    "PERPETRATOR_OF",    False, [("cctns_fir_records.json","FIR-S02-001"),("toll_anpr_logs.csv","ANPR-S02-00001")]),
        make_edge(f"{SID}-E002", p1.id, veh1.id,  "DRIVES",            True,  [("toll_anpr_logs.csv","ANPR-S02-00001")]),
        make_edge(f"{SID}-E003", p1.id, p5.id,    "COMMUNICATES_WITH", False, [("telecom_cdr_logs.csv","CDR-S02-00001")]),
        make_edge(f"{SID}-E004", p1.id, acc1.id,  "OWNS_ACCOUNT",      True,  [("cbs_bank_transactions.csv","CBS-S02-00001")]),
        make_edge(f"{SID}-E005", p5.id, acc5.id,  "RECEIVES_FUNDS",    False, [("cbs_bank_transactions.csv","CBS-S02-00001")]),
        make_edge(f"{SID}-E006", p3.id, locs[0].id,"WITNESS_AT",       True,  [("cctns_fir_records.json","FIR-S02-001")]),
        make_edge(f"{SID}-E007", p4.id, locs[0].id,"WITNESS_AT",       True,  [("cctns_fir_records.json","FIR-S02-001")]),
        # FP edge — p2 near scene but benign
        make_edge(f"{SID}-E008", p2.id, locs[0].id,"NEARBY_BENIGN",    True,  [("toll_anpr_logs.csv","ANPR-S02-00002")], confidence=0.10),
        make_edge(f"{SID}-E009", p1.id, locs[0].id,"PRESENT_AT_SCENE", False, [("cell_tower_dumps.json","TDUMP-S02-0001"),("toll_anpr_logs.csv","ANPR-S02-00001")]),
        make_edge(f"{SID}-E010", p0.id, acc0.id,  "VICTIM_ACCOUNT",    True,  [("cbs_bank_transactions.csv","CBS-S02-00002")]),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="FIR-Centric Robbery Investigation",
        scenario_type="FIR_CENTRIC",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, f"FIR-S02-001", "FIR_CASE", WIN,
        "Starting from FIR-S02-001 (robbery), identify all suspects, vehicles, and associates. Distinguish true suspect from similar-vehicle distractor.",
        "MEDIUM", "ENTITY_RESOLUTION")

    answer = make_answer(
        f"QRY-{SID}-001", SID, targets=[p1.id, p5.id],
        chain=[
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="PRIMARY_SUSPECT", description="Vehicle at scene + post-incident call + fund transfer"),
            EntityChainNode(canonical_id=p5.id, entity_type="PERSON", role_or_label="CO_ACCUSED", description="Received funds after incident"),
        ],
        edges=edges[:9],
        evidence=[("cctns_fir_records.json","FIR-S02-001"),("toll_anpr_logs.csv","ANPR-S02-00001"),("telecom_cdr_logs.csv","CDR-S02-00001"),("cbs_bank_transactions.csv","CBS-S02-00001")],
        timeline=timeline,
        summary=f"FIR links scene to {veh1.plate}. {p1.full_name} made post-incident call and transferred funds. {p2.full_name} had similar vehicle at scene but no call/financial evidence.",
        confidence=0.91, fp_cands=[p2.id],
        alt_hyp=["Distractor vehicle (same make/color) could be confused with suspect vehicle without plate verification."],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", veh1.id, veh2.id, ["same_make_model","same_color","same_area"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"{p1.full_name} perpetrated FIR-S02-001",
                                 f"{SID}-E001", ["FIR-S02-001","ANPR-S02-00001"], ["cctns_fir_records.json","toll_anpr_logs.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",f"{p2.full_name} was primary suspect",["same_vehicle_type"],
            "No CDR calls to co-accused, no suspicious financial activity post-incident.")],
    )
