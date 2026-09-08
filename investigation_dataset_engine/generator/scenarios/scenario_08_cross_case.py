"""S8 — Cross-Case Linkage (3 FIRs, shared latent entity)
Three FIRs across different districts share a hidden common person.
Identity varies across cases: name variation + alias + partial match.
ML purpose: Entity Resolution, Cross-Case Link Prediction, Graph Clustering, Hard Negatives.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S08"
WIN = ("2026-07-01T00:00:00Z", "2026-08-31T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 800)

    # Shared suspect appears in 3 FIRs under different name variations
    pShared, phShared, accShared, vehShared = make_person(SID, 0, syn, 0, acc_idx=0, veh_idx=0)
    base_name = pShared.full_name  # e.g. "Amit Sharma"
    parts = base_name.split()
    first, last = parts[0], parts[-1]

    # Name variants across three cases (how the shared person appears in each FIR)
    name_var1 = base_name                         # Case 1: full name
    name_var2 = f"{first[0]}. {last}"            # Case 2: initial + surname
    name_var3 = f"{first} {last[:3]}."           # Case 3: first + abbreviated surname

    # Other persons in each case
    pVic1, phVic1, _, _ = make_person(SID, 1, syn, 1)
    pVic2, phVic2, _, _ = make_person(SID, 2, syn, 2)
    pVic3, phVic3, _, _ = make_person(SID, 3, syn, 3)
    pWit1, phWit1, _, _ = make_person(SID, 4, syn, 4)
    # Hard negative: different person, same surname
    pHardNeg, phHN, _, _ = make_person(SID, 5, syn, 5)
    pHardNeg.full_name = f"Rajesh {last}"  # same surname, different person

    persons = [pShared, pVic1, pVic2, pVic3, pWit1, pHardNeg]
    phones  = [phShared, phVic1, phVic2, phVic3, phWit1, phHN]
    accs    = [accShared]
    vehs    = [vehShared]
    locs    = [make_location(SID, i, syn) for i in range(6)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="CROSS_CASE_LINKAGE",
        seed=seed+800, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, vehicles=vehs, locations=locs,
        events=[
            {"event_type": "NAME_VARIANT_MAP",
             "canonical_id": pShared.id,
             "variants": [name_var1, name_var2, name_var3],
             "cases": ["FIR-S08-001", "FIR-S08-002", "FIR-S08-003"]},
        ]
    )

    roles = [
        make_role(pShared.id, GroundTruthRole.MASTERMIND, pShared.full_name,
                  ["cctns_fir_records.json","telecom_caf_kyc.json","toll_anpr_logs.csv"]),
        make_role(pVic1.id,  GroundTruthRole.BENIGN_PERSON, pVic1.full_name,  ["cctns_fir_records.json"]),
        make_role(pVic2.id,  GroundTruthRole.BENIGN_PERSON, pVic2.full_name,  ["cctns_fir_records.json"]),
        make_role(pVic3.id,  GroundTruthRole.BENIGN_PERSON, pVic3.full_name,  ["cctns_fir_records.json"]),
        make_role(pWit1.id,  GroundTruthRole.BENIGN_PERSON, pWit1.full_name,  ["cctns_fir_records.json"]),
        make_role(pHardNeg.id, GroundTruthRole.DISTRACTOR,  pHardNeg.full_name,["cctns_fir_records.json"]),
    ]

    timeline = [
        make_step(1, SID, "2026-07-10T14:00:00Z", "FIR_001",
                  f"Case 1: Fraud by '{name_var1}' in {locs[0].district}.", [pShared.id, pVic1.id],
                  locs[0].id, ["FIR-S08-001"]),
        make_step(2, SID, "2026-07-10T16:00:00Z", "VEHICLE_SIGHTING_CASE1",
                  f"Vehicle {vehShared.plate} seen at Case-1 location.", [pShared.id, vehShared.id],
                  locs[0].id, ["ANPR-S08-00001"]),
        make_step(3, SID, "2026-07-25T10:00:00Z", "FIR_002",
                  f"Case 2: Extortion by '{name_var2}' in {locs[2].district}.", [pShared.id, pVic2.id],
                  locs[2].id, ["FIR-S08-002"]),
        make_step(4, SID, "2026-07-25T11:30:00Z", "PHONE_TRACE_CASE2",
                  f"Phone {phShared.msisdn} traced near Case-2 scene.", [pShared.id, phShared.id],
                  locs[2].id, ["CDR-S08-00001","TDUMP-S08-0001"]),
        make_step(5, SID, "2026-08-15T13:00:00Z", "FIR_003",
                  f"Case 3: Robbery by '{name_var3}' in {locs[4].district}.", [pShared.id, pVic3.id],
                  locs[4].id, ["FIR-S08-003"]),
        make_step(6, SID, "2026-08-15T14:00:00Z", "VEHICLE_SIGHTING_CASE3",
                  f"Same vehicle {vehShared.plate} at Case-3 location.", [pShared.id, vehShared.id],
                  locs[4].id, ["ANPR-S08-00002"]),
    ]

    edges = [
        # Shared suspect links across 3 FIRs
        make_edge(f"{SID}-E001", pShared.id, "FIR-S08-001", "ACCUSED_IN",    False, [("cctns_fir_records.json","FIR-S08-001")]),
        make_edge(f"{SID}-E002", pShared.id, "FIR-S08-002", "ACCUSED_IN",    False, [("cctns_fir_records.json","FIR-S08-002"),("telecom_cdr_logs.csv","CDR-S08-00001")]),
        make_edge(f"{SID}-E003", pShared.id, "FIR-S08-003", "ACCUSED_IN",    False, [("cctns_fir_records.json","FIR-S08-003")]),
        make_edge(f"{SID}-E004", pShared.id, phShared.id,   "OWNS_PHONE",    True,  [("telecom_caf_kyc.json","CAF-S08-0001")]),
        make_edge(f"{SID}-E005", pShared.id, vehShared.id,  "OWNS_VEHICLE",  True,  [("toll_anpr_logs.csv","ANPR-S08-00001"),("toll_anpr_logs.csv","ANPR-S08-00002")]),
        # Cross-case linkage (same vehicle, same phone)
        make_edge(f"{SID}-E006", "FIR-S08-001", "FIR-S08-002", "CROSS_CASE_VEHICLE_LINK", False,
                  [("toll_anpr_logs.csv","ANPR-S08-00001"),("telecom_cdr_logs.csv","CDR-S08-00001")], 0.85),
        make_edge(f"{SID}-E007", "FIR-S08-002", "FIR-S08-003", "CROSS_CASE_VEHICLE_LINK", False,
                  [("toll_anpr_logs.csv","ANPR-S08-00002"),("cell_tower_dumps.json","TDUMP-S08-0001")], 0.85),
        # Hard negative: pHardNeg has same surname, appears in FIR-001 as witness
        make_edge(f"{SID}-E008", pHardNeg.id, "FIR-S08-001", "WITNESS_IN",   True,  [("cctns_fir_records.json","FIR-S08-001")], 0.05),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Cross-Case Linkage (3 FIRs)",
        scenario_type="CROSS_CASE_LINKAGE",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, "FIR-S08-001", "FIR_CASE", WIN,
        f"FIR-001, FIR-002, and FIR-003 in different districts all mention a person with surname '{last}'. Determine if these cases are linked by a common person and identify their true identity.",
        "HARD", "ENTITY_RESOLUTION")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[pShared.id],
        chain=[
            EntityChainNode(canonical_id=pShared.id, entity_type="PERSON", role_or_label="COMMON_ACCUSED",
                            description=f"Appears as '{name_var1}' (Case 1), '{name_var2}' (Case 2), '{name_var3}' (Case 3)"),
        ],
        edges=edges[:7],
        evidence=[("cctns_fir_records.json","FIR-S08-001"),("cctns_fir_records.json","FIR-S08-002"),
                  ("toll_anpr_logs.csv","ANPR-S08-00001"),("toll_anpr_logs.csv","ANPR-S08-00002"),("telecom_cdr_logs.csv","CDR-S08-00001")],
        timeline=timeline,
        summary=f"Three distinct FIRs share the same suspect under name variations: '{name_var1}', '{name_var2}', '{name_var3}'. Same vehicle ({vehShared.plate}) sighted at two crime scenes. Same phone traced near Case-2. Hard negative: '{pHardNeg.full_name}' shares surname but is a different person (witness in FIR-001).",
        confidence=0.92, fp_cands=[pHardNeg.id],
        alt_hyp=[f"'{pHardNeg.full_name}' (same surname) might be confused as the cross-case suspect."],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", pShared.id, pHardNeg.id, ["same_surname","appeared_in_same_fir","same_district"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"FIR-001 and FIR-002 linked via {pShared.full_name}",
                                 f"{SID}-E006", ["FIR-S08-001","FIR-S08-002","ANPR-S08-00001","CDR-S08-00001"],
                                 ["cctns_fir_records.json","cctns_fir_records.json","toll_anpr_logs.csv","telecom_cdr_logs.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"'{pHardNeg.full_name}' is the cross-case suspect",
            ["same_surname","appeared_in_FIR_001"],
            "pHardNeg is listed as a witness in FIR-001, not accused. Vehicle not linked. Phone not traced to Case-2 or Case-3 scenes.")],
    )
