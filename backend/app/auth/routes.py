"""
Auth routes — login & register.

Mounted at /api/auth in main.py.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel

from app.auth.dependencies import require_role
from app.auth.jwt import create_access_token
from app.auth.models import Role, User, pwd_context, user_store

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    """Issue a JWT access token.  Expects form-encoded username & password."""
    user = user_store.get_by_username(form.username)
    if not user or not pwd_context.verify(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id, user.role)
    return {"access_token": token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: Role = Role.viewer


# TRADEOFF: Registration is admin-only.
# In an MVP / demo you might open this up (remove the require_role dependency)
# so anyone can self-register.  For a criminal-investigation tool we lock it
# down — only an existing admin can create new users.
@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(Role.admin))],
)
async def register(body: RegisterRequest):
    """Create a new user.  Admin-only."""
    if user_store.get_by_username(body.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists",
        )

    new_user = User(
        username=body.username,
        hashed_password=pwd_context.hash(body.password),
        role=body.role,
    )
    user_store.add(new_user)

    return {
        "id": new_user.id,
        "username": new_user.username,
        "role": new_user.role.value,
    }
