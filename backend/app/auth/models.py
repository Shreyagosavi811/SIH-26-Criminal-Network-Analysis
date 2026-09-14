"""
Role & User models for RBAC.

Storage is swappable: currently uses an in-memory list seeded from
users.json (if it exists).  To switch to a DB, replace the UserStore
class — no other module touches raw storage.
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


# ---------------------------------------------------------------------------
# Swappable user store — in-memory + optional users.json persistence
# ---------------------------------------------------------------------------

_USERS_JSON = Path(__file__).resolve().parent.parent.parent / "users.json"


class UserStore:
    """
    Swap this class for a DB-backed implementation when ready.
    Public interface:
        get_by_username(username) -> Optional[User]
        get_by_id(uid) -> Optional[User]
        add(user) -> User
        all_users() -> list[User]
    """

    def __init__(self) -> None:
        self._users: list[User] = []
        self._load_seed()

    # ------------------------------------------------------------------
    def _load_seed(self) -> None:
        """Load users from users.json if it exists, otherwise seed a
        default admin account so the system is usable on first boot."""
        if _USERS_JSON.exists():
            with open(_USERS_JSON, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for entry in raw:
                self._users.append(User(**entry))
        else:
            # Seed default admin — password "admin" (change in production!)
            default_admin = User(
                username="admin",
                hashed_password=pwd_context.hash("admin"),
                role=Role.admin,
            )
            self._users.append(default_admin)
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

    def all_users(self) -> list[User]:
        return list(self._users)


# Module-level singleton
user_store = UserStore()
