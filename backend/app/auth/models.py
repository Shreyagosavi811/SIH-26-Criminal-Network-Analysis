"""
Role & User models for RBAC.

Storage is swappable: currently uses an in-memory list seeded from
users.json (if it exists).  To switch to a DB, replace the UserStore
class — no other module touches raw storage.

Authorization policy:
    Only users with ``is_approved = True`` can log in.  New users created
    via /api/auth/register start as **unapproved** by default; an admin
    must explicitly approve them before they can access the system.
    Pre-seeded government officer accounts are approved on first boot.
"""

from __future__ import annotations

import enum
import json
import os
import uuid
from pathlib import Path
from typing import Optional

from passlib.context import CryptContext
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------

class Role(str, enum.Enum):
    """Ordered from least to most privileged."""
    viewer = "viewer"
    investigator = "investigator"
    admin = "admin"


# Numeric privilege level for >= comparisons
_ROLE_LEVEL = {Role.viewer: 0, Role.investigator: 1, Role.admin: 2}


def role_level(role: Role) -> int:
    return _ROLE_LEVEL[role]


# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------------------------------------------------------------------------
# User model
# ---------------------------------------------------------------------------

class User(BaseModel):
    id: str = Field(default_factory=lambda: uuid.uuid4().hex)
    username: str
    hashed_password: str
    role: Role = Role.viewer
    department: str = ""
    badge_id: str = ""
    is_approved: bool = False


# ---------------------------------------------------------------------------
# Swappable user store — in-memory + optional users.json persistence
# ---------------------------------------------------------------------------

_USERS_JSON = Path(__file__).resolve().parent.parent.parent / "users.json"

# Pre-seeded authorised government officers (created on first boot)
_SEED_OFFICERS = [
    {
        "username": "admin",
        "password": "admin123",
        "role": Role.admin,
        "department": "System Administration",
        "badge_id": "SYS-0001",
    },
    {
        "username": "sp_rajesh_kumar",
        "password": "ips@secure2024",
        "role": Role.admin,
        "department": "IPS — Superintendent of Police, Cyber Crime Division",
        "badge_id": "IPS-4521",
    },
    {
        "username": "dsp_priya_sharma",
        "password": "dsp@secure2024",
        "role": Role.investigator,
        "department": "IPS — Deputy Superintendent of Police, Criminal Investigation",
        "badge_id": "IPS-7834",
    },
    {
        "username": "inspector_vikram",
        "password": "insp@secure2024",
        "role": Role.investigator,
        "department": "CBI — Central Bureau of Investigation, Special Crimes Unit",
        "badge_id": "CBI-1192",
    },
    {
        "username": "nia_officer_ananya",
        "password": "nia@secure2024",
        "role": Role.investigator,
        "department": "NIA — National Investigation Agency, Counter-Terrorism Wing",
        "badge_id": "NIA-3356",
    },
    {
        "username": "cyber_cell_arjun",
        "password": "cyber@secure2024",
        "role": Role.investigator,
        "department": "State Cyber Crime Cell, Digital Forensics Lab",
        "badge_id": "CYB-0078",
    },
    {
        "username": "analyst_meera",
        "password": "analyst@secure2024",
        "role": Role.viewer,
        "department": "Intelligence Bureau — Data Analytics Division",
        "badge_id": "IB-5501",
    },
    {
        "username": "constable_ravi",
        "password": "const@secure2024",
        "role": Role.viewer,
        "department": "Delhi Police — District Cyber Cell, South-East",
        "badge_id": "DP-9923",
    },
]


class UserStore:
    """
    Swap this class for a DB-backed implementation when ready.
    Public interface:
        get_by_username(username) -> Optional[User]
        get_by_id(uid) -> Optional[User]
        add(user) -> User
        approve(uid) -> bool
        revoke(uid) -> bool
        all_users() -> list[User]
    """

    def __init__(self) -> None:
        self._users: list[User] = []
        self._load_seed()

    # ------------------------------------------------------------------
    def _load_seed(self) -> None:
        """Load users from users.json if it exists, otherwise seed
        authorised government officer accounts on first boot."""
        if _USERS_JSON.exists():
            with open(_USERS_JSON, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for entry in raw:
                self._users.append(User(**entry))
        else:
            # First boot — create all pre-authorised officer accounts
            for officer in _SEED_OFFICERS:
                user = User(
                    username=officer["username"],
                    hashed_password=pwd_context.hash(officer["password"]),
                    role=officer["role"],
                    department=officer["department"],
                    badge_id=officer["badge_id"],
                    is_approved=True,  # pre-authorised
                )
                self._users.append(user)
            self._persist()

    def _persist(self) -> None:
        """Write current state to users.json for restart-resilience."""
        with open(_USERS_JSON, "w", encoding="utf-8") as f:
            json.dump([u.model_dump() for u in self._users], f, indent=2)

    # ------------------------------------------------------------------
    def get_by_username(self, username: str) -> Optional[User]:
        for u in self._users:
            if u.username == username:
                return u
        return None

    def get_by_id(self, uid: str) -> Optional[User]:
        for u in self._users:
            if u.id == uid:
                return u
        return None

    def add(self, user: User) -> User:
        self._users.append(user)
        self._persist()
        return user

    def approve(self, uid: str) -> bool:
        """Approve a user so they can log in. Returns False if not found."""
        user = self.get_by_id(uid)
        if not user:
            return False
        user.is_approved = True
        self._persist()
        return True

    def revoke(self, uid: str) -> bool:
        """Revoke a user's approval so they can no longer log in."""
        user = self.get_by_id(uid)
        if not user:
            return False
        user.is_approved = False
        self._persist()
        return True

    def all_users(self) -> list[User]:
        return list(self._users)


# Module-level singleton
user_store = UserStore()
