from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Facility(Base):
    __tablename__ = "facilities"

    facility_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False)  # Hospital, PHC, CHC, Pharmacy
    address = Column(String(300), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    top = Column(String(20), default="50%")    # Map position for preview
    left = Column(String(20), default="50%")   # Map position for preview
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    medicines = relationship("Medicine", back_populates="facility", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="facility", cascade="all, delete-orphan")
    surplus_items = relationship("Surplus", back_populates="facility", cascade="all, delete-orphan")


class Medicine(Base):
    __tablename__ = "medicines"

    medicine_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    batch = Column(String(100), nullable=False)
    quantity = Column(Integer, default=0, nullable=False)
    expiry_date = Column(String(50), nullable=False)  # ISO Date YYYY-MM-DD
    daily_consumption = Column(Integer, default=1, nullable=False)
    storage_requirement = Column(String(100), default="Room temperature")  # e.g., "Room temperature", "2–8°C (cold chain)"
    facility_id = Column(String(50), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("Facility", back_populates="medicines")
    alerts = relationship("Alert", back_populates="medicine", cascade="all, delete-orphan")
    surplus_records = relationship("Surplus", back_populates="medicine", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="medicine", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(String(50), primary_key=True, index=True)
    medicine_id = Column(String(50), ForeignKey("medicines.medicine_id"), nullable=False)
    facility_id = Column(String(50), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)       # SHORTAGE, EXPIRY
    severity = Column(String(50), nullable=False)   # HIGH, MEDIUM, LOW
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    medicine = relationship("Medicine", back_populates="alerts")
    facility = relationship("Facility", back_populates="alerts")


class Surplus(Base):
    __tablename__ = "surplus"

    surplus_id = Column(String(50), primary_key=True, index=True)
    medicine_id = Column(String(50), ForeignKey("medicines.medicine_id"), nullable=False)
    facility_id = Column(String(50), ForeignKey("facilities.facility_id"), nullable=False, index=True)
    available_quantity = Column(Integer, nullable=False)
    expiry_date = Column(String(50), nullable=False)
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, ALLOCATED, CLAIMED
    created_at = Column(DateTime, default=datetime.utcnow)

    medicine = relationship("Medicine", back_populates="surplus_records")
    facility = relationship("Facility", back_populates="surplus_items")


class Recommendation(Base):
    __tablename__ = "recommendations"

    recommendation_id = Column(String(50), primary_key=True, index=True)
    medicine_id = Column(String(50), ForeignKey("medicines.medicine_id"), nullable=False)
    source_facility = Column(String(50), ForeignKey("facilities.facility_id"), nullable=False)
    destination_facility = Column(String(50), ForeignKey("facilities.facility_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    distance = Column(String(50), nullable=False)      # e.g., "18 km"
    travel_time = Column(String(50), nullable=False)   # e.g., "45 min"
    feasibility = Column(Boolean, default=True)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING")     # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    medicine = relationship("Medicine", back_populates="recommendations")
    transfers = relationship("Transfer", back_populates="recommendation", cascade="all, delete-orphan")


class Transfer(Base):
    __tablename__ = "transfers"

    transfer_id = Column(String(50), primary_key=True, index=True)
    recommendation_id = Column(String(50), ForeignKey("recommendations.recommendation_id"), nullable=False)
    status = Column(String(50), default="INITIATED")          # INITIATED, IN_TRANSIT, COMPLETED, CANCELLED
    payment_status = Column(String(50), default="PENDING")    # PENDING, CONFIRMED, FAILED
    transaction_id = Column(String(100), nullable=True)       # Algorand TxID
    created_at = Column(DateTime, default=datetime.utcnow)

    recommendation = relationship("Recommendation", back_populates="transfers")
