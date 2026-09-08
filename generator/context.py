"""
SIH26189 Dataset Engine v1.1 - Scenario Context
Defines the resolved entity graph passed between all engine subsystems.
Replaces hardcoded string references with structured, entity-resolved data.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional, Any


@dataclass
class PersonCtx:
    id: str
    full_name: str
    alias: Optional[str]
    phone_id: str
    msisdn: str
    account_id: Optional[str]
    account_number: Optional[str]
    vehicle_id: Optional[str]
    plate: Optional[str]
    address: str
    district: str
    occupation: str
    operator: str
    activation_date: str  # ISO date for SIM


@dataclass
class AccountCtx:
    id: str
    owner_id: str
    account_number: str
    bank_name: str
    ifsc: str
    opening_date: str
    opening_balance: float = 100000.0
    current_balance: float = 100000.0


@dataclass
class PhoneCtx:
    id: str
    owner_id: str
    msisdn: str
    imei: str
    operator: str
    activation_date: str
    deactivation_date: Optional[str] = None


@dataclass
class VehicleCtx:
    id: str
    owner_id: str
    plate: str
    make_model: str
    color: str


@dataclass
class LocationCtx:
    id: str
    name: str
    location_type: str  # CELL_TOWER, TOLL_PLAZA, ATM, CRIME_SCENE, RESIDENCE
    lat: float
    lon: float
    district: str
    state: str
    tower_id: Optional[str] = None
    plaza_id: Optional[str] = None


@dataclass
class RecordRegistry:
    """Tracks all generated record IDs per source for evidence reachability validation."""
    records: Dict[str, List[str]] = field(default_factory=dict)

    def register(self, source: str, record_id: str):
        self.records.setdefault(source, []).append(record_id)

    def exists(self, source: str, record_id: str) -> bool:
        return record_id in self.records.get(source, [])

    def all_records(self) -> Dict[str, List[str]]:
        return dict(self.records)


@dataclass
class ScenarioContext:
    """Full resolved entity context for one scenario — passed to all serializers."""
    scenario_id: str
    scenario_type: str
    seed: int
    investigation_window: Dict[str, str]  # start, end ISO timestamps

    # Entity collections
    persons: List[PersonCtx] = field(default_factory=list)
    accounts: List[AccountCtx] = field(default_factory=list)
    phones: List[PhoneCtx] = field(default_factory=list)
    vehicles: List[VehicleCtx] = field(default_factory=list)
    locations: List[LocationCtx] = field(default_factory=list)

    # Event timeline: list of (timestamp, event_type, entity_ids, record_ids)
    events: List[Dict[str, Any]] = field(default_factory=list)

    # Evidence registry
    registry: RecordRegistry = field(default_factory=RecordRegistry)

    # Lookup helpers
    def person_by_id(self, pid: str) -> Optional[PersonCtx]:
        return next((p for p in self.persons if p.id == pid), None)

    def account_by_id(self, aid: str) -> Optional[AccountCtx]:
        return next((a for a in self.accounts if a.id == aid), None)

    def phone_by_id(self, phid: str) -> Optional[PhoneCtx]:
        return next((p for p in self.phones if p.id == phid), None)

    def location_by_id(self, lid: str) -> Optional[LocationCtx]:
        return next((l for l in self.locations if l.id == lid), None)

    def vehicle_by_id(self, vid: str) -> Optional[VehicleCtx]:
        return next((v for v in self.vehicles if v.id == vid), None)
