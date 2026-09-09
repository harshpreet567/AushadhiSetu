import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Facility, Medicine, Alert
from app.auth import get_current_facility
from app.schemas import MedicineResponse, MedicineCreate
from app.routers.serializers import serialize_medicine
from app.services.risk_engine import evaluate_medicine_risk, generate_risk_alerts

router = APIRouter(tags=["Inventory"])

@router.get("/inventory", response_model=List[MedicineResponse])
def get_inventory(
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Returns full medicine stock catalog for the authenticated facility,
    including AI risk scores, days of stock, and surplus potential.
    """
    medicines = db.query(Medicine).filter(Medicine.facility_id == current_facility.facility_id).all()
    return [serialize_medicine(m) for m in medicines]

@router.post("/inventory", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
def add_inventory(
    payload: MedicineCreate,
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Adds a new batch of medicines to inventory, executes risk evaluation,
    and automatically logs any resulting shortage or expiry alerts.
    """
    med_id = payload.medicine_id or f"MED{uuid.uuid4().hex[:4].upper()}"
    facility_id = payload.facility_id or current_facility.facility_id

    new_med = Medicine(
        medicine_id=med_id,
        name=payload.name,
        batch=payload.batch,
        quantity=payload.quantity,
        expiry_date=payload.expiry_date,
        daily_consumption=payload.daily_consumption,
        storage_requirement=payload.storage_requirement,
        facility_id=facility_id
    )
    db.add(new_med)

    # Evaluate AI risk and auto-generate alerts
    risk_info = evaluate_medicine_risk(new_med.quantity, new_med.daily_consumption, new_med.expiry_date)
    alerts_data = generate_risk_alerts(new_med.medicine_id, new_med.name, facility_id, risk_info)
    for a in alerts_data:
        db.add(Alert(
            alert_id=a["alert_id"] + f"-{uuid.uuid4().hex[:4]}",
            medicine_id=a["medicine_id"],
            facility_id=a["facility_id"],
            type=a["type"],
            severity=a["severity"],
            message=a["message"]
        ))

    db.commit()
    db.refresh(new_med)
    return serialize_medicine(new_med)

@router.get("/medicine/{id}", response_model=MedicineResponse)
def get_medicine_by_id(
    id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves details and risk assessment for a specific medicine item.
    """
    medicine = db.query(Medicine).filter(Medicine.medicine_id == id).first()
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID '{id}' not found"
        )
    return serialize_medicine(medicine)
