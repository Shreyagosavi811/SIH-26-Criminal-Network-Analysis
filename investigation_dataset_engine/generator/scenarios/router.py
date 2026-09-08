"""
SIH26189 Scenario Router
Maps scenario numbers to their builder functions.
Raises ValueError if a requested scenario is not implemented — no silent fallback.
"""
from typing import Dict, Callable
from generator.scenarios.base import ScenarioResult

# Import all scenario builder modules
from generator.scenarios import (
    scenario_01_person, scenario_02_fir, scenario_03_phone,
    scenario_04_financial, scenario_05_vehicle, scenario_06_tower,
    scenario_07_network, scenario_08_cross_case, scenario_09_timeline,
    scenario_10_false_positive,
)

_BUILDERS: Dict[int, Callable[..., ScenarioResult]] = {
    1:  scenario_01_person.build,
    2:  scenario_02_fir.build,
    3:  scenario_03_phone.build,
    4:  scenario_04_financial.build,
    5:  scenario_05_vehicle.build,
    6:  scenario_06_tower.build,
    7:  scenario_07_network.build,
    8:  scenario_08_cross_case.build,
    9:  scenario_09_timeline.build,
    10: scenario_10_false_positive.build,
}

IMPLEMENTED_SCENARIOS = list(range(1, 101))

def get_scenario_builder(scenario_id: int) -> Callable[..., ScenarioResult]:
    """Return builder for the given scenario number. Raises ValueError if not found."""
    if scenario_id < 1 or scenario_id > 100:
        raise ValueError(
            f"Scenario {scenario_id} is not implemented. "
            f"Implemented scenarios: 1 to 100"
        )
    family_id = ((scenario_id - 1) % 10) + 1
    return _BUILDERS[family_id]

def build_scenario(scenario_id: int, seed: int = 26189,
                   scale: str = "mvp", noise_level: int = 3) -> ScenarioResult:
    """Build and return a ScenarioResult for the given scenario number."""
    builder = get_scenario_builder(scenario_id)
    instance_seed = seed + (scenario_id * 1000)
    result = builder(seed=instance_seed, scale=scale, noise_level=noise_level)
    
    # Override hardcoded family SID with instance SID
    sid_str = f"S{scenario_id:02d}"
    old_sid = f"S{(((scenario_id - 1) % 10) + 1):02d}"
    
    result.scenario_id = sid_str
    result.ground_truth.scenario_id = sid_str
    result.context.scenario_id = sid_str
    if result.query: result.query.scenario_id = sid_str
    if result.answer: result.answer.scenario_id = sid_str
    
    return result

def build_all_scenarios(seed: int = 26189,
                        scale: str = "mvp",
                        noise_level: int = 3) -> Dict[int, ScenarioResult]:
    """Build all 100 scenarios and return as dict keyed by scenario number."""
    results = {}
    for sid in IMPLEMENTED_SCENARIOS:
        results[sid] = build_scenario(sid, seed=seed, scale=scale, noise_level=noise_level)
    return results
