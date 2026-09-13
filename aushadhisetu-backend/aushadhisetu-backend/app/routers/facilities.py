from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Facility
from app.auth import get_current_facility
from app.schemas import FacilityResponse
from app.routers.serializers import serialize_facility

router = APIRouter(tags=["Facilities"])

@router.get("/facilities", response_model=List[FacilityResponse])
def get_facilities(
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Returns list of connected facilities in the healthcare network,
    including geographic coordinates and UI map pin positions.
    """
    facilities = db.query(Facility).all()
    return [serialize_facility(f, current_facility.facility_id) for f in facilities]
