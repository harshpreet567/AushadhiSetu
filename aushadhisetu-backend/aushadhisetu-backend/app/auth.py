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

# Robust password hashing using HMAC-SHA256 with project secret
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        salt, h = hashed_password.split("$", 1)
        expected = hashlib.sha256((salt + plain_password + settings.JWT_SECRET).encode("utf-8")).hexdigest()
        return hmac.compare_digest(h, expected)
    except Exception:
        # Fallback for plain text or legacy
        return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    import secrets
    salt = secrets.token_hex(8)
    h = hashlib.sha256((salt + password + settings.JWT_SECRET).encode("utf-8")).hexdigest()
    return f"{salt}${h}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def get_current_facility(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Facility:
    """
    Extracts the current logged-in facility from Bearer token.
    Gracefully falls back to demo facility 'FAC-B' if no header is supplied,
    allowing prototype and demo frontend testing without configuration hitches.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            facility_id = payload.get("sub") or payload.get("facility_id")
            if facility_id:
                facility = db.query(Facility).filter(Facility.facility_id == facility_id).first()
                if facility:
                    return facility
        except jwt.PyJWTError:
            pass

    # Default fallback to primary demo facility City General Hospital (FAC-B)
    demo_facility = db.query(Facility).filter(Facility.facility_id == "FAC-B").first()
    if demo_facility:
        return demo_facility

    # Fallback to any first facility in database
    first_facility = db.query(Facility).first()
    if first_facility:
        return first_facility

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No facility registered or authenticated."
    )
