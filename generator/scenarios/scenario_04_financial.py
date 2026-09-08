"""S4 — Financial Multi-Hop Layering (4-6 hops)
Graph: PersonA→AccA→AccB→PersonB→AccC→PersonC→AccD→PersonD
Includes benign high-volume account as distractor (same transaction volumes).
ML purpose: Anomaly Detection, Link Prediction, Multi-Hop Reasoning, Financial Pattern Detection.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S04"
WIN = ("2026-08-01T00:00:00Z", "2026-08-31T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 400)
    # p0=Origin(victim/source), p1=Mule1, p2=Mule2, p3=Mastermind, p4=benign_high_value(distractor)
    p0, ph0, acc0, _ = make_person(SID, 0, syn, 0, acc_idx=0)
    p1, ph1, acc1, _ = make_person(SID, 1, syn, 1, acc_idx=1)
    p2, ph2, acc2, _ = make_person(SID, 2, syn, 2, acc_idx=2)
    p3, ph3, acc3, _ = make_person(SID, 3, syn, 3, acc_idx=3)
    p4, ph4, acc4, _ = make_person(SID, 4, syn, 4, acc_idx=4)  # benign distractor

    # Extra intermediary account (not linked to a person in CAF — shell)
    acc_shell_no, bank_s, ifsc_s = syn.generate_bank_account(99)
    from generator.context import AccountCtx
    acc_shell = AccountCtx(id=f"ACC-{SID}-099", owner_id="UNKNOWN",
                           account_number=acc_shell_no, bank_name=bank_s, ifsc=ifsc_s,
                           opening_date="2026-05-01T00:00:00Z")

    persons = [p0, p1, p2, p3, p4]
    phones  = [ph0, ph1, ph2, ph3, ph4]
    accs    = [acc0, acc1, acc2, acc3, acc4, acc_shell]
    locs    = [make_location(SID, i, syn) for i in range(3)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="FINANCIAL_MULTI_HOP",
        seed=seed+400, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.BENIGN_PERSON, p0.full_name, ["cbs_bank_transactions.csv"]),  # victim
        make_role(p1.id, GroundTruthRole.MULE,          p1.full_name, ["cbs_bank_transactions.csv","fiu_str_alerts.json"]),
        make_role(p2.id, GroundTruthRole.MULE,          p2.full_name, ["cbs_bank_transactions.csv","fiu_str_alerts.json"]),
        make_role(p3.id, GroundTruthRole.MASTERMIND,    p3.full_name, ["cbs_bank_transactions.csv","telecom_cdr_logs.csv"]),
        make_role(p4.id, GroundTruthRole.DISTRACTOR,    p4.full_name, ["cbs_bank_transactions.csv"]),
    ]

    # Timeline: 6-hop chain with realistic time gaps
    timeline = [
        make_step(1, SID, "2026-08-05T10:00:00Z", "INITIAL_TRANSFER",
                  f"Funds leave {p0.full_name} account (coerced).", [p0.id, acc0.id], None, ["CBS-S04-00001"]),
        make_step(2, SID, "2026-08-05T10:15:00Z", "HOP_1",
                  f"Acc-A → Acc-B (Mule 1: {p1.full_name})", [p1.id, acc1.id], None, ["CBS-S04-00002","FIU-S04-0001"]),
        make_step(3, SID, "2026-08-05T10:45:00Z", "HOP_2",
                  "Acc-B → Shell Account (no registered owner).", [acc_shell.id], None, ["CBS-S04-00003"]),
        make_step(4, SID, "2026-08-05T11:30:00Z", "HOP_3",
                  f"Shell → Acc-C (Mule 2: {p2.full_name})", [p2.id, acc2.id], None, ["CBS-S04-00004","FIU-S04-0002"]),
        make_step(5, SID, "2026-08-05T13:00:00Z", "HOP_4",
                  f"Acc-C → Acc-D ({p3.full_name} final destination)", [p3.id, acc3.id], None, ["CBS-S04-00005"]),
        make_step(6, SID, "2026-08-06T09:00:00Z", "COORDINATION_CALL",
                  f"Mastermind {p3.full_name} calls Mule 1 post-transfer.", [p3.id, p1.id], None, ["CDR-S04-00001"]),
    ]

    # 5-hop financial chain: p0.acc → p1.acc → shell → p2.acc → p3.acc
    edges = [
        make_edge(f"{SID}-E001", acc0.id, acc1.id,    "TRANSFERS_TO",      True,  [("cbs_bank_transactions.csv","CBS-S04-00001")], 0.99),
        make_edge(f"{SID}-E002", acc1.id, acc_shell.id,"TRANSFERS_TO",     True,  [("cbs_bank_transactions.csv","CBS-S04-00003")], 0.99),
        make_edge(f"{SID}-E003", acc_shell.id, acc2.id,"TRANSFERS_TO",     True,  [("cbs_bank_transactions.csv","CBS-S04-00004")], 0.99),
        make_edge(f"{SID}-E004", acc2.id, acc3.id,    "TRANSFERS_TO",      True,  [("cbs_bank_transactions.csv","CBS-S04-00005")], 0.99),
        # Person-account ownership
        make_edge(f"{SID}-E005", p0.id, acc0.id,  "OWNS_ACCOUNT",  True, [("cbs_bank_transactions.csv","CBS-S04-00001")]),
        make_edge(f"{SID}-E006", p1.id, acc1.id,  "OWNS_ACCOUNT",  True, [("telecom_caf_kyc.json","CAF-S04-0002")]),
        make_edge(f"{SID}-E007", p2.id, acc2.id,  "OWNS_ACCOUNT",  True, [("telecom_caf_kyc.json","CAF-S04-0003")]),
        make_edge(f"{SID}-E008", p3.id, acc3.id,  "OWNS_ACCOUNT",  True, [("telecom_caf_kyc.json","CAF-S04-0004")]),
        # Coordination
        make_edge(f"{SID}-E009", p3.id, p1.id,   "COORDINATES",   False,[("telecom_cdr_logs.csv","CDR-S04-00001")]),
        # FIU flags
        make_edge(f"{SID}-E010", acc1.id, "FIU-ALERT", "STR_FLAGGED", False,[("fiu_str_alerts.json","FIU-S04-0001")]),
        make_edge(f"{SID}-E011", acc2.id, "FIU-ALERT", "STR_FLAGGED", False,[("fiu_str_alerts.json","FIU-S04-0002")]),
        # Distractor: p4 has same-volume transactions but benign
        make_edge(f"{SID}-E012", p4.id, acc4.id, "OWNS_ACCOUNT_BENIGN", True,[("cbs_bank_transactions.csv","CBS-S04-00010")], 0.05),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Financial Multi-Hop Layering",
        scenario_type="FINANCIAL_MULTI_HOP",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, acc0.id, "ACCOUNT", WIN,
        f"Starting from flagged account {acc0.account_number}, trace all downstream fund movements. Identify ultimate beneficiary and all intermediary accounts.",
        "HARD", "FINANCIAL_LAYERING")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[p3.id, p1.id, p2.id],
        chain=[
            EntityChainNode(canonical_id=acc0.id, entity_type="ACCOUNT", role_or_label="SOURCE", description="Funds originate here"),
            EntityChainNode(canonical_id=acc1.id, entity_type="ACCOUNT", role_or_label="HOP_1_MULE", description=f"Mule 1: {p1.full_name}"),
            EntityChainNode(canonical_id=acc_shell.id, entity_type="ACCOUNT", role_or_label="HOP_2_SHELL", description="Shell account, no registered owner"),
            EntityChainNode(canonical_id=acc2.id, entity_type="ACCOUNT", role_or_label="HOP_3_MULE", description=f"Mule 2: {p2.full_name}"),
            EntityChainNode(canonical_id=acc3.id, entity_type="ACCOUNT", role_or_label="HOP_4_DESTINATION", description=f"Final: {p3.full_name}"),
        ],
        edges=edges[:11],
        evidence=[("cbs_bank_transactions.csv","CBS-S04-00001"),("cbs_bank_transactions.csv","CBS-S04-00005"),
                  ("fiu_str_alerts.json","FIU-S04-0001"),("telecom_cdr_logs.csv","CDR-S04-00001")],
        timeline=timeline,
        summary=f"5-hop chain: {p0.full_name}→Mule1→Shell→Mule2→{p3.full_name}. Shell account owned by unknown entity. {p3.full_name} coordinates with Mule1 post-transfer. Distractor {p4.full_name} has similar volumes but is a legitimate business.",
        confidence=0.94,
        alt_hyp=["High-volume distractor account could appear suspicious purely based on transaction size without layering pattern."],
        fp_cands=[p4.id],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", acc3.id, acc4.id, ["similar_transaction_volume","same_bank","same_district"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", "5-hop financial chain from source to mastermind",
                                 f"{SID}-E004", ["CBS-S04-00001","CBS-S04-00003","CBS-S04-00004","CBS-S04-00005"],
                                 ["cbs_bank_transactions.csv","cbs_bank_transactions.csv","cbs_bank_transactions.csv","cbs_bank_transactions.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"Distractor {p4.full_name} is part of layering chain",
            ["similar_transaction_volume"],
            "Distractor account shows no time-correlated transfers with the main chain. No CDR link to other suspects.")],
    )
