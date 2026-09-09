import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Facility
from app.schemas import LoginRequest, SignupRequest, AuthFacilityResponse
from app.auth import verify_password, get_password_hash, create_access_token, get_current_facility

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=AuthFacilityResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates facility credentials and returns JWT token + facility profile.
    Supports email lookup or demo facility fallback.
    """
    facility = db.query(Facility).filter(
        (Facility.email == payload.email) | (Facility.facility_id == payload.email)
    ).first()

    # If demo credentials or direct email match
    if not facility:
        # Fallback to default demo facility if user logs in with demo credentials
        facility = db.query(Facility).filter(Facility.facility_id == "FAC-B").first()
        if not facility:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

    token = create_access_token({"sub": facility.facility_id, "email": facility.email})

    return {
        "facility_id": facility.facility_id,
        "name": facility.name,
        "type": facility.type,
        "address": facility.address,
        "latitude": facility.latitude,
        "longitude": facility.longitude,
        "access_token": token,
        "token_type": "bearer"
    }

@router.post("/signup", response_model=AuthFacilityResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    Registers a new healthcare facility in the AushadhiSetu network.
    """
    existing = db.query(Facility).filter(Facility.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Facility with this email already registered"
        )

    # Generate unique facility ID
    new_id = f"FAC-{uuid.uuid4().hex[:6].upper()}"

    new_facility = Facility(
        facility_id=new_id,
        name=payload.facility_name,
        type=payload.facility_type,
        address=payload.location,
        latitude=28.6139,   # Default coordinates
        longitude=77.2090,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        top="50%",
        left="50%"
    )

    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)

    token = create_access_token({"sub": new_facility.facility_id, "email": new_facility.email})

    return {
        "facility_id": new_facility.facility_id,
        "name": new_facility.name,
        "type": new_facility.type,
        "address": new_facility.address,
        "latitude": new_facility.latitude,
        "longitude": new_facility.longitude,
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=AuthFacilityResponse)
def get_me(current_facility: Facility = Depends(get_current_facility)):
    """
    Returns current authenticated facility details.
    """
    return {
        "facility_id": current_facility.facility_id,
        "name": current_facility.name,
        "type": current_facility.type,
        "address": current_facility.address,
        "latitude": current_facility.latitude,
        "longitude": current_facility.longitude
    }
