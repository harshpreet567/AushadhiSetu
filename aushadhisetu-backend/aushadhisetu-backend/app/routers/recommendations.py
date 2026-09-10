from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Recommendation, Facility, Medicine, Surplus
from app.auth import get_current_facility
from app.schemas import RecommendationResponse
from app.routers.serializers import serialize_recommendation
from app.services.matching_engine import (
    calculate_haversine_distance,
    estimate_travel_time,
    evaluate_transfer_feasibility
)
from app.services.risk_engine import evaluate_medicine_risk

router = APIRouter(tags=["Recommendations"])

@router.get("/recommendations", response_model=List[RecommendationResponse])
def get_recommendations(
    current_facility: Facility = Depends(get_current_facility),
    db: Session = Depends(get_db)
):
    """
    Returns AI & logistics recommendations.
    Brings together shortage risk assessment, surplus discovery,
    Haversine distance calculation, and transport feasibility evaluation.
    """
    recs = db.query(Recommendation).all()
    if recs:
        return [serialize_recommendation(r) for r in recs]

    # If no pre-existing recommendations, dynamically generate from network state
    shortage_meds = db.query(Medicine).all()
    generated_recs = []

    for med in shortage_meds:
        risk = evaluate_medicine_risk(med.quantity, med.daily_consumption, med.expiry_date)
        if risk["shortage_risk"] in ("HIGH", "MEDIUM"):
            # Find surplus of same medicine at other facilities
            surpluses = db.query(Surplus).filter(
                Surplus.medicine_id == med.medicine_id,
                Surplus.facility_id != med.facility_id,
                Surplus.status == "AVAILABLE"
            ).all()

            for sur in surpluses:
                src_fac = db.query(Facility).filter(Facility.facility_id == sur.facility_id).first()
                dest_fac = db.query(Facility).filter(Facility.facility_id == med.facility_id).first()

                if src_fac and dest_fac:
                    dist_km = calculate_haversine_distance(
                        src_fac.latitude, src_fac.longitude,
                        dest_fac.latitude, dest_fac.longitude
                    )
                    time_str, time_hrs = estimate_travel_time(dist_km)
                    transfer_qty = min(50, sur.available_quantity)

                    feasibility_res = evaluate_transfer_feasibility(
                        distance_km=dist_km,
                        travel_time_hours=time_hrs,
                        storage_requirement=med.storage_requirement,
                        destination_days_of_stock=risk["days_of_stock"],
                        source_available_qty=sur.available_quantity,
                        transfer_qty=transfer_qty
                    )

                    rec_id = f"REC{len(generated_recs) + 1:03d}"
                    rec_obj = Recommendation(
                        recommendation_id=rec_id,
                        medicine_id=med.medicine_id,
                        source_facility=src_fac.facility_id,
                        destination_facility=dest_fac.facility_id,
                        quantity=transfer_qty,
                        distance=f"{dist_km} km",
                        travel_time=time_str,
                        feasibility=feasibility_res["feasibility"],
                        reason=feasibility_res["reason"],
                        status="PENDING"
                    )
                    db.add(rec_obj)
                    generated_recs.append(rec_obj)

    if generated_recs:
        db.commit()
        return [serialize_recommendation(r) for r in generated_recs]

    return []
