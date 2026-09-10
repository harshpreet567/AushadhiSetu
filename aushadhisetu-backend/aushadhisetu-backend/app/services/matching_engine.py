import math
from typing import Dict, Any, Tuple

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates great-circle distance between two GPS coordinates in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 1)

def estimate_travel_time(distance_km: float) -> Tuple[str, float]:
    """
    Estimates realistic medical courier transit time.
    Returns (human_readable_str, hours_float).
    """
    if distance_km <= 1.0:
        return "10 min", 0.16

    # Urban / regional blended transit speed: ~35 km/h in metro corridors
    hours = distance_km / 35.0
    minutes = int(hours * 60)

    if minutes < 60:
        return f"{max(15, minutes)} min", hours
    else:
        hrs = int(round(hours))
        return f"~{hrs} hours" if hrs > 1 else "~1 hour", hours

def evaluate_transfer_feasibility(
    distance_km: float,
    travel_time_hours: float,
    storage_requirement: str,
    destination_days_of_stock: int,
    source_available_qty: int,
    transfer_qty: int
) -> Dict[str, Any]:
    """
    Decision rule assessing logistics feasibility for medicine transfer.
    Considers:
    1. Cold-chain storage degradation risks
    2. Distance and travel urgency
    3. Quantity fulfillment
    """
    storage_lower = storage_requirement.lower()
    is_cold_chain = ("cold chain" in storage_lower) or ("2–8" in storage_lower) or ("2-8" in storage_lower)

    # Rule 1: Cold chain products have strict transport windows without specialized reefers
    if is_cold_chain and (distance_km > 60.0 or travel_time_hours > 2.5):
        return {
            "feasibility": False,
            "reason": "Distance and travel time do not fit the urgency window for a cold-chain product."
        }

    # Rule 2: General distance limits based on emergency urgency
    if destination_days_of_stock <= 3 and distance_km > 150.0:
        return {
            "feasibility": False,
            "reason": f"Urgent shortage ({destination_days_of_stock} days stock left) cannot wait for {distance_km} km transit."
        }

    # Rule 3: Extreme distance boundary
    if distance_km > 220.0:
        return {
            "feasibility": False,
            "reason": f"Facility distance ({distance_km} km) exceeds operational transfer threshold."
        }

    # Rule 4: Quantity check
    if source_available_qty < transfer_qty:
        return {
            "feasibility": False,
            "reason": f"Source facility has only {source_available_qty} units available, {transfer_qty} requested."
        }

    return {
        "feasibility": True,
        "reason": "Correct medicine, enough quantity, suitable expiry, close enough, travel time fits urgency."
    }
