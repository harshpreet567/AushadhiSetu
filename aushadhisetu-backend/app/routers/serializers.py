from app.models import Medicine, Alert, Surplus, Facility, Recommendation, Transfer
from app.services.risk_engine import evaluate_medicine_risk

def serialize_medicine(medicine: Medicine) -> dict:
    """
    Serializes a Medicine ORM model into the API response format,
    dynamically evaluating AI risk predictions.
    """
    risk_info = evaluate_medicine_risk(
        quantity=medicine.quantity,
        daily_consumption=medicine.daily_consumption,
        expiry_date_str=medicine.expiry_date
    )

    return {
        "medicine_id": medicine.medicine_id,
        "name": medicine.name,
        "batch": medicine.batch,
        "quantity": medicine.quantity,
        "expiry_date": medicine.expiry_date,
        "daily_consumption": medicine.daily_consumption,
        "storage_requirement": medicine.storage_requirement,
        "facility_id": medicine.facility_id,
        "days_of_stock": risk_info["days_of_stock"],
        "shortage_risk": risk_info["shortage_risk"],
        "expiry_risk": risk_info["expiry_risk"],
        "potential_surplus": risk_info["potential_surplus"]
    }

def serialize_alert(alert: Alert) -> dict:
    return {
        "alert_id": alert.alert_id,
        "medicine_id": alert.medicine_id,
        "facility_id": alert.facility_id,
        "type": alert.type,
        "severity": alert.severity,
        "message": alert.message,
        "created_at": alert.created_at.isoformat() + "Z" if alert.created_at else None
    }

def serialize_surplus(surplus: Surplus) -> dict:
    return {
        "surplus_id": surplus.surplus_id,
        "medicine_id": surplus.medicine_id,
        "facility_id": surplus.facility_id,
        "available_quantity": surplus.available_quantity,
        "expiry_date": surplus.expiry_date,
        "status": surplus.status
    }

def serialize_facility(facility: Facility, current_facility_id: str = None) -> dict:
    return {
        "facility_id": facility.facility_id,
        "name": facility.name,
        "type": facility.type,
        "address": facility.address,
        "latitude": facility.latitude,
        "longitude": facility.longitude,
        "top": facility.top or "50%",
        "left": facility.left or "50%",
        "self": (facility.facility_id == current_facility_id) if current_facility_id else False
    }

def serialize_recommendation(rec: Recommendation) -> dict:
    return {
        "recommendation_id": rec.recommendation_id,
        "medicine_id": rec.medicine_id,
        "source_facility": rec.source_facility,
        "destination_facility": rec.destination_facility,
        "quantity": rec.quantity,
        "distance": rec.distance,
        "travel_time": rec.travel_time,
        "feasibility": rec.feasibility,
        "reason": rec.reason,
        "status": rec.status
    }

def serialize_transfer(transfer: Transfer) -> dict:
    return {
        "transfer_id": transfer.transfer_id,
        "recommendation_id": transfer.recommendation_id,
        "status": transfer.status,
        "payment_status": transfer.payment_status,
        "transaction_id": transfer.transaction_id,
        "created_at": transfer.created_at.isoformat() + "Z" if transfer.created_at else None
    }
