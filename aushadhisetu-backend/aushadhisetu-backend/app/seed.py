from datetime import datetime
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import Facility, Medicine, Alert, Surplus, Recommendation, Transfer
from app.auth import get_password_hash

def seed_database(db: Session = None):
    """
    Initializes database tables and populates baseline demo data
    matching the AushadhiSetu frontend specification.
    """
    Base.metadata.create_all(bind=engine)

    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        # Check if already seeded
        if db.query(Facility).first():
            return

        # 1. Facilities
        facilities = [
            Facility(
                facility_id="FAC-A",
                name="Sunrise Primary Health Centre",
                type="PHC",
                address="Gurugram, Haryana",
                latitude=28.4595,
                longitude=77.0266,
                email="sunrise.phc@facility.org",
                hashed_password=get_password_hash("demo123"),
                top="62%",
                left="18%"
            ),
            Facility(
                facility_id="FAC-B",
                name="City General Hospital",
                type="Hospital",
                address="Connaught Place, New Delhi",
                latitude=28.6315,
                longitude=77.2167,
                email="admin@cityhospital.org",
                hashed_password=get_password_hash("demo123"),
                top="40%",
                left="52%"
            ),
            Facility(
                facility_id="FAC-C",
                name="Alwar Rural Health Centre",
                type="CHC",
                address="Alwar, Rajasthan",
                latitude=27.5530,
                longitude=76.6346,
                email="alwar.chc@facility.org",
                hashed_password=get_password_hash("demo123"),
                top="78%",
                left="70%"
            ),
        ]
        db.add_all(facilities)
        db.commit()

        # 2. Medicines for Facility B
        medicines = [
            Medicine(
                medicine_id="MED001",
                name="Paracetamol 500mg",
                batch="PCT102",
                quantity=30,
                expiry_date="2026-10-01",
                daily_consumption=10,
                storage_requirement="Room temperature",
                facility_id="FAC-B"
            ),
            Medicine(
                medicine_id="MED002",
                name="Amoxicillin 250mg",
                batch="AMX061",
                quantity=180,
                expiry_date="2026-12-15",
                daily_consumption=14,
                storage_requirement="Room temperature",
                facility_id="FAC-B"
            ),
            Medicine(
                medicine_id="MED003",
                name="ORS Sachets",
                batch="ORS220",
                quantity=640,
                expiry_date="2027-02-20",
                daily_consumption=22,
                storage_requirement="Room temperature",
                facility_id="FAC-B"
            ),
            Medicine(
                medicine_id="MED004",
                name="Insulin Glargine",
                batch="INS014",
                quantity=22,
                expiry_date="2026-09-30",
                daily_consumption=6,
                storage_requirement="2–8°C (cold chain)",
                facility_id="FAC-B"
            ),
            Medicine(
                medicine_id="MED005",
                name="Azithromycin 500mg",
                batch="AZT303",
                quantity=410,
                expiry_date="2026-09-25",
                daily_consumption=9,
                storage_requirement="Room temperature",
                facility_id="FAC-B"
            ),
        ]
        db.add_all(medicines)
        db.commit()

        # 3. Active Alerts
        alerts = [
            Alert(
                alert_id="ALR001",
                medicine_id="MED001",
                facility_id="FAC-B",
                type="SHORTAGE",
                severity="HIGH",
                message="Paracetamol 500mg may run out in 3 days.",
                created_at=datetime(2026, 9, 6, 8, 0, 0)
            ),
            Alert(
                alert_id="ALR002",
                medicine_id="MED005",
                facility_id="FAC-B",
                type="EXPIRY",
                severity="MEDIUM",
                message="175 units of Azithromycin 500mg may remain unused before expiry.",
                created_at=datetime(2026, 9, 6, 8, 0, 0)
            ),
            Alert(
                alert_id="ALR003",
                medicine_id="MED004",
                facility_id="FAC-B",
                type="SHORTAGE",
                severity="HIGH",
                message="Insulin Glargine may run out in 4 days.",
                created_at=datetime(2026, 9, 6, 8, 0, 0)
            ),
        ]
        db.add_all(alerts)

        # 4. Available Surplus Stock
        surplus = [
            Surplus(
                surplus_id="SUR001",
                medicine_id="MED001",
                facility_id="FAC-A",
                available_quantity=100,
                expiry_date="2026-11-05",
                status="AVAILABLE"
            ),
            Surplus(
                surplus_id="SUR002",
                medicine_id="MED001",
                facility_id="FAC-C",
                available_quantity=250,
                expiry_date="2026-09-16",
                status="AVAILABLE"
            ),
        ]
        db.add_all(surplus)

        # 5. Smart Recommendations
        recommendations = [
            Recommendation(
                recommendation_id="REC001",
                medicine_id="MED001",
                source_facility="FAC-A",
                destination_facility="FAC-B",
                quantity=50,
                distance="18 km",
                travel_time="45 min",
                feasibility=True,
                reason="Correct medicine, enough quantity, suitable expiry, close enough, travel time fits urgency.",
                status="PENDING"
            ),
            Recommendation(
                recommendation_id="REC002",
                medicine_id="MED004",
                source_facility="FAC-C",
                destination_facility="FAC-B",
                quantity=15,
                distance="250 km",
                travel_time="~8 hours",
                feasibility=False,
                reason="Distance and travel time do not fit the urgency window for a cold-chain product.",
                status="PENDING"
            ),
        ]
        db.add_all(recommendations)
        db.commit()

    finally:
        if close_db:
            db.close()

if __name__ == "__main__":
    print("Seeding AushadhiSetu database...")
    seed_database()
    print("Database seeded successfully!")
