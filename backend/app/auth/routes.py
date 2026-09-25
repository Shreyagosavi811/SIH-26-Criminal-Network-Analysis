"""
Auth routes — login, register, and user management.

Mounted at /api/auth in main.py.

Authorization policy:
    - Only **approved** users (is_approved=True) can log in.
    - Registration creates an *unapproved* user by default.
    - Admins can approve / revoke users via dedicated endpoints.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.auth.dependencies import require_role
from app.auth.jwt import create_access_token
from app.auth.models import Role, User, pwd_context, user_store

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger("auth.routes")


# ---------------------------------------------------------------------------
# Login — only approved officers can authenticate
# ---------------------------------------------------------------------------

@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """Issue a JWT access token.  Expects form-encoded username & password.

    Rejects the request if:
      - credentials are invalid  → 401
      - user account is not approved  → 403
    """
    user = user_store.get_by_username(form.username)
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ---- Authorization gate: only approved officers may log in ----
    if not user.is_approved:
        logger.warning(
            "LOGIN BLOCKED — unapproved account | username=%s | id=%s",
            user.username,
            user.id,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has not been approved. Contact an administrator.",
        )

    token = create_access_token(user.id, user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role.value,
            "department": user.department,
            "badge_id": user.badge_id,
        },
    }


# ---------------------------------------------------------------------------
# Register — admin-only, new user starts as *unapproved*
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Role = Role.viewer
    department: str = ""
    badge_id: str = ""


# TRADEOFF: Registration is admin-only.
# For a government criminal-investigation tool, we lock it down —
# only an existing admin can create new users.  New users are
# unapproved by default and must be explicitly approved.
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(Role.admin))],
)
async def register(body: RegisterRequest):
    """Create a new user (unapproved by default).  Admin-only."""
    if user_store.get_by_username(body.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    new_user = User(
        username=body.username,
        hashed_password=pwd_context.hash(body.password),
        role=body.role,
        department=body.department,
        badge_id=body.badge_id,
        is_approved=False,  # must be approved by admin before login
    )
    user_store.add(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role.value,
        "department": new_user.department,
        "badge_id": new_user.badge_id,
        "is_approved": new_user.is_approved,
    }


# ---------------------------------------------------------------------------
# User management — admin only
# ---------------------------------------------------------------------------

@router.get("/users")
async def list_users(
    user: dict = Depends(require_role(Role.admin)),
):
    """List all registered users (admin only).  Passwords are never exposed."""
    return [
        {
            "id": u.id,
            "username": u.username,
            "role": u.role.value,
            "department": u.department,
            "badge_id": u.badge_id,
            "is_approved": u.is_approved,
        }
        for u in user_store.all_users()
    ]


@router.post("/users/{user_id}/approve", status_code=200)
async def approve_user(
    user_id: str,
    user: dict = Depends(require_role(Role.admin)),
):
    """Approve a user so they can log in.  Admin only."""
    if not user_store.approve(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    target = user_store.get_by_id(user_id)
    logger.info(
        "USER APPROVED | by_admin=%s | target_user=%s (%s)",
        user["id"], target.username, user_id,
    )
    return {"message": f"User '{target.username}' has been approved", "is_approved": True}


@router.post("/users/{user_id}/revoke", status_code=200)
async def revoke_user(
    user_id: str,
    user: dict = Depends(require_role(Role.admin)),
):
    """Revoke a user's access so they can no longer log in.  Admin only."""
    if not user_store.revoke(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    target = user_store.get_by_id(user_id)
    logger.info(
        "USER REVOKED | by_admin=%s | target_user=%s (%s)",
        user["id"], target.username, user_id,
    )
    return {"message": f"User '{target.username}' access has been revoked", "is_approved": False}

