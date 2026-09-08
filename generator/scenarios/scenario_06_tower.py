"""S6 — Cell Tower Dump Filtering (crowded tower, ~100+ candidate MSISDNs)
Large candidate population at one tower. Only a small subset satisfies combined conditions:
  time window + co-location + communication + related event.
ML purpose: Candidate Ranking, Entity Resolution, Anomaly Detection, FP Reduction.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S06"
WIN = ("2026-08-22T07:00:00Z", "2026-08-22T11:00:00Z")
# Generate 120 candidate MSISDNs for tower dump — only 3 are relevant
N_DISTRACTORS = 117


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    import random
    syn = DemographicSynthesizer(seed + 600)
    rng = random.Random(seed + 600)

    # True suspects (3 real persons at tower)
    p0, ph0, acc0, _ = make_person(SID, 0, syn, 0, acc_idx=0)  # mastermind
    p1, ph1, acc1, _ = make_person(SID, 1, syn, 1, acc_idx=1)  # associate
    p2, ph2, _,    _ = make_person(SID, 2, syn, 2)              # courier

    # Distractor persons (only phone context, no full entity)
    p3, ph3, _, _ = make_person(SID, 3, syn, 3)  # benign commuter A
    p4, ph4, _, _ = make_person(SID, 4, syn, 4)  # benign commuter B

    persons = [p0, p1, p2, p3, p4]
    phones  = [ph0, ph1, ph2, ph3, ph4]
    accs    = [acc0, acc1]
    locs    = [make_location(SID, i, syn) for i in range(3)]

    # Generate 117 random distractor MSISDNs for tower dump
    distractor_msisdns = [f"+91-{rng.randint(9000000000, 9999999999)}" for _ in range(N_DISTRACTORS)]
    all_tower_msisdns = [ph0.msisdn, ph1.msisdn, ph2.msisdn, ph3.msisdn, ph4.msisdn] + distractor_msisdns

    # Store tower dump metadata in context events
    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="TOWER_DUMP_FILTERING",
        seed=seed+600, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, locations=locs,
        events=[{
            "event_type": "TOWER_DUMP_METADATA",
            "tower_id": locs[0].tower_id,
            "total_msisdns": len(all_tower_msisdns),
            "relevant_msisdns": [ph0.msisdn, ph1.msisdn, ph2.msisdn],
            "distractor_msisdns": distractor_msisdns,
            "all_msisdns": all_tower_msisdns,
        }]
    )

    roles = [
        make_role(p0.id, GroundTruthRole.MASTERMIND, p0.full_name,  ["telecom_cdr_logs.csv","cbs_bank_transactions.csv","cell_tower_dumps.json"]),
        make_role(p1.id, GroundTruthRole.ASSOCIATE,  p1.full_name,  ["telecom_cdr_logs.csv","cell_tower_dumps.json"]),
        make_role(p2.id, GroundTruthRole.ASSOCIATE,  p2.full_name,  ["cell_tower_dumps.json","cctns_fir_records.json"]),
        make_role(p3.id, GroundTruthRole.DISTRACTOR, p3.full_name,  ["cell_tower_dumps.json"]),
        make_role(p4.id, GroundTruthRole.DISTRACTOR, p4.full_name,  ["cell_tower_dumps.json"]),
    ]

    timeline = [
        make_step(1, SID, "2026-08-22T07:30:00Z", "TOWER_DUMP_WINDOW_START",
                  f"Tower {locs[0].tower_id} active. 122 MSISDNs present in window.", [p0.id, p1.id, p2.id],
                  locs[0].id, ["TDUMP-S06-0001"]),
        make_step(2, SID, "2026-08-22T08:00:00Z", "SUSPECT_COMMUNICATION",
                  f"{p0.full_name} calls {p1.full_name} while at tower.", [p0.id, p1.id],
                  locs[0].id, ["CDR-S06-00001"]),
        make_step(3, SID, "2026-08-22T08:15:00Z", "MEETING_AT_TOWER",
                  f"{p0.full_name} meets {p2.full_name} near tower location.", [p0.id, p2.id],
                  locs[0].id, ["FNOTE-S06-0001"]),
        make_step(4, SID, "2026-08-22T09:00:00Z", "CRIME_EVENT",
                  "Snatching incident reported in vicinity.", [p0.id, p2.id],
                  locs[0].id, ["FIR-S06-001"]),
        make_step(5, SID, "2026-08-22T09:30:00Z", "FINANCIAL_ACTIVITY",
                  f"{p0.full_name} transfers funds post-crime.", [p0.id, p1.id, acc0.id, acc1.id],
                  None, ["CBS-S06-00001","FIU-S06-0001"]),
    ]

    edges = [
        make_edge(f"{SID}-E001", p0.id, p1.id, "COMMUNICATES_WITH",   False, [("telecom_cdr_logs.csv","CDR-S06-00001"),("cell_tower_dumps.json","TDUMP-S06-0001")]),
        make_edge(f"{SID}-E002", p0.id, p2.id, "MEETS_AT_TOWER",      False, [("cell_tower_dumps.json","TDUMP-S06-0001"),("field_intelligence_notes.txt","FNOTE-S06-0001")]),
        make_edge(f"{SID}-E003", p0.id, locs[0].id,"PRESENT_AT",      True,  [("cell_tower_dumps.json","TDUMP-S06-0001")]),
        make_edge(f"{SID}-E004", p1.id, locs[0].id,"PRESENT_AT",      True,  [("cell_tower_dumps.json","TDUMP-S06-0001")]),
        make_edge(f"{SID}-E005", p2.id, locs[0].id,"PRESENT_AT",      True,  [("cell_tower_dumps.json","TDUMP-S06-0001"),("cctns_fir_records.json","FIR-S06-001")]),
        make_edge(f"{SID}-E006", p0.id, acc0.id, "OWNS_ACCOUNT",      True,  [("cbs_bank_transactions.csv","CBS-S06-00001")]),
        make_edge(f"{SID}-E007", p0.id, acc1.id, "TRANSFERS_FUNDS",   False, [("cbs_bank_transactions.csv","CBS-S06-00001"),("fiu_str_alerts.json","FIU-S06-0001")]),
        # Distractors — mere co-location, no other link
        make_edge(f"{SID}-E008", p3.id, locs[0].id,"CO_LOCATED_ONLY", True,  [("cell_tower_dumps.json","TDUMP-S06-0001")], 0.03),
        make_edge(f"{SID}-E009", p4.id, locs[0].id,"CO_LOCATED_ONLY", True,  [("cell_tower_dumps.json","TDUMP-S06-0001")], 0.03),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Cell Tower Dump Filtering",
        scenario_type="TOWER_DUMP_FILTERING",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, locs[0].id, "LOCATION", WIN,
        f"Tower dump at {locs[0].name} shows {len(all_tower_msisdns)} MSISDNs present during 07:00–11:00 on 22-Aug-2026. A crime occurred in this area at 09:00. Filter to identify which MSISDNs are relevant to the crime.",
        "HARD", "CO_LOCATION")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[p0.id, p1.id, p2.id],
        chain=[
            EntityChainNode(canonical_id=p0.id, entity_type="PERSON", role_or_label="SUSPECT_PRESENT", description="CDR call + fund transfer + FIR"),
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="SUSPECT_PRESENT", description="CDR call + fund receipt"),
            EntityChainNode(canonical_id=p2.id, entity_type="PERSON", role_or_label="SUSPECT_PRESENT", description="Named in FIR + field notes"),
        ],
        edges=edges[:7],
        evidence=[("telecom_cdr_logs.csv","CDR-S06-00001"),("cbs_bank_transactions.csv","CBS-S06-00001"),("cctns_fir_records.json","FIR-S06-001")],
        timeline=timeline,
        summary=f"Of {len(all_tower_msisdns)} MSISDNs in tower dump, only 3 satisfy time+location+communication+event conditions: {p0.full_name}, {p1.full_name}, {p2.full_name}. {N_DISTRACTORS+2} others are mere co-located commuters.",
        confidence=0.90, fp_cands=[p3.id, p4.id],
        alt_hyp=["Any of the 117 distractor MSISDNs could superficially match if only tower co-location is used as the sole criterion."],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[
            build_hard_negative(f"HN-{SID}-001", p0.msisdn if hasattr(p0,'msisdn') else p0.id,
                                p3.id, ["same_tower","same_time_window"]),
            build_hard_negative(f"HN-{SID}-002", p1.id, p4.id, ["same_tower","same_time_window"]),
        ],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"{p0.full_name} is relevant to FIR-S06-001",
                                 f"{SID}-E003", ["TDUMP-S06-0001","CDR-S06-00001","FIR-S06-001","CBS-S06-00001"],
                                 ["cell_tower_dumps.json","telecom_cdr_logs.csv","cctns_fir_records.json","cbs_bank_transactions.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            "All 122 tower dump MSISDNs are suspects",
            ["same_tower","same_time_window"],
            "117 of 122 MSISDNs have no CDR calls to each other, no suspicious financial activity, and no connection to FIR.")],
    )
