from datetime import datetime, date
from typing import Dict, Any, Optional

# Reference baseline date for demonstration simulations (matching the prototype's timeline)
DEFAULT_REFERENCE_DATE = date(2026, 9, 9)

def parse_date(date_str: str) -> date:
    """Parses ISO date string (YYYY-MM-DD)."""
    try:
        return datetime.strptime(date_str[:10], "%Y-%m-%d").date()
    except Exception:
        return datetime.utcnow().date()

def evaluate_medicine_risk(
    quantity: int,
    daily_consumption: int,
    expiry_date_str: str,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    AI / Predictive Rule Engine for Medicine Risk Assessment.
    Calculates:
    - days_of_stock
    - shortage_risk (HIGH, MEDIUM, LOW)
    - expiry_risk (HIGH, MEDIUM, LOW)
    - potential_surplus
    """
    ref_date = reference_date or DEFAULT_REFERENCE_DATE
    exp_date = parse_date(expiry_date_str)
    
    # 1. Days of Stock Calculation
    if daily_consumption > 0:
        days_of_stock = quantity // daily_consumption
    else:
        days_of_stock = 999

    # 2. Shortage Risk Classification
    if days_of_stock <= 5:
        shortage_risk = "HIGH"
    elif days_of_stock <= 10:
        shortage_risk = "MEDIUM"
    else:
        shortage_risk = "LOW"

    # 3. Days to Expiry Calculation
    days_to_expiry = (exp_date - ref_date).days
    days_to_expiry = max(0, days_to_expiry)

    # 4. Consumable units vs Potential Surplus
    consumable_units = days_to_expiry * daily_consumption
    potential_surplus = max(0, quantity - consumable_units)

    # 5. Expiry Risk Classification
    if days_to_expiry <= 30 and potential_surplus > 0:
        if potential_surplus > (quantity * 0.3) or days_to_expiry <= 15:
            expiry_risk = "HIGH"
        else:
            expiry_risk = "MEDIUM"
    elif potential_surplus > 0:
        expiry_risk = "MEDIUM"
    else:
        expiry_risk = "LOW"

    return {
        "days_of_stock": days_of_stock,
        "days_to_expiry": days_to_expiry,
        "shortage_risk": shortage_risk,
        "expiry_risk": expiry_risk,
        "potential_surplus": potential_surplus
    }

def generate_risk_alerts(
    medicine_id: str,
    medicine_name: str,
    facility_id: str,
    risk_data: Dict[str, Any]
) -> list[Dict[str, Any]]:
    """
    Generates actionable alert payloads based on evaluated risk.
    """
    alerts = []
    
    # Shortage Alert
    if risk_data["shortage_risk"] in ("HIGH", "MEDIUM"):
        alerts.append({
            "alert_id": f"ALR-S-{medicine_id}",
            "medicine_id": medicine_id,
            "facility_id": facility_id,
            "type": "SHORTAGE",
            "severity": risk_data["shortage_risk"],
            "message": f"{medicine_name} may run out in {risk_data['days_of_stock']} days.",
            "created_at": datetime.utcnow().isoformat() + "Z"
        })

    # Expiry Alert
    if risk_data["expiry_risk"] in ("HIGH", "MEDIUM") and risk_data["potential_surplus"] > 0:
        alerts.append({
            "alert_id": f"ALR-E-{medicine_id}",
            "medicine_id": medicine_id,
            "facility_id": facility_id,
            "type": "EXPIRY",
            "severity": risk_data["expiry_risk"],
            "message": f"{risk_data['potential_surplus']} units of {medicine_name} may remain unused before expiry.",
            "created_at": datetime.utcnow().isoformat() + "Z"
        })

    return alerts
