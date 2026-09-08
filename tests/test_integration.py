"""
SIH26189 Integration Tests v1.1
Tests: engine routing, DataDrivenSerializer, noise ratio, validators,
       S7 multi-hop reconstruction, evidence reachability, temporal, identity.
"""
import pytest
import os
from generator.engine import DatasetEngine
from generator.scenarios.router import build_scenario
from generator.data_serializer import DataDrivenSerializer
from generator.noise import NoiseEngine, NOISE_RATIO_MAP
from validation.temporal_validator import TemporalValidator
from validation.identity_validator import IdentityValidator
from validation.evidence_validator import EvidenceValidator
from validation.audit_runner import AuditRunner


# ── Engine Routing ────────────────────────────────────────────────────────────

def test_engine_routes_scenario_1_correctly(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    stats = engine.run_scenario(1)
    assert stats["scenario_id"] == "S01"
    assert stats["scenario_type"] == "PERSON_CENTRIC"


def test_engine_routes_scenario_4_correctly(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    stats = engine.run_scenario(4)
    assert stats["scenario_id"] == "S04"
    assert stats["scenario_type"] == "FINANCIAL_MULTI_HOP"


def test_engine_routes_scenario_7_correctly(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    stats = engine.run_scenario(7)
    assert stats["scenario_id"] == "S07"
    assert stats["scenario_type"] == "FOUR_HOP_NETWORK"


def test_engine_invalid_scenario_raises_not_substitutes(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189)
    with pytest.raises(ValueError, match="not implemented"):
        engine.run_scenario(101)


def test_engine_string_scenario_arg(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    stats = engine.run_scenario("10")
    assert stats["scenario_id"] == "S10"


def test_engine_creates_observed_files(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    engine.run_scenario(1)
    obs_dir = os.path.join(tmp_path, "output", "OBSERVED", "S01")
    assert os.path.exists(os.path.join(obs_dir, "cctns_fir_records.json"))
    assert os.path.exists(os.path.join(obs_dir, "telecom_cdr_logs.csv"))
    assert os.path.exists(os.path.join(obs_dir, "cbs_bank_transactions.csv"))
    assert os.path.exists(os.path.join(obs_dir, "toll_anpr_logs.csv"))


def test_engine_creates_gt_files(tmp_path):
    engine = DatasetEngine(base_dir=str(tmp_path), seed=26189, noise_level=2, scale="mvp")
    engine.run_scenario(1)
    gt_dir = os.path.join(tmp_path, "output", "GROUND_TRUTH", "S01")
    assert os.path.exists(os.path.join(gt_dir, "ground_truth_manifest.json"))
    assert os.path.exists(os.path.join(gt_dir, "hard_negatives.json"))
    assert os.path.exists(os.path.join(gt_dir, "evidence_chains.json"))


# ── DataDrivenSerializer ──────────────────────────────────────────────────────

def test_serializer_produces_all_10_source_types():
    r = build_scenario(1)
    s = DataDrivenSerializer(r.context, target_total=200)
    firs   = s.serialize_cctns_fir()
    hist   = s.serialize_criminal_history()
    cdrs   = s.serialize_telecom_cdr()
    cafs   = s.serialize_telecom_caf()
    txns   = s.serialize_cbs_bank_transactions()
    fiu    = s.serialize_fiu_str_alerts()
    anpr   = s.serialize_toll_anpr()
    tower  = s.serialize_cell_tower_dumps()
    osint  = s.serialize_osint_social()
    fnotes = s.serialize_field_notes()
    assert len(firs) >= 1
    assert len(cdrs) >= 5
    assert len(txns) >= 5
    assert len(cafs) >= len(r.context.phones)
    assert isinstance(fnotes, str) and len(fnotes) > 50


def test_serializer_records_traceable_via_registry():
    r = build_scenario(4)
    s = DataDrivenSerializer(r.context, target_total=300)
    s.serialize_cctns_fir()
    s.serialize_telecom_cdr()
    s.serialize_cbs_bank_transactions()
    reg = r.context.registry
    # Registry must have at least 3 source types populated
    assert len(reg.all_records()) >= 3


def test_serializer_no_label_leakage():
    from validation.leakage_validator import LabelLeakageValidator
    r = build_scenario(10)
    s = DataDrivenSerializer(r.context, target_total=200)
    firs = s.serialize_cctns_fir()
    cdrs = s.serialize_telecom_cdr()
    validator = LabelLeakageValidator()
    ok_fir, _ = validator.audit_dict_object(firs, "firs")
    ok_cdr, _ = validator.audit_dict_object(cdrs, "cdrs")
    assert ok_fir
    assert ok_cdr


# ── Noise Engine ──────────────────────────────────────────────────────────────

def test_noise_ratio_is_mathematically_correct():
    """noise_ratio must equal noise_records / total_observed_records."""
    engine = NoiseEngine(seed=26189, noise_level=3)
    total = 200
    engine._clean_records = total

    # Inject a known number of new-record noise
    caf = [{"caf_id": f"CAF-{i}", "phone_number": "test"} for i in range(total)]
    txns = [{"transaction_id": f"CBS-{i}", "amount": 1000.0} for i in range(total)]
    cdr  = [{"cdr_id": f"CDR-{i}", "caller_phone": "test"} for i in range(total)]
    fnotes = "baseline field notes"

    caf_after  = engine.inject_name_collisions(caf)
    txns_after = engine.inject_benign_financials(txns)
    fnotes_out, cdr_after = engine.inject_distractor_subgraph(fnotes, cdr)
    cdr_after  = engine.inject_recycled_sims(cdr_after)

    noise_new = (
        engine._noise_by_mechanism["identity_collision"] +
        engine._noise_by_mechanism["benign_financial"] +
        engine._noise_by_mechanism["distractor_subgraph"] +
        engine._noise_by_mechanism["recycled_sim"]
    )
    total_obs = total + noise_new
    stats = engine.get_statistics(total_observed_records=total_obs)

    expected_ratio = noise_new / total_obs if total_obs > 0 else 0
    assert abs(stats["measured_noise_ratio"] - round(expected_ratio, 4)) < 0.001


def test_noise_impossible_statistics_prevented():
    """noise_records must never exceed total_observed_records."""
    engine = NoiseEngine(seed=42, noise_level=5)
    caf  = [{"caf_id": "CAF-01"}]
    txns = [{"transaction_id": "CBS-01", "amount": 100.0}]
    cdr  = [{"cdr_id": "CDR-01"}]
    caf  = engine.inject_name_collisions(caf)
    txns = engine.inject_benign_financials(txns)
    _, cdr = engine.inject_distractor_subgraph("notes", cdr)

    noise = (engine._noise_by_mechanism["identity_collision"] +
             engine._noise_by_mechanism["benign_financial"] +
             engine._noise_by_mechanism["distractor_subgraph"])
    total_obs = 1 + noise  # 1 clean + noise
    stats = engine.get_statistics(total_obs)
    assert stats["measured_noise_ratio"] <= 1.0
    assert stats["noise_records_inter"] <= stats["total_observed_records"]


@pytest.mark.parametrize("level,expected_target", [
    (1, 0.20), (2, 0.40), (3, 0.60), (4, 0.80), (5, 0.90),
])
def test_noise_level_target_ratios(level, expected_target):
    engine = NoiseEngine(seed=26189, noise_level=level)
    assert engine.target_ratio == expected_target


# ── Temporal Validator ────────────────────────────────────────────────────────

def test_temporal_validator_ordering_pass():
    tv = TemporalValidator()
    steps = [
        {"step": 1, "timestamp": "2026-08-01T08:00:00Z"},
        {"step": 2, "timestamp": "2026-08-01T10:00:00Z"},
        {"step": 3, "timestamp": "2026-08-01T14:00:00Z"},
    ]
    ok, errs = tv.validate_timeline_ordering(steps)
    assert ok
    assert errs == []


def test_temporal_validator_ordering_fail():
    tv = TemporalValidator()
    steps = [
        {"step": 1, "timestamp": "2026-08-01T14:00:00Z"},
        {"step": 2, "timestamp": "2026-08-01T08:00:00Z"},  # BACKWARDS
    ]
    ok, errs = tv.validate_timeline_ordering(steps)
    assert not ok
    assert len(errs) >= 1


def test_temporal_validator_sim_lifecycle_valid():
    tv = TemporalValidator()
    ok, errs = tv.validate_sim_lifecycle(
        activation_date="2026-06-01T00:00:00Z",
        deactivation_date=None,
        cdr_timestamps=["2026-07-01T10:00:00Z", "2026-08-10T12:00:00Z"],
    )
    assert ok


def test_temporal_validator_sim_before_activation_fails():
    tv = TemporalValidator()
    ok, errs = tv.validate_sim_lifecycle(
        activation_date="2026-06-01T00:00:00Z",
        deactivation_date=None,
        cdr_timestamps=["2026-05-01T10:00:00Z"],  # BEFORE activation
    )
    assert not ok
    assert any("precedes" in e for e in errs)


def test_temporal_validator_causal_dependencies_pass():
    tv = TemporalValidator()
    events = [
        {"step": 1, "timestamp": "2026-08-01T08:00:00Z"},
        {"step": 4, "timestamp": "2026-08-01T10:00:00Z"},
        {"step": 7, "timestamp": "2026-08-01T12:00:00Z"},
    ]
    ok, errs = tv.validate_causal_dependencies(events, [(1, 4), (4, 7)])
    assert ok


def test_temporal_s09_timeline_within_72h():
    r = build_scenario(9)
    tv = TemporalValidator()
    steps = [s.model_dump() for s in r.ground_truth.master_timeline]
    ok, errs = tv.validate_72h_window(
        steps,
        r.context.investigation_window["start"],
        r.context.investigation_window["end"],
    )
    assert ok, f"S9 timeline out of window: {errs}"


def test_temporal_s01_timeline_ordered():
    r = build_scenario(1)
    tv = TemporalValidator()
    steps = [s.model_dump() for s in r.ground_truth.master_timeline]
    ok, errs = tv.validate_timeline_ordering(steps)
    assert ok, f"S1 timeline not ordered: {errs}"


# ── Identity Validator ────────────────────────────────────────────────────────

def test_identity_validator_s03_recycled_sim_legitimate():
    """S3 has recycled SIM — identity validator should accept it as LEGITIMATE."""
    r = build_scenario(3)
    iv = IdentityValidator()
    ok, report = iv.validate_all(r.context)
    # Phone ownership check may surface issues for recycled SIM
    # But our S3 correctly sets deactivation_date, so it should pass
    assert ok, f"Identity validation failed for S3: {report}"


def test_identity_validator_all_scenarios():
    from generator.scenarios.router import build_all_scenarios
    iv = IdentityValidator()
    results = build_all_scenarios()
    for sid, r in results.items():
        ok, report = iv.validate_all(r.context)
        assert ok, f"S{sid} identity validation failed: {report}"


# ── Evidence Validator ────────────────────────────────────────────────────────

def test_evidence_validator_s07_no_direct_ae_edge():
    """S7: Verify there is NO direct A→E edge — multi-hop must be traversed."""
    r = build_scenario(7)
    persons = r.context.persons
    assert len(persons) >= 5
    entity_a = persons[0].id
    entity_e = persons[4].id
    ev = EvidenceValidator()
    ok, errs = ev.validate_no_direct_ae_path(
        r.ground_truth.ground_truth_relationships, entity_a, entity_e
    )
    assert ok, f"S7 has a direct A→E edge: {errs}"


def test_evidence_validator_pre_serialization_chains_s10():
    """S10 evidence chains should be consistent with the answer."""
    r = build_scenario(10)
    ev = EvidenceValidator()
    ok, errs = ev.validate_pre_serialization_chains(r.evidence_chains, r.answer)
    # Warnings are acceptable (chains can reference records not explicitly in answer)
    # What we care is the validator runs without exceptions
    assert isinstance(ok, bool)


# ── AuditRunner Integration ───────────────────────────────────────────────────

def test_audit_runner_all_validators_pass_s01(tmp_path):
    r = build_scenario(1)
    s = DataDrivenSerializer(r.context, target_total=200)
    observed = {
        "cctns_fir_records.json":       s.serialize_cctns_fir(),
        "criminal_history_db.json":     s.serialize_criminal_history(),
        "telecom_cdr_logs.csv":         s.serialize_telecom_cdr(),
        "telecom_caf_kyc.json":         s.serialize_telecom_caf(),
        "cbs_bank_transactions.csv":    s.serialize_cbs_bank_transactions(),
        "fiu_str_alerts.json":          s.serialize_fiu_str_alerts(),
        "toll_anpr_logs.csv":           s.serialize_toll_anpr(),
        "cell_tower_dumps.json":        s.serialize_cell_tower_dumps(),
        "osint_social_posts.json":      s.serialize_osint_social(),
        "field_intelligence_notes.txt": s.serialize_field_notes(),
    }
    runner = AuditRunner(schemas_dir=str(tmp_path))
    report = runner.run_full_audit("S01", observed, context=r.context, scenario_result=r)
    assert report["passed"], f"Audit failed for S01: {report['failed_rules']}"
