"""S5 — Vehicle Tracking / Cloned Plate Detection
Two vehicles share the same plate (one cloned). Impossible movement detected when both appear
simultaneously in distant locations. Spatial validator must flag it.
ML purpose: Anomaly Detection, Temporal/Spatial Reasoning, Entity Resolution, FP Detection.
"""
from generator.attributes import DemographicSynthesizer
from generator.context import ScenarioContext, VehicleCtx
from generator.models import GroundTruthManifest, GroundTruthRole, EntityChainNode
from generator.scenarios.base import ScenarioResult
from generator.scenarios.helpers import (
    make_person, make_location, make_role, make_edge, make_step,
    make_query, make_answer, build_evidence_chain, build_hard_negative, build_alt_hyp,
)

SID = "S05"
WIN = ("2026-08-18T00:00:00Z", "2026-08-18T23:59:59Z")


def build(seed: int = 26189, scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    syn = DemographicSynthesizer(seed + 500)

    p0, ph0, acc0, veh0 = make_person(SID, 0, syn, 0, acc_idx=0, veh_idx=0)   # legitimate owner
    p1, ph1, acc1, _    = make_person(SID, 1, syn, 1, acc_idx=1)               # cloner/criminal

    # Cloned plate: same plate as veh0 but on a different physical vehicle
    cloned_plate = veh0.plate
    veh_clone = VehicleCtx(
        id=f"VEH-{SID}-099", owner_id=p1.id,
        plate=cloned_plate,                       # SAME plate as veh0
        make_model="Maruti Swift Silver 2019",     # different model
        color="Silver",
    )

    # OCR near-miss plate (one digit transposed) for noise
    ocr_plate = cloned_plate[:-2] + cloned_plate[-1] + cloned_plate[-2]

    p2, ph2, _, _ = make_person(SID, 2, syn, 2)  # witness at crime scene
    p3, ph3, _, _ = make_person(SID, 3, syn, 3)  # benign commuter with similar plate

    persons = [p0, p1, p2, p3]
    phones  = [ph0, ph1, ph2, ph3]
    accs    = [acc0, acc1]
    vehs    = [veh0, veh_clone]
    # Locations: far apart (Delhi ↔ Gurugram) to trigger impossible movement
    locs    = [make_location(SID, i, syn) for i in range(6)]

    ctx = ScenarioContext(
        scenario_id=SID, scenario_type="VEHICLE_CLONE_DETECTION",
        seed=seed+500, investigation_window={"start": WIN[0], "end": WIN[1]},
        persons=persons, accounts=accs, phones=phones, vehicles=vehs, locations=locs,
    )

    roles = [
        make_role(p0.id, GroundTruthRole.BENIGN_PERSON, p0.full_name, ["toll_anpr_logs.csv"]),
        make_role(p1.id, GroundTruthRole.MASTERMIND,    p1.full_name, ["cctns_fir_records.json","toll_anpr_logs.csv","telecom_cdr_logs.csv"]),
        make_role(p2.id, GroundTruthRole.BENIGN_PERSON, p2.full_name, ["cctns_fir_records.json"]),
        make_role(p3.id, GroundTruthRole.DISTRACTOR,    p3.full_name, ["toll_anpr_logs.csv"]),
    ]

    # Two simultaneous sightings of same plate 60km apart = impossible
    timeline = [
        make_step(1, SID, "2026-08-18T09:00:00Z", "LEGITIMATE_VEHICLE_SIGHTING",
                  f"Legitimate vehicle {cloned_plate} seen at Connaught Place toll.", [p0.id, veh0.id],
                  locs[0].id, ["ANPR-S05-00001"]),
        make_step(2, SID, "2026-08-18T09:10:00Z", "CLONED_PLATE_SIGHTING",
                  f"SAME plate {cloned_plate} seen at Gurugram toll 35km away (10 min gap = impossible).", [p1.id, veh_clone.id],
                  locs[1].id, ["ANPR-S05-00002"]),
        make_step(3, SID, "2026-08-18T09:30:00Z", "CRIME_EVENT",
                  f"Robbery reported near Gurugram. Suspect vehicle plate: {cloned_plate}.", [p1.id],
                  locs[1].id, ["FIR-S05-001"]),
        make_step(4, SID, "2026-08-18T10:00:00Z", "OCR_NOISE_SIGHTING",
                  f"Plate {ocr_plate} (OCR error of {cloned_plate}) seen at Faridabad.", [p3.id],
                  locs[3].id, ["ANPR-S05-00003"]),
        make_step(5, SID, "2026-08-18T11:00:00Z", "SUBSEQUENT_SIGHTING_CRIMINAL",
                  f"Clone vehicle {cloned_plate} seen again at Manesar after crime.", [p1.id, veh_clone.id],
                  locs[4].id, ["ANPR-S05-00004"]),
        make_step(6, SID, "2026-08-18T12:00:00Z", "LEGITIMATE_OWNER_ALIBI",
                  f"Legitimate owner {p0.full_name} confirms continuous presence at work in New Delhi.", [p0.id],
                  locs[0].id, ["FNOTE-S05-0001"]),
    ]

    edges = [
        make_edge(f"{SID}-E001", p0.id,  veh0.id,     "LEGALLY_OWNS",       True,  [("toll_anpr_logs.csv","ANPR-S05-00001")], 1.0),
        make_edge(f"{SID}-E002", p1.id,  veh_clone.id,"OPERATES_CLONE",     True,  [("toll_anpr_logs.csv","ANPR-S05-00002"),("cctns_fir_records.json","FIR-S05-001")], 0.93),
        make_edge(f"{SID}-E003", veh0.id, veh_clone.id,"PLATE_CLONED_FROM", False, [("toll_anpr_logs.csv","ANPR-S05-00001"),("toll_anpr_logs.csv","ANPR-S05-00002")], 0.96),
        make_edge(f"{SID}-E004", p1.id,  locs[1].id,  "PRESENT_AT_CRIME",   False, [("cctns_fir_records.json","FIR-S05-001"),("toll_anpr_logs.csv","ANPR-S05-00002")]),
        make_edge(f"{SID}-E005", p0.id,  locs[0].id,  "ALIBI_CONFIRMED",    True,  [("field_intelligence_notes.txt","FNOTE-S05-0001")], 1.0),
        # OCR distractor
        make_edge(f"{SID}-E006", p3.id,  locs[3].id,  "BENIGN_TRAVEL",      True,  [("toll_anpr_logs.csv","ANPR-S05-00003")], 0.05),
        # Temporal anomaly edge (impossible movement)
        make_edge(f"{SID}-E007", veh0.id, locs[1].id, "IMPOSSIBLE_MOVEMENT_ANOMALY", False,
                  [("toll_anpr_logs.csv","ANPR-S05-00001"),("toll_anpr_logs.csv","ANPR-S05-00002")], 0.0),
    ]

    gt = GroundTruthManifest(
        scenario_id=SID, scenario_name="Vehicle Tracking and Cloned Plate Detection",
        scenario_type="VEHICLE_CLONE_DETECTION",
        master_timeline=timeline, ground_truth_entities=roles, ground_truth_relationships=edges,
    )

    query = make_query(f"QRY-{SID}-001", SID, cloned_plate, "VEHICLE", WIN,
        f"Plate {cloned_plate} appears at two locations 35km apart within 10 minutes. Determine if this is a cloned plate, identify the criminal vehicle, and clear the legitimate vehicle owner.",
        "HARD", "ANOMALY_DETECTION")

    answer = make_answer(f"QRY-{SID}-001", SID, targets=[p1.id, veh_clone.id],
        chain=[
            EntityChainNode(canonical_id=veh0.id, entity_type="VEHICLE", role_or_label="LEGITIMATE_VEHICLE", description=f"Legal owner {p0.full_name}, confirmed alibi in New Delhi"),
            EntityChainNode(canonical_id=veh_clone.id, entity_type="VEHICLE", role_or_label="CLONED_PLATE_VEHICLE", description=f"Criminal vehicle operated by {p1.full_name}"),
            EntityChainNode(canonical_id=p1.id, entity_type="PERSON", role_or_label="SUSPECT", description="Operator of cloned plate vehicle at crime scene"),
        ],
        edges=edges[:6],
        evidence=[("toll_anpr_logs.csv","ANPR-S05-00001"),("toll_anpr_logs.csv","ANPR-S05-00002"),("cctns_fir_records.json","FIR-S05-001")],
        timeline=timeline,
        summary=f"Plate {cloned_plate} sighted simultaneously 35km apart (impossible). Gurugram sighting linked to crime. New Delhi sighting (legitimate owner {p0.full_name}) confirmed by alibi. OCR plate {ocr_plate} at Faridabad is a separate benign vehicle.",
        confidence=0.95, fp_cands=[p0.id, p3.id],
        alt_hyp=["OCR misread might explain one sighting — but impossible time/distance gap rules out single-vehicle explanation."],
    )

    return ScenarioResult(SID, gt, ctx, query, answer,
        hard_negatives=[build_hard_negative(f"HN-{SID}-001", veh0.id, veh_clone.id, ["same_plate","similar_color_class","same_location_area"]),
                        build_hard_negative(f"HN-{SID}-002", cloned_plate, ocr_plate, ["1_digit_transposition","same_rto_code"])],
        evidence_chains=[
            build_evidence_chain(f"EC-{SID}-001", f"Plate {cloned_plate} is cloned",
                                 f"{SID}-E003", ["ANPR-S05-00001","ANPR-S05-00002"], ["toll_anpr_logs.csv","toll_anpr_logs.csv"]),
        ],
        alternative_hypotheses=[build_alt_hyp(f"AH-{SID}-001",
            f"Legitimate owner {p0.full_name} committed crime using own vehicle",
            ["same_plate"],
            "Alibi confirmed. Legitimate vehicle sighted in New Delhi at same timestamp as crime in Gurugram — physically impossible.")],
    )
