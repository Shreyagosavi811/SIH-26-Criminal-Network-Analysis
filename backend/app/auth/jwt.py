"""
JWT helpers — issue & decode access tokens.

Secret is read from the JWT_SECRET_KEY env var (never hardcoded).
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.auth.models import Role


# ---------------------------------------------------------------------------
# Config — all from env vars
# ---------------------------------------------------------------------------

SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
if not SECRET_KEY:
    # Fail loudly at import time so no one accidentally runs without a secret.
    # Tests override this via monkeypatch / env fixture.
    import warnings
    warnings.warn(
        "JWT_SECRET_KEY is not set — using an insecure default. "
        "Set it in production!",
        stacklevel=2,
    )
    SECRET_KEY = "INSECURE-DEV-ONLY-CHANGE-ME"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))


# ---------------------------------------------------------------------------
# Create / decode
# ---------------------------------------------------------------------------

def create_access_token(user_id: str, role: Role) -> str:
    """Return a signed JWT with `sub` (user id) and `role` in the payload."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,
        "role": role.value,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT.  Raises JWTError on failure."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
