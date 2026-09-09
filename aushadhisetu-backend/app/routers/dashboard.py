from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Facility, Medicine, Alert, Recommendation
from app.auth import get_current_facility
from app.schemas import DashboardResponse
from app.services.risk_engine import evaluate_medicine_risk
from app.routers.serializers import serialize_alert, serialize_recommendation

router = APIRouter(tags=["Dashboard"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Computes real-time facility metrics:
    - total_stock
    - low_stock count (days_of_stock <= 5)
    - expiring_soon count
    - surplus_count
    - top active alert
    - top recommendation
    """
    facility_id = current_facility.facility_id

    # Fetch medicines for the current facility
    medicines = db.query(Medicine).filter(Medicine.facility_id == facility_id).all()

    total_stock = 0
    low_stock = 0
    expiring_soon = 0
    surplus_count = 0

    for med in medicines:
        total_stock += med.quantity
        risk = evaluate_medicine_risk(med.quantity, med.daily_consumption, med.expiry_date)
        if risk["days_of_stock"] <= 5:
            low_stock += 1
        if risk["expiry_risk"] in ("HIGH", "MEDIUM"):
            expiring_soon += 1
        if risk["potential_surplus"] > 0:
            surplus_count += 1

    # Fetch top alert for facility
    top_alert_orm = db.query(Alert).filter(Alert.facility_id == facility_id).first()
    top_alert = serialize_alert(top_alert_orm) if top_alert_orm else None

    # Fetch top recommendation (where this facility is destination or source)
    top_rec_orm = db.query(Recommendation).filter(
        (Recommendation.destination_facility == facility_id) | (Recommendation.source_facility == facility_id)
    ).first()
    if not top_rec_orm:
        top_rec_orm = db.query(Recommendation).first()

    top_rec = serialize_recommendation(top_rec_orm) if top_rec_orm else None

    return {
        "total_stock": total_stock,
        "low_stock": low_stock,
        "expiring_soon": expiring_soon,
        "surplus_count": surplus_count,
        "top_alert": top_alert,
        "top_recommendation": top_rec
    }
