"""S3 — Phone-Centric Investigation (Recycled SIM / IMEI Change)
Starting point: PHONE/MSISDN.
Explicitly models SIM reassignment: Person A → SIM deactivated → Person B gets same number.
Observed records must NOT directly state "SIM now belongs to Person B".
ML purpose: Temporal Identity Resolution, Entity Resolution, Hard Negatives.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S03"
WIN = ("2026-01-01T00:00:00Z", "2026-08-31T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 300)
    # p0 = original SIM owner (benign), p1 = recycled SIM user (suspect), p2 = associate of p1
    p0, ph0, acc0, _    = make_person(SID, 0, syn, 0, acc_idx=0)
    p1, ph1, acc1, _    = make_person(SID, 1, syn, 1, acc_idx=1)
    p2, ph2, acc2, _    = make_person(SID, 2, syn, 2, acc_idx=2)
    p3, ph3, _,    _    = make_person(SID, 3, syn, 3)  # benign co-location

    # Key: ph1 SAME msisdn as ph0, different IMEI (SIM recycled)
    recycled_msisdn = ph0.msisdn
    ph1.msisdn = recycled_msisdn
    p1.msisdn  = recycled_msisdn
    ph1.imei   = syn.generate_imei(100)         # different IMEI
    ph1.activation_date = "2026-06-01T00:00:00Z"  # after ph0 deactivation
    ph0.deactivation_date = "2026-05-31T23:59:59Z"
    ph0.activation_date   = "2026-01-01T00:00:00Z"

    persons = [p0, p1, p2, p3]
    phones  = [ph0, ph1, ph2, ph3]
    accs    = [acc0, acc1, acc2]
    locs    = [make_location(SID, i, syn) for i in range(4)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="PHONE_CENTRIC",
        seed=seed+300, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.BENIGN_PERSON, p0.full_name, ["telecom_caf_kyc.json","telecom_cdr_logs.csv"]),
        make_role(p1.id, GroundTruthRole.MASTERMIND,    p1.full_name, ["telecom_caf_kyc.json","telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(p2.id, GroundTruthRole.ASSOCIATE,     p2.full_name, ["telecom_cdr_logs.csv","cbs_bank_transactions.csv"]),
        make_role(p3.id, GroundTruthRole.DISTRACTOR,    p3.full_name, ["cell_tower_dumps.json"]),
    ]

    timeline = [
        make_step(1, SID, "2026-01-15T10:00:00Z", "ORIGINAL_SIM_USAGE",
                  f"Original subscriber {p0.full_name} uses {recycled_msisdn}.",
                  [p0.id, ph0.id], locs[0].id, ["CDR-S03-00001"]),
        make_step(2, SID, "2026-05-31T23:59:59Z", "SIM_DEACTIVATION",
                  f"SIM {recycled_msisdn} deactivated under {p0.full_name}.",
                  [p0.id, ph0.id], None, ["CAF-S03-0001"]),
        make_step(3, SID, "2026-06-01T09:00:00Z", "SIM_REASSIGNMENT",
                  f"Same MSISDN {recycled_msisdn} reissued. New subscriber activates.",
                  [p1.id, ph1.id], None, ["CAF-S03-0002"]),
        make_step(4, SID, "2026-08-10T11:00:00Z", "SUSPECT_CALL",
                  f"Recycled SIM user contacts associate {p2.full_name}.",
                  [p1.id, p2.id], locs[1].id, ["CDR-S03-00010"]),
        make_step(5, SID, "2026-08-10T14:00:00Z", "SUSPICIOUS_TRANSFER",
                  f"Funds transferred from recycled SIM user's account.",
                  [p1.id, acc1.id, acc2.id], None, ["CBS-S03-00001"]),
        make_step(6, SID, "2026-08-10T14:30:00Z", "CO_LOCATION_NOISE",
                  f"Distractor {p3.full_name} in same tower, unrelated.",
                  [p3.id, p1.id], locs[1].id, ["TDUMP-S03-0001"]),
    ]

    edges = [
        # Pre-reassignment (historical, belongs to p0)
        make_edge(f"{SID}-E001", p0.id, ph0.id, "HISTORICALLY_OWNED",  True,
                  [("telecom_caf_kyc.json","CAF-S03-0001")], confidence=1.0,
                  t_start="2025-01-01T00:00:00Z", t_end="2026-05-31T23:59:59Z"),
        # Post-reassignment (current user is p1)
        make_edge(f"{SID}-E002", p1.id, ph1.id, "CURRENTLY_OWNS",      True,
                  [("telecom_caf_kyc.json","CAF-S03-0002")], confidence=1.0,
                  t_start="2026-06-01T00:00:00Z"),
        make_edge(f"{SID}-E003", p1.id, p2.id,  "COMMUNICATES_WITH",   False,
                  [("telecom_cdr_logs.csv","CDR-S03-00010")]),
        make_edge(f"{SID}-E004", p1.id, acc1.id,"OWNS_ACCOUNT",        True,
                  [("cbs_bank_transactions.csv","CBS-S03-00001")]),
        make_edge(f"{SID}-E005", p1.id, acc2.id,"TRANSFERS_TO",        False,
                  [("cbs_bank_transactions.csv","CBS-S03-00001")]),
        make_edge(f"{SID}-E006", p2.id, acc2.id,"OWNS_ACCOUNT",        True,
                  [("cbs_bank_transactions.csv","CBS-S03-00002")]),
        # Hard negative: p0 and p1 share same MSISDN but are different persons
        make_edge(f"{SID}-E007", p0.id, p1.id,  "SIM_RECYCLED_NOT_SAME_PERSON", False,
                  [("telecom_caf_kyc.json","CAF-S03-0001"),("telecom_caf_kyc.json","CAF-S03-0002")],
                  confidence=0.0),   # GT: this is NOT a real link, it's a disambiguation edge
        make_edge(f"{SID}-E008", p3.id, locs[1].id,"CO_LOCATED_BENIGN", True,
                  [("cell_tower_dumps.json","TDUMP-S03-0001")], confidence=0.05),
        make_edge(f"{SID}-E009", p1.id, locs[1].id,"PRESENT_AT",       False,
                  [("cell_tower_dumps.json","TDUMP-S03-0001"),("telecom_cdr_logs.csv","CDR-S03-00010")]),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Phone-Centric Recycled SIM Investigation",
        scenario_type="PHONE_CENTRIC",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, ph1.msisdn, "PHONE", WIN,
        f"Phone {recycled_msisdn} appears in both historical CDRs (2025) and recent suspicious activity (2026). Determine whether this represents the same person or a recycled SIM reassignment.",
        "HARD", "ENTITY_RESOLUTION")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[p1.id],
        chain=[
            EntityChainNode(canonical_id=ph0.id, entity_type="PHONE", role_or_label="HISTORICAL_SIM_OWNER", description=f"Original subscriber: {p0.full_name} until May 2026"),
            EntityChainNode(canonical_id=ph1.id, entity_type="PHONE", role_or_label="CURRENT_SIM_USER", description=f"New subscriber: {p1.full_name} from June 2026"),
            EntityChainNode(canonical_id=p1.id,  entity_type="PERSON", role_or_label="ACTIVE_SUSPECT", description="Recycled SIM user with suspicious financial activity"),
        ],
        edges=[edges[0], edges[1], edges[2], edges[4]],
        evidence=[("telecom_caf_kyc.json","CAF-S03-0001"),("telecom_caf_kyc.json","CAF-S03-0002"),("telecom_cdr_logs.csv","CDR-S03-00010")],
        timeline=timeline,
        summary=f"MSISDN {recycled_msisdn} was deactivated from {p0.full_name} on 31-May-2026 and reissued to {p1.full_name} on 01-Jun-2026. Historical 2025 CDRs belong to {p0.full_name}. Post-June-2026 activity belongs to {p1.full_name}. These are distinct persons.",
        confidence=0.97,
        alt_hyp=[f"{p0.full_name} continued using the phone under a different registration."],
        fp_cands=[p0.id],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", p0.id, p1.id, ["same_msisdn","similar_call_patterns","same_network"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"SIM {recycled_msisdn} belongs to {p1.full_name} post-June-2026",
                                 f"{SID}-E002", ["CAF-S03-0002","CDR-S03-00010"],
                                 ["telecom_caf_kyc.json","telecom_cdr_logs.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"Historical 2025 activity ({p0.full_name}) merged with 2026 suspect activity",
            ["same_msisdn"],
            "CAF records show distinct IMEI change and different address at activation. Temporal boundary at 31-May-2026.")],
    )
