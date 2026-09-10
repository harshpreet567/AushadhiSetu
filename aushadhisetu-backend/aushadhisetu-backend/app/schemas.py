from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class SignupRequest(BaseModel):
    facility_name: str
    facility_type: str = "Hospital"
    location: str
    email: str
    password: str

class AuthFacilityResponse(BaseModel):
    facility_id: str
    name: str
    type: str
    address: str
    latitude: float
    longitude: float
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"

    class Config:
        from_attributes = True

# --- Facility Schemas ---
class FacilityResponse(BaseModel):
    facility_id: str
    name: str
    type: str
    address: str
    latitude: float
    longitude: float
    top: Optional[str] = "50%"
    left: Optional[str] = "50%"
    self: Optional[bool] = False

    class Config:
        from_attributes = True

# --- Medicine & Inventory Schemas ---
class MedicineCreate(BaseModel):
    medicine_id: Optional[str] = None
    name: str
    batch: str
    quantity: int
    expiry_date: str
    daily_consumption: int
    storage_requirement: str = "Room temperature"
    facility_id: Optional[str] = None

class MedicineResponse(BaseModel):
    medicine_id: str
    name: str
    batch: str
    quantity: int
    expiry_date: str
    daily_consumption: int
    storage_requirement: str
    facility_id: str
    days_of_stock: int
    shortage_risk: str
    expiry_risk: str
    potential_surplus: int

    class Config:
        from_attributes = True

# --- Alert Schemas ---
class AlertResponse(BaseModel):
    alert_id: str
    medicine_id: str
    facility_id: str
    type: str
    severity: str
    message: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# --- Surplus Schemas ---
class SurplusResponse(BaseModel):
    surplus_id: str
    medicine_id: str
    facility_id: str
    available_quantity: int
    expiry_date: str
    status: str

    class Config:
        from_attributes = True

# --- Recommendation Schemas ---
class RecommendationResponse(BaseModel):
    recommendation_id: str
    medicine_id: str
    source_facility: str
    destination_facility: str
    quantity: int
    distance: str
    travel_time: str
    feasibility: bool
    reason: str
    status: str

    class Config:
        from_attributes = True

# --- Transfer & Payment Schemas ---
class TransferCreateRequest(BaseModel):
    recommendation_id: str

class PaymentRequest(BaseModel):
    transfer_id: str

class TransferResponse(BaseModel):
    transfer_id: str
    recommendation_id: str
    status: str
    payment_status: str
    transaction_id: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# --- Dashboard Summary ---
class DashboardResponse(BaseModel):
    total_stock: int
    low_stock: int
    expiring_soon: int
    surplus_count: int
    top_alert: Optional[AlertResponse] = None
    top_recommendation: Optional[RecommendationResponse] = None
