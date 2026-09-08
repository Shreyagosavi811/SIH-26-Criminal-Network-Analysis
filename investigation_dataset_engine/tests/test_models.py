"""
Unit tests for canonical Pydantic models & topology builders.
"""

from generator.models import PersonEntity, GroundTruthRole
from generator.topology import build_scenario_10_topology


def test_person_entity_instantiation():
    person = PersonEntity(
        id="PERSON-S010-0001",
        full_name="Vikram Choudhury",
        alias_names=["Vicky"],
        dob="1988-05-14",
        gender="M",
        father_name="Ramesh Choudhury",
        aadhaar_hash="a"*64,
        pan_number="ABCDE1234F",
        primary_address="Delhi",
        occupation="Business",
        scenario_id="SCN-2026-SCN10-001"
    )
    assert person.id == "PERSON-S010-0001"
    assert person.full_name == "Vikram Choudhury"


def test_scenario_10_topology_builder():
    manifest, query, answer, context = build_scenario_10_topology()
    assert manifest.scenario_id == "SCN-2026-SCN10-001"
    assert len(manifest.ground_truth_entities) == 5
    assert len(manifest.ground_truth_relationships) == 4
    assert query.difficulty_level == "MEDIUM"
    assert answer.ground_truth_match is True
