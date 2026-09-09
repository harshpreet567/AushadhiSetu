from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Facility, Alert
from app.auth import get_current_facility
from app.schemas import AlertResponse
from app.routers.serializers import serialize_alert

router = APIRouter(tags=["Alerts"])

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Returns list of active shortage and expiry alerts for the current facility.
    """
    alerts = db.query(Alert).filter(Alert.facility_id == current_facility.facility_id).all()
    return [serialize_alert(a) for a in alerts]
