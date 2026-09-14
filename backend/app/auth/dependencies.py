"""
FastAPI dependencies for authentication & role-based authorization.

`get_current_user`  — decodes JWT from Authorization header, returns dict
                      with {"id", "role"} keys.
`require_role`      — dependency *factory*; returns a dependency that
                      checks the caller has one of the allowed roles.
                      Usage: `Depends(require_role(Role.admin))`
"""

from __future__ import annotations

import logging
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from app.auth.jwt import decode_access_token
from app.auth.models import Role, role_level

logger = logging.getLogger("auth.audit")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# get_current_user
# ---------------------------------------------------------------------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decode the JWT and return {"id": ..., "role": Role(...)}."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id: str | None = payload.get("sub")
        role_str: str | None = payload.get("role")
        if user_id is None or role_str is None:
            raise credentials_exception
        role = Role(role_str)
    except (JWTError, ValueError):
        raise credentials_exception

    return {"id": user_id, "role": role}


# ---------------------------------------------------------------------------
# require_role  — dependency factory
# ---------------------------------------------------------------------------

def require_role(*allowed_roles: Role) -> Callable:
    """
    Return a FastAPI dependency that enforces role-based access.

    Usage on a route:
        @router.get("/admin-only", dependencies=[Depends(require_role(Role.admin))])

    Or to also receive the current user dict:
        async def handler(user=Depends(require_role(Role.investigator, Role.admin))):
            ...
    """

    async def _check(request: Request, user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in allowed_roles:
            # --- Audit log: every 403 is recorded (criminal-investigation tool) ---
            logger.warning(
                "ACCESS DENIED | user_id=%s | role=%s | route=%s %s",
                user["id"],
                user["role"].value,
                request.method,
                request.url.path,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user['role'].value}' is not authorized for this resource",
            )
        return user

    return _check
