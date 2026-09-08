"""
Link Prediction, Multi-Hop, Anomaly, Temporal, False Positive,
and Evidence Retrieval Benchmark Builders.
All read from output/ files via ScenarioLoader — no generator imports.
"""
import random
from typing import Any, Dict, List, Optional, Tuple

from benchmark.models import (
    LPExample, LPInput, MHExample, MHInput,
    ADExample, ADInput, TRExample, TRInput,
    FPExample, FPInput, EVExample, EVInput,
)


# ── Link Prediction ───────────────────────────────────────────────────────────

def build_link_prediction(
    gt_manifest: Dict[str, Any],
    evidence_chains: List[Dict[str, Any]],
    hard_negatives_gt: List[Dict[str, Any]],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[LPExample]:
    examples: List[LPExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"LP-{scenario_id}-{counter[0]:06d}"

    edges = gt_manifest.get("ground_truth_relationships", [])
    entities = {e["canonical_id"]: e for e in gt_manifest.get("ground_truth_entities", [])}

    # POSITIVE: every GT edge with evidence
    for edge in edges:
        src = edge.get("source_entity", "")
        tgt = edge.get("target_entity", "")
        rel = edge.get("relationship_type", "UNKNOWN")
        ev_path = edge.get("evidence_path", [])
        rids = [ep.get("record_id", "") for ep in ev_path]
        gt_conf = edge.get("ground_truth_confidence", 0.9)

        # Skip distractor edges (low confidence < 0.10)
        is_distractor = gt_conf < 0.15
        label = 0 if is_distractor else 1

        ex = LPExample(
            candidate_id=next_id(),
            input=LPInput(
                source_entity=src,
                target_entity=tgt,
                relation_type=rel,
                supporting_record_ids=rids,
            ),
            label=label,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio,
                      "negative_type": "hard_distractor" if is_distractor else "positive",
                      "gt_confidence": gt_conf},
        )
        examples.append(ex)

    # HARD NEGATIVE: pairs from hard_negatives_gt
    for hn in hard_negatives_gt:
        shared = hn.get("shared_features", [])
        ex = LPExample(
            candidate_id=next_id(),
            input=LPInput(
                source_entity=hn.get("record_a_id", ""),
                target_entity=hn.get("record_b_id", ""),
                relation_type="SUSPECTED_ASSOCIATE",
                supporting_record_ids=[],
            ),
            label=0,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "negative_type": "hard",
                      "shared_features": shared},
        )
        examples.append(ex)

    # EASY NEGATIVE: cross-entity edges that definitely don't exist
    entity_ids = list(entities.keys())
    existing = {(e["source_entity"], e["target_entity"]) for e in edges}
    for i in range(min(3, len(entity_ids) - 1)):
        src_id = entity_ids[i]
        tgt_id = entity_ids[(i + 3) % len(entity_ids)]
        if (src_id, tgt_id) not in existing and src_id != tgt_id:
            ex = LPExample(
                candidate_id=next_id(),
                input=LPInput(
                    source_entity=src_id,
                    target_entity=tgt_id,
                    relation_type="SUSPECTED_ASSOCIATE",
                    supporting_record_ids=[],
                ),
                label=0,
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio, "negative_type": "easy"},
            )
            examples.append(ex)

    return examples


# ── Multi-Hop ─────────────────────────────────────────────────────────────────

def build_multi_hop(
    gt_manifest: Dict[str, Any],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[MHExample]:
    examples: List[MHExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"MH-{scenario_id}-{counter[0]:06d}"

    edges = gt_manifest.get("ground_truth_relationships", [])
    entities = {e["canonical_id"]: e for e in gt_manifest.get("ground_truth_entities", [])}

    # Build adjacency map
    adj: Dict[str, List[str]] = {}
    for edge in edges:
        src = edge.get("source_entity", "")
        tgt = edge.get("target_entity", "")
        adj.setdefault(src, []).append(tgt)

    entity_ids = list(entities.keys())

    def bfs_path(start: str, end: str, max_depth: int = 6) -> Optional[List[str]]:
        from collections import deque
        q = deque([[start]])
        visited = {start}
        while q:
            path = q.popleft()
            node = path[-1]
            if node == end:
                return path
            if len(path) >= max_depth + 1:
                continue
            for nxt in adj.get(node, []):
                if nxt not in visited:
                    visited.add(nxt)
                    q.append(path + [nxt])
        return None

    # Generate hop examples across entity pairs
    generated_pairs = set()
    for i, src_id in enumerate(entity_ids):
        for j, tgt_id in enumerate(entity_ids):
            if src_id == tgt_id or (src_id, tgt_id) in generated_pairs:
                continue
            path = bfs_path(src_id, tgt_id)
            if path and 2 <= len(path) - 1 <= 6:
                hop_count = len(path) - 1
                ev_rids = []
                for edge in edges:
                    for k in range(len(path) - 1):
                        if edge["source_entity"] == path[k] and edge["target_entity"] == path[k+1]:
                            ev_rids.extend([ep.get("record_id","") for ep in edge.get("evidence_path",[])])

                ex = MHExample(
                    query_id=next_id(),
                    input=MHInput(
                        source_record_id=src_id,
                        target_record_id=tgt_id,
                        max_hops=hop_count + 1,
                    ),
                    label=True,
                    hop_count=hop_count,
                    metadata={
                        "scenario_id": scenario_id,
                        "noise_level": noise_level,
                        "noise_ratio": noise_ratio,
                        "hop_count": hop_count,
                        "valid_path_hidden": path,           # HIDDEN — eval only
                        "supporting_evidence_hidden": list(set(ev_rids)),
                    },
                )
                examples.append(ex)
                generated_pairs.add((src_id, tgt_id))

    # NEGATIVE multi-hop: pairs with no reachable path
    for i, src_id in enumerate(entity_ids):
        for j, tgt_id in enumerate(entity_ids):
            if src_id == tgt_id or (src_id, tgt_id) in generated_pairs:
                continue
            path = bfs_path(src_id, tgt_id)
            if path is None and len(examples) < 50:
                ex = MHExample(
                    query_id=next_id(),
                    input=MHInput(
                        source_record_id=src_id,
                        target_record_id=tgt_id,
                        max_hops=4,
                    ),
                    label=False,
                    hop_count=0,
                    metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                              "noise_ratio": noise_ratio, "negative_type": "no_path",
                              "hop_count": 0},
                )
                examples.append(ex)
                generated_pairs.add((src_id, tgt_id))

    return examples


# ── Anomaly Detection ─────────────────────────────────────────────────────────

def build_anomaly_detection(
    gt_manifest: Dict[str, Any],
    bank_txns: List[Dict[str, Any]],
    cdr_records: List[Dict[str, Any]],
    anpr_records: List[Dict[str, Any]],
    fiu_alerts: List[Dict[str, Any]],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[ADExample]:
    examples: List[ADExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"AD-{scenario_id}-{counter[0]:06d}"

    entities = gt_manifest.get("ground_truth_entities", [])

    # POSITIVE ANOMALIES: FIU alerts are always anomalous signals
    for alert in fiu_alerts:
        acc = alert.get("account_id", "")
        cat = alert.get("alert_category", "")
        risk = alert.get("risk_indicator", "")
        ex = ADExample(
            anomaly_id=next_id(),
            input=ADInput(
                entity_record_id=alert.get("alert_id", ""),
                entity_type="ACCOUNT",
                domain="financial",
                observations=[{"type": "fiu_alert", "category": cat, "risk": risk}],
                evidence_ids=[alert.get("alert_id", "")],
            ),
            label=1,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "alert_category": cat},
        )
        examples.append(ex)

    # HIGH-VALUE TRANSACTIONS: suspicious if amount > 50000
    high_val = [t for t in bank_txns if float(t.get("amount", 0)) > 50000]
    low_val  = [t for t in bank_txns if float(t.get("amount", 0)) < 5000]
    for txn in high_val[:5]:
        ex = ADExample(
            anomaly_id=next_id(),
            input=ADInput(
                entity_record_id=txn.get("transaction_id", ""),
                entity_type="TRANSACTION",
                domain="financial",
                observations=[{"type": "high_value", "amount": txn.get("amount"),
                               "type_": txn.get("transaction_type")}],
                evidence_ids=[txn.get("transaction_id", "")],
            ),
            label=1,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "negative_type": "positive_anomaly"},
        )
        examples.append(ex)

    # BENIGN HIGH-VALUE (hard negative): benign_ prefixed
    benign_txns = [t for t in bank_txns if "CBS-BENIGN" in t.get("transaction_id", "")]
    for txn in benign_txns[:3]:
        ex = ADExample(
            anomaly_id=next_id(),
            input=ADInput(
                entity_record_id=txn.get("transaction_id", ""),
                entity_type="TRANSACTION",
                domain="financial",
                observations=[{"type": "benign_transfer", "remark": txn.get("reference_text"),
                               "amount": txn.get("amount")}],
                evidence_ids=[txn.get("transaction_id", "")],
            ),
            label=0,    # Normal
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "negative_type": "hard_benign_high_value"},
        )
        examples.append(ex)

    # NORMAL CDR behavior (frequent caller, benign)
    if low_val:
        txn = low_val[0]
        ex = ADExample(
            anomaly_id=next_id(),
            input=ADInput(
                entity_record_id=txn.get("transaction_id", ""),
                entity_type="TRANSACTION",
                domain="financial",
                observations=[{"type": "routine_payment", "amount": txn.get("amount")}],
                evidence_ids=[txn.get("transaction_id", "")],
            ),
            label=0,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "negative_type": "easy_normal"},
        )
        examples.append(ex)

    return examples


# ── Temporal Reasoning ────────────────────────────────────────────────────────

def build_temporal_reasoning(
    gt_manifest: Dict[str, Any],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[TRExample]:
    examples: List[TRExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"TR-{scenario_id}-{counter[0]:06d}"

    timeline = gt_manifest.get("master_timeline", [])

    # Generate BEFORE/AFTER pairs from adjacent timeline steps
    for i in range(len(timeline) - 1):
        ev_a = timeline[i]
        ev_b = timeline[i + 1]
        ts_a = ev_a.get("timestamp", "")
        ts_b = ev_b.get("timestamp", "")
        if not ts_a or not ts_b:
            continue

        # BEFORE: a happens before b (label = BEFORE)
        ex = TRExample(
            query_id=next_id(),
            input=TRInput(
                event_a_id=ev_a.get("event_id", f"EVT-{i}"),
                event_b_id=ev_b.get("event_id", f"EVT-{i+1}"),
                event_a_timestamp=ts_a,
                event_b_timestamp=ts_b,
                relation_choices=["BEFORE", "AFTER", "OVERLAP", "UNKNOWN"],
            ),
            label="BEFORE",
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio,
                      "step_a": ev_a.get("step"), "step_b": ev_b.get("step")},
        )
        examples.append(ex)

    # AFTER: reverse pair
    if len(timeline) >= 2:
        ev_a = timeline[-1]
        ev_b = timeline[0]
        ex = TRExample(
            query_id=next_id(),
            input=TRInput(
                event_a_id=ev_a.get("event_id", "EVT-LAST"),
                event_b_id=ev_b.get("event_id", "EVT-FIRST"),
                event_a_timestamp=ev_a.get("timestamp", ""),
                event_b_timestamp=ev_b.get("timestamp", ""),
            ),
            label="AFTER",
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "relation_type": "AFTER"},
        )
        examples.append(ex)

    return examples


# ── False Positive Discrimination ─────────────────────────────────────────────

def build_false_positive(
    gt_manifest: Dict[str, Any],
    alt_hypotheses: List[Dict[str, Any]],
    hard_negatives_gt: List[Dict[str, Any]],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[FPExample]:
    examples: List[FPExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"FP-{scenario_id}-{counter[0]:06d}"

    entities = {e["canonical_id"]: e for e in gt_manifest.get("ground_truth_entities", [])}
    timeline = gt_manifest.get("master_timeline", [])

    # GENUINE SUSPECTS: MASTERMIND/ASSOCIATE/SPOTTER/MULE
    criminal_roles = {"MASTERMIND", "ASSOCIATE", "SPOTTER", "MULE"}
    benign_roles   = {"DISTRACTOR", "BENIGN_PERSON"}

    for ent in gt_manifest.get("ground_truth_entities", []):
        role = ent.get("role_in_scenario", "")
        canon_id = ent.get("canonical_id", "")
        # Find supporting evidence from timeline
        ev_rids = []
        for step in timeline:
            if canon_id in step.get("entity_ids", []):
                ev_rids.extend(step.get("supporting_evidence_records", []))

        if role in criminal_roles:
            ex = FPExample(
                case_id=next_id(),
                input=FPInput(
                    case_id=next_id(),
                    candidate_record_id=f"OBS-{canon_id}",
                    suspicious_features=["criminal_communication", "financial_anomaly"],
                    supporting_evidence_ids=ev_rids[:3],
                    contradicting_evidence_ids=[],
                    observations=[{"role_observed": "SUSPICIOUS_BEHAVIOR",
                                   "sources": ent.get("associated_sources", [])}],
                ),
                label=1,  # genuinely suspicious
                alternative_hypothesis="",
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio,
                          "canonical_id_hidden": canon_id},
            )
            examples.append(ex)

        elif role in benign_roles:
            # FALSE POSITIVE: looks suspicious but is benign
            alt_hyp = alt_hypotheses[0].get("hypothesis", "BENIGN_ACTIVITY") if alt_hypotheses else "BENIGN_ACTIVITY"
            contra_rids = []
            for ah in alt_hypotheses:
                contra_rids.extend(ah.get("supporting_evidence", []))
            ex = FPExample(
                case_id=next_id(),
                input=FPInput(
                    case_id=next_id(),
                    candidate_record_id=f"OBS-{canon_id}",
                    suspicious_features=["co_located", "similar_pattern"],
                    supporting_evidence_ids=ev_rids[:2],
                    contradicting_evidence_ids=contra_rids[:2],
                    observations=[{"role_observed": "SUPERFICIALLY_SUSPICIOUS",
                                   "sources": ent.get("associated_sources", [])}],
                ),
                label=0,  # false positive
                alternative_hypothesis=alt_hyp,
                metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                          "noise_ratio": noise_ratio,
                          "canonical_id_hidden": canon_id},
            )
            examples.append(ex)

    return examples


# ── Evidence Retrieval ────────────────────────────────────────────────────────

def build_evidence_retrieval(
    gt_manifest: Dict[str, Any],
    evidence_chains: List[Dict[str, Any]],
    scenario_id: str,
    noise_level: int,
    noise_ratio: float,
    rng: random.Random,
) -> List[EVExample]:
    examples: List[EVExample] = []
    counter = [0]

    def next_id():
        counter[0] += 1
        return f"EV-{scenario_id}-{counter[0]:06d}"

    for chain in evidence_chains:
        claim    = chain.get("claim", "")
        rids     = chain.get("supporting_record_ids", [])
        sources  = chain.get("source_types", [])

        ex = EVExample(
            claim_id=next_id(),
            input=EVInput(
                claim_id=next_id(),
                claim=claim,
                candidate_record_ids=rids,
                source_types=sources,
            ),
            label=1,  # supported claim
            supporting_record_ids=rids,
            metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                      "noise_ratio": noise_ratio, "source_diversity": chain.get("source_diversity", 1)},
        )
        examples.append(ex)

    # UNSUPPORTED CLAIM (negative): invented claim with no evidence
    ex = EVExample(
        claim_id=next_id(),
        input=EVInput(
            claim_id=next_id(),
            claim="Suspect communicated with a foreign agent",
            candidate_record_ids=[],
            source_types=[],
        ),
        label=0,
        supporting_record_ids=[],
        metadata={"scenario_id": scenario_id, "noise_level": noise_level,
                  "noise_ratio": noise_ratio, "negative_type": "unsupported"},
    )
    examples.append(ex)

    return examples
