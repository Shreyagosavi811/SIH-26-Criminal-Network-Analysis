"""
Entity Resolution Benchmark Builder
Generates positive and negative record pairs from observed data.

Positive: same canonical entity referenced in two different sources.
Negative (easy): clearly different entities, no shared features.
Negative (hard): different entities sharing name/address/phone similarity.
"""
import difflib
import random
from typing import Any, Dict, List, Tuple

from benchmark.models import ERExample, ERInput, MatchFeatures


def _name_sim(a: str, b: str) -> float:
    return round(difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio(), 3)


def _addr_sim(a: str, b: str) -> float:
    return round(difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio(), 3)


def build_entity_resolution(
    gt_manifest: Dict[str, Any],
    caf_records: List[Dict[str, Any]],
    cdr_records: List[Dict[str, Any]],
    anpr_records: List[Dict[str, Any]],
    hard_negatives_gt: List[Dict[str, Any]],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[ERExample]:
    examples: List[ERExample] = []
    pair_counter = [0]

    def next_id():
        pair_counter[0] += 1
        return f"ER-{scenario_id}-{pair_counter[0]:06d}"

    gt_entities = gt_manifest.get("ground_truth_entities", [])
    gt_edges = gt_manifest.get("ground_truth_relationships", [])

    # Build canonical_id → list of CAF records (same person appears across sources)
    caf_by_phone: Dict[str, List[Dict]] = {}
    for rec in caf_records:
        phone = rec.get("phone_number", "")
        caf_by_phone.setdefault(phone, []).append(rec)

    # ── POSITIVE PAIRS: same entity in CAF (2 sources or via name/phone) ─────
    # Each GT entity that has a phone — pair CAF record with CDR record
    for ent in gt_entities:
        canon_id = ent["canonical_id"]
        real_name = ent.get("real_name", "")
        role = ent.get("role_in_scenario", "")

        # Find matching CAF records by name (not by canonical ID — safe)
        matching_cafs = [r for r in caf_records if r.get("subscriber_name", "").lower() == real_name.lower()]
        if len(matching_cafs) < 1:
            continue

        caf_a = matching_cafs[0]
        caf_phone = caf_a.get("phone_number", "")

        # Find a CDR record mentioning this phone (same person, different source)
        matching_cdrs = [r for r in cdr_records if r.get("caller_phone") == caf_phone]
        if matching_cdrs:
            cdr_rec = matching_cdrs[0]
            ex = ERExample(
                pair_id=next_id(),
                input=ERInput(
                    record_a_id=caf_a["caf_id"],
                    record_b_id=cdr_rec["cdr_id"],
                    entity_type="PERSON",
                    source_a="TELECOM_CAF",
                    source_b="TELECOM_CDR",
                    match_features={"name_similarity": 1.0, "phone_match": True, "source_agreement": 2},
                    attributes_a={"name": caf_a["subscriber_name"], "phone": caf_phone, "district": caf_a.get("district", "")},
                    attributes_b={"phone": cdr_rec.get("caller_phone", ""), "timestamp": cdr_rec.get("timestamp", "")},
                ),
                label=True,
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio, "negative_type": "positive",
                          "canonical_id_hidden": canon_id},  # hidden — not in input
            )
            examples.append(ex)

        # Pair with ANPR if ANPR records exist (same scenario — different source)
        matching_anpr = [r for r in anpr_records if r.get("vehicle_id_or_plate")]
        if matching_anpr and caf_a:
            anpr_rec = matching_anpr[0]
            ex = ERExample(
                pair_id=next_id(),
                input=ERInput(
                    record_a_id=caf_a["caf_id"],
                    record_b_id=anpr_rec["anpr_id"],
                    entity_type="PERSON",
                    source_a="TELECOM_CAF",
                    source_b="TOLL_ANPR",
                    match_features={"name_similarity": 0.0, "phone_match": False, "source_agreement": 1},
                    attributes_a={"name": caf_a["subscriber_name"], "district": caf_a.get("district", "")},
                    attributes_b={"plate": anpr_rec.get("vehicle_id_or_plate", ""), "timestamp": anpr_rec.get("timestamp", "")},
                ),
                label=True,
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio, "negative_type": "positive",
                          "canonical_id_hidden": canon_id},
            )
            examples.append(ex)

    # ── HARD NEGATIVE PAIRS: from GT hard_negatives list ────────────────────
    for hn in hard_negatives_gt:
        shared = hn.get("shared_features", [])
        rec_a_id = hn.get("record_a_id", "")
        rec_b_id = hn.get("record_b_id", "")
        # Find CAF records for these IDs
        caf_a_list = [r for r in caf_records if r.get("caf_id") == rec_a_id or rec_a_id.startswith("PER-")]
        caf_b_list = [r for r in caf_records if r.get("caf_id") == rec_b_id or rec_b_id.startswith("PER-")]

        # Use names from GT entities if we can match
        ent_a = next((e for e in gt_entities if e["canonical_id"] == rec_a_id), None)
        ent_b = next((e for e in gt_entities if e["canonical_id"] == rec_b_id), None)

        if ent_a and ent_b:
            name_a = ent_a.get("real_name", "")
            name_b = ent_b.get("real_name", "")
            name_s = _name_sim(name_a, name_b)
            # Build synthetic CAF records for these GT entities
            caf_a = next((r for r in caf_records if r.get("subscriber_name", "").lower() == name_a.lower()), None)
            caf_b = next((r for r in caf_records if r.get("subscriber_name", "").lower() == name_b.lower()), None)

            rec_a_id_used = caf_a["caf_id"] if caf_a else f"OBS-{rec_a_id}"
            rec_b_id_used = caf_b["caf_id"] if caf_b else f"OBS-{rec_b_id}"

            ex = ERExample(
                pair_id=next_id(),
                input=ERInput(
                    record_a_id=rec_a_id_used,
                    record_b_id=rec_b_id_used,
                    entity_type="PERSON",
                    source_a="TELECOM_CAF",
                    source_b="TELECOM_CAF",
                    match_features={"name_similarity": name_s, "phone_match": False,
                                    "address_similarity": 0.5 if "similar_address" in shared else 0.1,
                                    "shared_features": shared},
                    attributes_a={"name": name_a},
                    attributes_b={"name": name_b},
                ),
                label=False,  # Different entities despite shared features
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio, "negative_type": "hard",
                          "shared_features": shared,
                          "canonical_ids_hidden": [rec_a_id, rec_b_id]},
            )
            examples.append(ex)

    # ── EASY NEGATIVE PAIRS: from structurally unrelated CAF records ──────────
    if len(caf_records) >= 4:
        chunk = caf_records[-2:]  # Last 2 records are typically noise-injected distractors
        for i in range(min(len(chunk)-1, 3)):
            r_a = chunk[i]
            r_b = chunk[(i+1) % len(chunk)]
            if r_a.get("caf_id") == r_b.get("caf_id"):
                continue
            name_a = r_a.get("subscriber_name", "")
            name_b = r_b.get("subscriber_name", "")
            ex = ERExample(
                pair_id=next_id(),
                input=ERInput(
                    record_a_id=r_a["caf_id"],
                    record_b_id=r_b["caf_id"],
                    entity_type="PERSON",
                    source_a="TELECOM_CAF",
                    source_b="TELECOM_CAF",
                    match_features={"name_similarity": _name_sim(name_a, name_b),
                                    "phone_match": False, "source_agreement": 0},
                    attributes_a={"name": name_a, "phone": r_a.get("phone_number", "")},
                    attributes_b={"name": name_b, "phone": r_b.get("phone_number", "")},
                ),
                label=False,
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio, "negative_type": "easy"},
            )
            examples.append(ex)

    return examples
