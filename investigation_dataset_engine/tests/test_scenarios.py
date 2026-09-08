"""
SIH26189 Test Suite v1.1 — Scenario Builder Tests
Tests all 10 scenario builders, router, hard negatives, evidence chains, and alt hypotheses.
"""
import pytest
from generator.scenarios.router import (
    build_scenario, build_all_scenarios, get_scenario_builder, IMPLEMENTED_SCENARIOS
)
from generator.scenarios.base import ScenarioResult


# ── Router tests ─────────────────────────────────────────────────────────────

def test_router_all_10_scenarios_implemented():
    assert IMPLEMENTED_SCENARIOS == list(range(1, 101))


def test_router_invalid_scenario_raises():
    with pytest.raises(ValueError, match="not implemented"):
        get_scenario_builder(101)


def test_router_zero_raises():
    with pytest.raises(ValueError):
        get_scenario_builder(0)


def test_router_no_fallback_to_scenario_10():
    """Requesting scenario 5 must NOT return scenario 10 data."""
    r5  = build_scenario(5)
    r10 = build_scenario(10)
    assert r5.scenario_id != r10.scenario_id
    assert r5.ground_truth.scenario_type != r10.ground_truth.scenario_type


# ── Individual scenario structure tests ─────────────────────────────────────

@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_builds_without_error(sid):
    result = build_scenario(sid)
    assert isinstance(result, ScenarioResult)


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_has_entities_and_edges(sid):
    result = build_scenario(sid)
    gt = result.ground_truth
    assert len(gt.ground_truth_entities) >= 4, f"S{sid}: too few entities"
    assert len(gt.ground_truth_relationships) >= 6, f"S{sid}: too few edges"


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_has_query_and_answer(sid):
    result = build_scenario(sid)
    assert result.query.query_id is not None
    assert result.answer.query_id == result.query.query_id


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_has_hard_negatives(sid):
    result = build_scenario(sid)
    assert len(result.hard_negatives) >= 1, f"S{sid}: no hard negatives"


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_has_evidence_chains(sid):
    result = build_scenario(sid)
    assert len(result.evidence_chains) >= 1, f"S{sid}: no evidence chains"


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_has_alternative_hypotheses(sid):
    result = build_scenario(sid)
    assert len(result.alternative_hypotheses) >= 1, f"S{sid}: no alternative hypotheses"


@pytest.mark.parametrize("sid", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
def test_scenario_context_has_persons_and_phones(sid):
    result = build_scenario(sid)
    ctx = result.context
    assert len(ctx.persons) >= 3
    assert len(ctx.phones) >= 3


# ── Specific scenario semantic tests ─────────────────────────────────────────

def test_s03_recycled_sim_same_msisdn_different_imei():
    """S3: Two phones must share MSISDN but have different IMEIs."""
    r = build_scenario(3)
    phones = r.context.phones
    msisdns = [p.msisdn for p in phones[:2]]
    imeis   = [p.imei   for p in phones[:2]]
    assert msisdns[0] == msisdns[1], "S3: both phones must share MSISDN"
    assert imeis[0]   != imeis[1],   "S3: phones must have different IMEIs"


def test_s03_deactivation_before_reactivation():
    """S3: Original owner's SIM must be deactivated before new user's activation date."""
    r = build_scenario(3)
    ph0 = r.context.phones[0]  # original owner
    ph1 = r.context.phones[1]  # recycled user
    assert ph0.deactivation_date is not None
    assert ph0.deactivation_date < ph1.activation_date


def test_s04_financial_chain_has_4_hop_depth():
    """S4: Minimum hop depth must be >= 4 for multi-hop financial scenario."""
    r = build_scenario(4)
    assert r.summary()["minimum_hop_depth"] >= 4


def test_s05_two_vehicles_same_plate():
    """S5: Two vehicles must share the same plate number."""
    r = build_scenario(5)
    plates = [v.plate for v in r.context.vehicles]
    assert len(plates) >= 2
    assert plates[0] == plates[1], "S5: cloned plate scenario requires matching plates"


def test_s06_tower_dump_has_100plus_msisdns():
    """S6: Tower dump metadata must contain 100+ MSISDNs."""
    r = build_scenario(6)
    tower_events = [e for e in r.context.events if e.get("event_type") == "TOWER_DUMP_METADATA"]
    assert len(tower_events) == 1
    assert tower_events[0]["total_msisdns"] >= 100


def test_s07_four_hop_chain_no_direct_ae_edge():
    """S7: No direct edge between first and last entity (must traverse)."""
    r = build_scenario(7)
    persons = r.context.persons
    if len(persons) >= 5:
        first_id = persons[0].id
        last_id  = persons[4].id
        direct = [e for e in r.ground_truth.ground_truth_relationships
                  if e.source_entity == first_id and e.target_entity == last_id]
        assert len(direct) == 0, "S7: direct A→E edge found — must be discovered via traversal"


def test_s08_name_variants_in_events():
    """S8: Name variant map must exist and contain 3 variants."""
    r = build_scenario(8)
    variant_events = [e for e in r.context.events if e.get("event_type") == "NAME_VARIANT_MAP"]
    assert len(variant_events) == 1
    assert len(variant_events[0]["variants"]) == 3


def test_s10_false_positive_candidate_exists():
    """S10: Answer must explicitly declare a false positive candidate."""
    r = build_scenario(10)
    assert len(r.answer.false_positive_candidates) >= 1


def test_s10_fp_has_no_criminal_cdr_evidence():
    """S10: Evidence chains for the FP candidate should not include CDR evidence."""
    r = build_scenario(10)
    # The evidence chain EC-S10-002 (taxi driver benign) should not cite CDR-S10-00001
    benign_chains = [c for c in r.evidence_chains if "benign" in c.claim.lower() or "taxi" in c.claim.lower()]
    for chain in benign_chains:
        suspicious_records = [rid for rid in chain.supporting_record_ids if "CDR-S10-00001" in rid]
        assert len(suspicious_records) == 0


# ── Hard negative quality tests ───────────────────────────────────────────────

def test_hard_negatives_have_shared_features():
    """All hard negatives must list at least one shared feature."""
    all_results = build_all_scenarios()
    for sid, r in all_results.items():
        for hn in r.hard_negatives:
            assert len(hn.shared_features) >= 1, f"S{sid}: HN {hn.negative_id} has no shared features"
            assert hn.true_label == False


def test_hard_negatives_records_differ():
    """All hard negatives must have different record_a_id and record_b_id."""
    all_results = build_all_scenarios()
    for sid, r in all_results.items():
        for hn in r.hard_negatives:
            assert hn.record_a_id != hn.record_b_id, f"S{sid}: HN {hn.negative_id} has same A and B"


# ── Evidence chain quality tests ─────────────────────────────────────────────

def test_evidence_chains_source_diversity():
    """Evidence chains for multi-source claims should have diversity >= 2."""
    r = build_scenario(7)  # S7 has multi-source chains by design
    for chain in r.evidence_chains:
        if "full chain" in chain.claim.lower():
            assert chain.source_diversity >= 3, "S7: full chain must span 3+ source types"


def test_evidence_chains_have_supporting_records():
    """Every evidence chain must have at least one supporting record ID."""
    all_results = build_all_scenarios()
    for sid, r in all_results.items():
        for chain in r.evidence_chains:
            assert len(chain.supporting_record_ids) >= 1, f"S{sid}: empty evidence chain {chain.chain_id}"


# ── Reproducibility ───────────────────────────────────────────────────────────

def test_scenario_reproducibility_same_seed():
    """Two runs with same seed must produce identical GT entity counts."""
    r1 = build_all_scenarios(seed=26189)
    r2 = build_all_scenarios(seed=26189)
    for sid in IMPLEMENTED_SCENARIOS:
        assert len(r1[sid].ground_truth.ground_truth_entities) == \
               len(r2[sid].ground_truth.ground_truth_entities), \
               f"S{sid}: entity count differs across runs with same seed"


def test_different_seeds_produce_different_names():
    """Different seeds should produce different person names."""
    r1 = build_scenario(1, seed=26189)
    r2 = build_scenario(1, seed=99999)
    names1 = [p.full_name for p in r1.context.persons]
    names2 = [p.full_name for p in r2.context.persons]
    assert names1 != names2, "Different seeds must produce different person names"


# ── GT ground truth isolation check ─────────────────────────────────────────

FORBIDDEN_IN_OBSERVED = ["MASTERMIND", "MULE", "SPOTTER", "GROUND_TRUTH",
                         "TRUE_LABEL", "CORRECT_ANSWER", "TARGET_SUSPECT"]

def test_gt_roles_not_in_scenario_context():
    """ScenarioContext (passed to serializers) must not contain GT role labels."""
    all_results = build_all_scenarios()
    for sid, r in all_results.items():
        ctx_str = str(r.context)
        for forbidden in FORBIDDEN_IN_OBSERVED:
            assert forbidden not in ctx_str, \
                f"S{sid}: forbidden term '{forbidden}' found in ScenarioContext"
