import pytest
from generator.scenarios.router import get_scenario_builder, build_scenario
from generator.scenarios import (
    scenario_01_person, scenario_10_false_positive
)
from generator.engine import SCALE_TARGETS

def test_routing_modulo():
    # S11 routes to S01
    assert get_scenario_builder(11) == scenario_01_person.build
    # S20 routes to S10
    assert get_scenario_builder(20) == scenario_10_false_positive.build
    # S21 routes to S01
    assert get_scenario_builder(21) == scenario_01_person.build
    # S100 routes to S10
    assert get_scenario_builder(100) == scenario_10_false_positive.build

def test_seed_isolation():
    # S01 and S11 should produce DIFFERENT outputs despite same base seed and same builder
    res1 = build_scenario(1, seed=26189)
    res11 = build_scenario(11, seed=26189)
    
    # GT entities should have different properties because seed shifted by 10000
    assert res1.ground_truth.ground_truth_entities[0].real_name != res11.ground_truth.ground_truth_entities[0].real_name

def test_reproducibility():
    # Same base seed produces identical output
    res_a = build_scenario(11, seed=26189)
    res_b = build_scenario(11, seed=26189)
    
    assert res_a.ground_truth.ground_truth_entities[0].real_name == res_b.ground_truth.ground_truth_entities[0].real_name
    assert res_a.scenario_id == "S11"
    assert res_b.scenario_id == "S11"

def test_scale_targets():
    assert SCALE_TARGETS["final"] == 5000

def test_scenario_id_overridden():
    # When routing to 11, the resulting scenario ID must be S11, not S01
    res = build_scenario(11)
    assert res.scenario_id == "S11"
    assert res.ground_truth.scenario_id == "S11"
    assert res.context.scenario_id == "S11"
