"""
Tests for RBAC authentication.

Covers:
  - Valid login
  - Invalid credentials
  - Expired token
  - Role-denied (403) for each tier
  - Role-allowed (200) for each tier
  - Admin-only registration
"""

import os
import time

import pytest
from fastapi.testclient import TestClient
from jose import jwt

# Set secret BEFORE any app imports so JWT module picks it up
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-ci"

from app.auth.jwt import ALGORITHM, create_access_token
from app.auth.models import Role, User, pwd_context, user_store
from app.main import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def _seed_users():
    """Ensure a known set of users exists for every test."""
    # Clear and re-seed
    user_store._users.clear()

    for username, password, role in [
        ("admin_user", "adminpass", Role.admin),
        ("investigator_user", "investpass", Role.investigator),
        ("viewer_user", "viewerpass", Role.viewer),
    ]:
        user_store._users.append(
            User(
                username=username,
                hashed_password=pwd_context.hash(password),
                role=role,
            )
        )
    yield


def _login(username: str, password: str) -> dict:
    """Helper — login and return the response JSON."""
    return client.post(
        "/api/auth/login",
        data={"username": username, "password": password},
    )


def _auth_header(username: str, password: str) -> dict:
    """Helper — login and return an Authorization header dict."""
    resp = _login(username, password)
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. Valid login
# ---------------------------------------------------------------------------

def test_login_valid():
    resp = _login("admin_user", "adminpass")
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    # Decode and verify payload
    payload = jwt.decode(body["access_token"], "test-secret-key-for-ci", algorithms=[ALGORITHM])
    assert payload["role"] == "admin"
    assert "sub" in payload


# ---------------------------------------------------------------------------
# 2. Invalid credentials
# ---------------------------------------------------------------------------

def test_login_wrong_password():
    resp = _login("admin_user", "wrong")
    assert resp.status_code == 401


def test_login_nonexistent_user():
    resp = _login("nobody", "nopass")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 3. Expired token
# ---------------------------------------------------------------------------

def test_expired_token():
    """A token with exp in the past should be rejected as 401."""
    user = user_store.get_by_username("viewer_user")
    payload = {
        "sub": user.id,
        "role": user.role.value,
        "exp": int(time.time()) - 10,  # already expired
    }
    token = jwt.encode(payload, "test-secret-key-for-ci", algorithm=ALGORITHM)
    resp = client.get("/api/scenarios", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 4. No token → 401
# ---------------------------------------------------------------------------

def test_no_token():
    resp = client.get("/api/scenarios")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# 5. Role-allowed (200) for each tier
# ---------------------------------------------------------------------------

class TestRoleAllowed:
    """Verify each role can access its permitted routes."""

    # viewer+ → read endpoints
    def test_viewer_can_read_scenarios(self):
        headers = _auth_header("viewer_user", "viewerpass")
        resp = client.get("/api/scenarios", headers=headers)
        assert resp.status_code == 200

    def test_viewer_can_read_records(self):
        headers = _auth_header("viewer_user", "viewerpass")
        resp = client.get("/api/records?limit=5", headers=headers)
        assert resp.status_code == 200

    # investigator+ → write / analytical actions
    def test_investigator_can_query_ai(self):
        headers = _auth_header("investigator_user", "investpass")
        resp = client.post(
            "/api/ai/query",
            json={"query": "payments", "scenario_id": "S01"},
            headers=headers,
        )
        assert resp.status_code == 200

    def test_investigator_can_read_scenarios(self):
        """Investigator inherits viewer access."""
        headers = _auth_header("investigator_user", "investpass")
        resp = client.get("/api/scenarios", headers=headers)
        assert resp.status_code == 200

    # admin → everything
    def test_admin_can_register_user(self):
        headers = _auth_header("admin_user", "adminpass")
        resp = client.post(
            "/api/auth/register",
            json={"username": "new_user", "password": "newpass", "role": "viewer"},
            headers=headers,
        )
        assert resp.status_code == 201

    def test_admin_can_query_ai(self):
        headers = _auth_header("admin_user", "adminpass")
        resp = client.post(
            "/api/ai/query",
            json={"query": "payments", "scenario_id": "S01"},
            headers=headers,
        )
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# 6. Role-denied (403) for each tier
# ---------------------------------------------------------------------------

class TestRoleDenied:
    """Verify each role is blocked from routes above its privilege."""

    # viewer cannot use investigator+ endpoints
    def test_viewer_cannot_query_ai(self):
        headers = _auth_header("viewer_user", "viewerpass")
        resp = client.post(
            "/api/ai/query",
            json={"query": "payments", "scenario_id": "S01"},
            headers=headers,
        )
        assert resp.status_code == 403

    # viewer cannot register users (admin-only)
    def test_viewer_cannot_register(self):
        headers = _auth_header("viewer_user", "viewerpass")
        resp = client.post(
            "/api/auth/register",
            json={"username": "hacker", "password": "hack", "role": "admin"},
            headers=headers,
        )
        assert resp.status_code == 403

    # investigator cannot register users (admin-only)
    def test_investigator_cannot_register(self):
        headers = _auth_header("investigator_user", "investpass")
        resp = client.post(
            "/api/auth/register",
            json={"username": "hacker", "password": "hack", "role": "admin"},
            headers=headers,
        )
        assert resp.status_code == 403


# ---------------------------------------------------------------------------
# 7. Health endpoint remains public (no auth)
# ---------------------------------------------------------------------------

def test_health_public():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ---------------------------------------------------------------------------
# 8. Duplicate registration
# ---------------------------------------------------------------------------

def test_register_duplicate_username():
    headers = _auth_header("admin_user", "adminpass")
    resp = client.post(
        "/api/auth/register",
        json={"username": "admin_user", "password": "x", "role": "viewer"},
        headers=headers,
    )
    assert resp.status_code == 409
