"""S9 — 72-Hour Dense Timeline Reconstruction
T0→T+72h with minute-level events: calls, movements, transactions, meetings, social posts.
Events have hidden DAG dependencies. Answer requires temporal ordering.
ML purpose: Temporal Ordering, Event Correlation, Cross-Source Timeline Reconstruction.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S09"
T0  = "2026-08-19T06:00:00Z"
WIN = ("2026-08-19T00:00:00Z", "2026-08-22T06:00:00Z")


def _ts(base: str, hrs: int, mins: int = 0) -> str:
    from datetime import datetime, timedelta
    dt = datetime.fromisoformat(base.replace("Z",""))
    return (dt + timedelta(hours=hrs, minutes=mins)).strftime("%Y-%m-%dT%H:%M:%SZ")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 900)

    p0, ph0, acc0, veh0 = make_person(SID, 0, syn, 0, acc_idx=0, veh_idx=0)
    p1, ph1, acc1, _    = make_person(SID, 1, syn, 1, acc_idx=1)
    p2, ph2, _,    _    = make_person(SID, 2, syn, 2)
    p3, ph3, acc3, _    = make_person(SID, 3, syn, 3, acc_idx=3)  # victim
    p4, ph4, _,    _    = make_person(SID, 4, syn, 4)  # benign commuter

    persons = [p0, p1, p2, p3, p4]
    phones  = [ph0, ph1, ph2, ph3, ph4]
    accs    = [acc0, acc1, acc3]
    vehs    = [veh0]
    locs    = [make_location(SID, i, syn) for i in range(6)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="TIMELINE_RECONSTRUCTION",
        seed=seed+900, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, vehicles=vehs, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.MASTERMIND, p0.full_name, ["telecom_cdr_logs.csv","toll_anpr_logs.csv","cbs_bank_transactions.csv","cctns_fir_records.json"]),
        make_role(p1.id, GroundTruthRole.ASSOCIATE,  p1.full_name, ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(p2.id, GroundTruthRole.ASSOCIATE,  p2.full_name, ["telecom_cdr_logs.csv","osint_social_posts.json"]),
        make_role(p3.id, GroundTruthRole.BENIGN_PERSON, p3.full_name, ["cctns_fir_records.json","cbs_bank_transactions.csv"]),
        make_role(p4.id, GroundTruthRole.DISTRACTOR,  p4.full_name, ["toll_anpr_logs.csv","cell_tower_dumps.json"]),
    ]

    # 20 events across 72 hours — must be ordered by answer
    # DAG: EVT-01 precedes EVT-04, EVT-04 precedes EVT-07, EVT-07 precedes EVT-12, EVT-12 precedes EVT-18
    timeline = [
        make_step(1,  SID, _ts(T0,0,0),   "PLANNING_CALL",      f"[H+00:00] {p0.full_name} calls {p1.full_name} — pre-op planning.", [p0.id,p1.id], locs[0].id, ["CDR-S09-00001"]),
        make_step(2,  SID, _ts(T0,1,12),  "OSINT_SIGNAL",       f"[H+01:12] Coded message posted by {p2.full_name}.", [p2.id], None, ["OSINT-S09-0001"]),
        make_step(3,  SID, _ts(T0,2,30),  "VEHICLE_DEPARTS",    f"[H+02:30] {veh0.plate} departs {locs[0].name}.", [p0.id,veh0.id], locs[0].id, ["ANPR-S09-00001"]),
        make_step(4,  SID, _ts(T0,4,5),   "FIRST_RENDEZVOUS",   f"[H+04:05] {p0.full_name} meets {p2.full_name} at {locs[1].name}.", [p0.id,p2.id], locs[1].id, ["CDR-S09-00002","TDUMP-S09-0001"]),
        make_step(5,  SID, _ts(T0,5,0),   "BENIGN_COMMUTER",    f"[H+05:00] Benign {p4.full_name} passes same toll (distractor).", [p4.id], locs[1].id, ["ANPR-S09-00002"]),
        make_step(6,  SID, _ts(T0,6,45),  "VICTIM_CONTACTED",   f"[H+06:45] {p3.full_name} (victim) receives suspicious call.", [p3.id,p0.id], locs[2].id, ["CDR-S09-00003"]),
        make_step(7,  SID, _ts(T0,8,0),   "CRIME_EVENT",        f"[H+08:00] Fraud committed against {p3.full_name}.", [p0.id,p3.id], locs[2].id, ["FIR-S09-001","FNOTE-S09-0001"]),
        make_step(8,  SID, _ts(T0,8,20),  "IMMEDIATE_TRANSFER", f"[H+08:20] Funds transferred out of {p3.full_name} account.", [p3.id,p0.id,acc3.id,acc0.id], None, ["CBS-S09-00001"]),
        make_step(9,  SID, _ts(T0,9,0),   "VEHICLE_RETURNS",    f"[H+09:00] {veh0.plate} sighted returning.", [p0.id,veh0.id], locs[0].id, ["ANPR-S09-00003"]),
        make_step(10, SID, _ts(T0,12,0),  "FIRST_LAYERING",     f"[H+12:00] Funds moved to {p1.full_name} account.", [p1.id,acc1.id,acc0.id], None, ["CBS-S09-00002","FIU-S09-0001"]),
        make_step(11, SID, _ts(T0,14,30), "SECOND_RENDEZVOUS",  f"[H+14:30] {p0.full_name} meets {p1.full_name}.", [p0.id,p1.id], locs[3].id, ["CDR-S09-00004","TDUMP-S09-0002"]),
        make_step(12, SID, _ts(T0,18,0),  "SOCIAL_CONFIRMATION",f"[H+18:00] Coded confirmation post by {p2.full_name}.", [p2.id], None, ["OSINT-S09-0002"]),
        make_step(13, SID, _ts(T0,24,0),  "QUIET_PERIOD",       f"[H+24:00] No significant activity.", [], None, []),
        make_step(14, SID, _ts(T0,30,0),  "SECONDARY_FRAUD",    f"[H+30:00] Second victim targeted.", [p0.id], locs[4].id, ["CDR-S09-00005"]),
        make_step(15, SID, _ts(T0,36,15), "SECOND_LAYERING",    f"[H+36:15] Further funds layering.", [p1.id,acc1.id], None, ["CBS-S09-00003","FIU-S09-0002"]),
        make_step(16, SID, _ts(T0,48,0),  "TRAVEL_TO_NEW_LOC",  f"[H+48:00] Suspect travels to {locs[5].name}.", [p0.id,veh0.id], locs[5].id, ["ANPR-S09-00004"]),
        make_step(17, SID, _ts(T0,52,30), "COORDINATION_CALL",  f"[H+52:30] {p0.full_name} coordinates with {p2.full_name}.", [p0.id,p2.id], None, ["CDR-S09-00006"]),
        make_step(18, SID, _ts(T0,60,0),  "FIR_REGISTERED",     f"[H+60:00] First victim {p3.full_name} registers FIR.", [p3.id], locs[2].id, ["FIR-S09-001"]),
        make_step(19, SID, _ts(T0,68,45), "SUSPECT_DETECTED",   f"[H+68:45] Intelligence unit traces phone.", [p0.id,ph0.id], locs[0].id, ["FNOTE-S09-0002","TDUMP-S09-0003"]),
        make_step(20, SID, _ts(T0,72,0),  "WINDOW_CLOSE",       "72-hour investigation window ends.", [], None, []),
    ]

    # Key temporal dependency: EVT1→EVT4→EVT7→EVT10→EVT12→EVT18
    edges = [
        make_edge(f"{SID}-E001", p0.id, p1.id,   "CALLS_PLANNING",    False, [("telecom_cdr_logs.csv","CDR-S09-00001")], t_start=_ts(T0,0,0)),
        make_edge(f"{SID}-E002", p0.id, p2.id,   "MEETS",             False, [("telecom_cdr_logs.csv","CDR-S09-00002"),("cell_tower_dumps.json","TDUMP-S09-0001")], t_start=_ts(T0,4,5)),
        make_edge(f"{SID}-E003", p0.id, p3.id,   "DEFRAUDS",          False, [("cctns_fir_records.json","FIR-S09-001"),("telecom_cdr_logs.csv","CDR-S09-00003")], t_start=_ts(T0,8,0)),
        make_edge(f"{SID}-E004", acc3.id, acc0.id,"FUNDS_RECEIVED",   True,  [("cbs_bank_transactions.csv","CBS-S09-00001")], t_start=_ts(T0,8,20)),
        make_edge(f"{SID}-E005", acc0.id, acc1.id,"LAYERED_TO",       True,  [("cbs_bank_transactions.csv","CBS-S09-00002"),("fiu_str_alerts.json","FIU-S09-0001")], t_start=_ts(T0,12,0)),
        make_edge(f"{SID}-E006", p0.id, veh0.id, "USES_VEHICLE",      True,  [("toll_anpr_logs.csv","ANPR-S09-00001"),("toll_anpr_logs.csv","ANPR-S09-00003")]),
        make_edge(f"{SID}-E007", p2.id, "OSINT-SIGNAL","SIGNALS_VIA_OSINT",False,[("osint_social_posts.json","OSINT-S09-0001"),("osint_social_posts.json","OSINT-S09-0002")]),
        # Distractor: p4 at same toll — benign
        make_edge(f"{SID}-E008", p4.id, locs[1].id,"CO_LOCATED_ONLY", True,  [("toll_anpr_logs.csv","ANPR-S09-00002")], 0.03),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="72-Hour Timeline Reconstruction",
        scenario_type="TIMELINE_RECONSTRUCTION",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, p0.id, "PERSON", WIN,
        f"Reconstruct a complete chronological timeline of all events involving {p0.full_name} and associates over the 72-hour window. Identify temporal dependencies and causal ordering.",
        "HARD", "TEMPORAL_REASONING")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[p0.id, p1.id, p2.id],
        chain=[
            EntityChainNode(canonical_id=p0.id, entity_type="PERSON", role_or_label="PRIMARY", description=f"{p0.full_name} — orchestrator"),
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="LAYERER", description="Receives and layers funds"),
            EntityChainNode(canonical_id=p2.id, entity_type="PERSON", role_or_label="SIGNALER", description="Posts coded OSINT signals"),
        ],
        edges=edges[:7],
        evidence=[("telecom_cdr_logs.csv","CDR-S09-00001"),("cbs_bank_transactions.csv","CBS-S09-00001"),
                  ("cctns_fir_records.json","FIR-S09-001"),("fiu_str_alerts.json","FIU-S09-0001")],
        timeline=timeline,
        summary=f"20 events across 72h. Key causal chain: EVT1(planning call)→EVT4(rendezvous)→EVT7(crime)→EVT8(transfer)→EVT10(layering)→EVT18(FIR). OSINT signals at EVT2+EVT12 corroborate coordination. Distractor {p4.full_name} appears at H+05:00 (benign commuter at same toll).",
        confidence=0.91, fp_cands=[p4.id],
        alt_hyp=["Distractor commuter at H+05:00 could be mistakenly linked due to same toll at similar time."],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", p0.id, p4.id, ["same_toll","similar_time_window"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", "Crime→Transfer causal chain",
                                 f"{SID}-E004", ["FIR-S09-001","CBS-S09-00001"],
                                 ["cctns_fir_records.json","cbs_bank_transactions.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"Distractor {p4.full_name} is a co-conspirator",
            ["same_toll_at_similar_time"],
            "No CDR calls to suspects. No financial link. Toll presence 1h before crime — not co-incident in time or location with crime event.")],
    )
