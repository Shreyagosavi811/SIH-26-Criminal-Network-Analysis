"""
SIH26189 Master Dataset Engine - Canonical Entity & Ground Truth Models
Defines Pydantic V2 models for all 12 entity types, ground truth graphs, timeline steps, queries, and answers.
"""

from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class GroundTruthRole(str, Enum):
    MASTERMIND = "MASTERMIND"
    MULE = "MULE"
    SPOTTER = "SPOTTER"
    ASSOCIATE = "ASSOCIATE"
    BENIGN_PERSON = "BENIGN_PERSON"
    DISTRACTOR = "DISTRACTOR"


# --- 12 CANONICAL ENTITIES ---

class PersonEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. PERSON-S001-0001")
    full_name: str
    alias_names: List[str] = Field(default_factory=list)
    dob: str
    gender: str
    father_name: str
    aadhaar_hash: str
    pan_number: str
    primary_address: str
    occupation: str
    scenario_id: str


class FIRCaseEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. FIR-S001-0001")
    fir_number: str
    police_station: str
    district: str
    state: str
    date_of_incident: str
    date_of_registration: str
    acts_and_sections: List[str]
    offense_category: str
    complaint_summary: str
    investigating_officer: str
    scenario_id: str


class PhoneEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. PHONE-S001-0001")
    msisdn: str
    imei: str
    imsi: str
    service_provider: str
    activation_date: str
    status: str = "ACTIVE"
    owner_person_id: str
    scenario_id: str


class VehicleEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. VEHICLE-S001-0001")
    registration_number: str
    chassis_number: str
    engine_number: str
    make_model: str
    color: str
    registered_owner_id: str
    scenario_id: str


class AccountEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. ACCOUNT-S001-0001")
    account_number: str
    bank_name: str
    ifsc_code: str
    account_type: str
    cif_number: str
    opening_date: str
    owner_id: str
    scenario_id: str


class TransactionEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. TRANSACTION-S001-0001")
    transaction_reference: str
    source_account_id: str
    destination_account_id: str
    amount_inr: float
    timestamp: str
    channel: str
    remarks: str
    scenario_id: str


class LocationEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. LOCATION-S001-0001")
    location_name: str
    location_type: str  # CELL_TOWER, TOLL_PLAZA, ATM, CRIME_SCENE, RESIDENCE
    latitude: float
    longitude: float
    address: str
    district: str
    state: str
    scenario_id: str


class OrganizationEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. ORGANIZATION-S001-0001")
    company_name: str
    cin: str
    gstin: str
    org_type: str
    registered_address: str
    scenario_id: str


class SocialAccountEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. SOCIAL-S001-0001")
    platform: str
    username_handle: str
    associated_phone_id: str
    account_creation_date: str
    scenario_id: str


class EventEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. EVENT-S001-0001")
    event_type: str
    start_timestamp: str
    end_timestamp: str
    location_id: str
    summary: str
    scenario_id: str


class EvidenceEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. EVIDENCE-S001-0001")
    evidence_type: str
    description: str
    seizure_timestamp: str
    seizing_officer: str
    file_hash: str
    attached_fir_id: str
    scenario_id: str


class CommunicationEntity(BaseModel):
    id: str = Field(..., description="Canonical ID e.g. COMMUNICATION-S001-0001")
    caller_phone_id: str
    receiver_phone_id: str
    call_type: str  # VOICE_IN, VOICE_OUT, SMS, DATA
    timestamp: str
    duration_seconds: int
    start_cell_id: str
    end_cell_id: str
    scenario_id: str


# --- GROUND TRUTH MANIFEST & TIMELINE MODELS ---

class EvidenceMapping(BaseModel):
    source: str
    record_id: str


class GroundTruthEdge(BaseModel):
    edge_id: str
    source_entity: str
    target_entity: str
    relationship_type: str
    is_direct_or_inferred: str  # DIRECT / INFERRED
    evidence_path: List[EvidenceMapping]
    ground_truth_confidence: float = 1.0
    temporal_start: Optional[str] = None
    temporal_end: Optional[str] = None


class GroundTruthEntityRoleMap(BaseModel):
    canonical_id: str
    role_in_scenario: GroundTruthRole
    real_name: str
    associated_sources: List[str]


class TimelineStep(BaseModel):
    step: int
    event_id: str
    timestamp: str
    event_type: str
    description: str
    entity_ids: List[str]
    location_id: Optional[str] = None
    supporting_evidence_records: List[str] = Field(default_factory=list)


class GroundTruthManifest(BaseModel):
    scenario_id: str
    scenario_name: str
    scenario_type: str
    master_timeline: List[TimelineStep]
    ground_truth_entities: List[GroundTruthEntityRoleMap]
    ground_truth_relationships: List[GroundTruthEdge]


# --- QUERY & ANSWER BENCHMARK MODELS ---

class InvestigationQuery(BaseModel):
    query_id: str
    scenario_id: str
    starting_entity: str
    starting_entity_type: str
    time_window: Dict[str, str]
    geographic_constraints: Dict[str, Any] = Field(default_factory=dict)
    query_text: str
    difficulty_level: str  # EASY, MEDIUM, HARD
    expected_reasoning_type: str  # CO_LOCATION, FINANCIAL_LAYERING, NETWORK_DISCOVERY, FALSE_POSITIVE_DISCRIMINATION


class EntityChainNode(BaseModel):
    canonical_id: str
    entity_type: str
    role_or_label: str
    description: str


class InvestigationAnswer(BaseModel):
    query_id: str
    scenario_id: str
    target_entities: List[str]
    entity_chain: List[EntityChainNode]
    relationship_graph: List[GroundTruthEdge]
    supporting_evidence: List[EvidenceMapping]
    timeline: List[TimelineStep]
    reasoning_summary: str
    confidence: float
    alternative_hypotheses: List[str] = Field(default_factory=list)
    false_positive_candidates: List[str] = Field(default_factory=list)
    ground_truth_match: bool = True
