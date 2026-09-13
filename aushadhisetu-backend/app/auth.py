import hashlib
import hmac
from datetime import datetime, timedelta
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Facility


# ============================================================
# PASSWORD HASHING
# ============================================================

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    try:
        salt, h = hashed_password.split("$", 1)

        expected = hashlib.sha256(
            (
                salt
                + plain_password
                + settings.JWT_SECRET
            ).encode("utf-8")
        ).hexdigest()

        return hmac.compare_digest(h, expected)

    except Exception:
        return False


def get_password_hash(password: str) -> str:
    import secrets

    salt = secrets.token_hex(8)

    h = hashlib.sha256(
        (
            salt
            + password
            + settings.JWT_SECRET
        ).encode("utf-8")
    ).hexdigest()

    return f"{salt}${h}"


# ============================================================
# JWT TOKEN
# ============================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None
) -> str:

    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = (
            datetime.utcnow()
            + timedelta(
                minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


# ============================================================
# CURRENT AUTHENTICATED FACILITY
# ============================================================

def get_current_facility(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Facility:
    """
    Extract the currently authenticated facility from
    the Bearer JWT token.

    No demo or unauthenticated fallback is allowed.
    """

    # --------------------------------------------------------
    # Authorization header required
    # --------------------------------------------------------

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    # --------------------------------------------------------
    # Bearer token required
    # --------------------------------------------------------

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )

    # --------------------------------------------------------
    # Extract token
    # --------------------------------------------------------

    token = authorization[len("Bearer "):].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing"
        )

    # --------------------------------------------------------
    # Decode and verify JWT
    # --------------------------------------------------------

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )

    # --------------------------------------------------------
    # Get facility ID from token
    # --------------------------------------------------------

    facility_id = payload.get("sub")

    if not facility_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

    # --------------------------------------------------------
    # Find facility
    # --------------------------------------------------------

    facility = (
        db.query(Facility)
        .filter(Facility.facility_id == facility_id)
        .first()
    )

    if not facility:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated facility not found"
        )

    return facility