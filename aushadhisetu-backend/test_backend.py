import sys
import os
from fastapi.testclient import TestClient

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
from app.seed import seed_database
from app.services.risk_engine import evaluate_medicine_risk
from app.services.matching_engine import calculate_haversine_distance, estimate_travel_time, evaluate_transfer_feasibility

def test_full_pipeline():
    print("\n--- 1. Testing Core Analytics Engines ---")
    
    # Test Risk Engine
    risk = evaluate_medicine_risk(quantity=30, daily_consumption=10, expiry_date_str="2026-10-01")
    assert risk["days_of_stock"] == 3, f"Expected 3 days of stock, got {risk['days_of_stock']}"
    assert risk["shortage_risk"] == "HIGH", f"Expected HIGH shortage risk, got {risk['shortage_risk']}"
    print("[PASS] Risk Engine: High shortage correctly predicted (3 days stock)")

    # Test Matching Engine
    dist = calculate_haversine_distance(28.4595, 77.0266, 28.6315, 77.2167)
    time_str, time_hrs = estimate_travel_time(dist)
    print(f"[PASS] Matching Engine: Haversine distance FAC-A to FAC-B = {dist} km, time = {time_str}")
    
    cold_check = evaluate_transfer_feasibility(
        distance_km=250.0,
        travel_time_hours=8.0,
        storage_requirement="2–8°C (cold chain)",
        destination_days_of_stock=4,
        source_available_qty=50,
        transfer_qty=15
    )
    assert cold_check["feasibility"] is False
    print("[PASS] Matching Engine: Cold-chain distance limit correctly blocked long route (feasibility=False)")

    print("\n--- 2. Testing Database Seeding & FastAPI Endpoints ---")
    with TestClient(app) as client:
        # Health check
        res = client.get("/")
        assert res.status_code == 200, res.text
        print("[PASS] GET / returned 200 OK")

        # Login
        res = client.post("/auth/login", json={"email": "admin@cityhospital.org", "password": "demo123"})
        assert res.status_code == 200, res.text
        login_data = res.json()
        assert login_data["facility_id"] == "FAC-B"
        token = login_data.get("access_token")
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        print("[PASS] POST /auth/login succeeded with facility_id: FAC-B")

        # Dashboard
        res = client.get("/dashboard", headers=headers)
        assert res.status_code == 200, res.text
        dash = res.json()
        assert "total_stock" in dash and "low_stock" in dash
        print(f"[PASS] GET /dashboard: Total stock = {dash['total_stock']}, Low stock = {dash['low_stock']}, Surplus count = {dash['surplus_count']}")

        # Inventory
        res = client.get("/inventory", headers=headers)
        assert res.status_code == 200, res.text
        inv = res.json()
        assert len(inv) >= 5
        print(f"[PASS] GET /inventory: Returned {len(inv)} medicines for facility")

        # Single medicine
        res = client.get("/medicine/MED001", headers=headers)
        assert res.status_code == 200, res.text
        med = res.json()
        assert med["medicine_id"] == "MED001"
        print(f"[PASS] GET /medicine/MED001: {med['name']} - Shortage Risk: {med['shortage_risk']}")

        # Alerts
        res = client.get("/alerts", headers=headers)
        assert res.status_code == 200, res.text
        alerts = res.json()
        print(f"[PASS] GET /alerts: Found {len(alerts)} alerts for facility")

        # Surplus
        res = client.get("/surplus", headers=headers)
        assert res.status_code == 200, res.text
        surplus = res.json()
        print(f"[PASS] GET /surplus: Found {len(surplus)} network surplus items")

        # Facilities
        res = client.get("/facilities", headers=headers)
        assert res.status_code == 200, res.text
        facs = res.json()
        assert len(facs) >= 3
        print(f"[PASS] GET /facilities: Found {len(facs)} connected facilities")

        # Recommendations
        res = client.get("/recommendations", headers=headers)
        assert res.status_code == 200, res.text
        recs = res.json()
        assert len(recs) >= 1
        rec_id = recs[0]["recommendation_id"]
        print(f"[PASS] GET /recommendations: Found {len(recs)} recommendations (Top: {rec_id})")

        # Create Transfer
        res = client.post("/transfer", json={"recommendation_id": rec_id}, headers=headers)
        assert res.status_code == 201, res.text
        trf = res.json()
        transfer_id = trf["transfer_id"]
        assert trf["status"] == "INITIATED"
        assert trf["payment_status"] == "PENDING"
        print(f"[PASS] POST /transfer: Initialized transfer {transfer_id}")

        # Process Payment via x402 -> GoPlausible -> Algorand
        res = client.post("/payment", json={"transfer_id": transfer_id}, headers=headers)
        assert res.status_code == 200, res.text
        pay = res.json()
        assert pay["status"] == "COMPLETED"
        assert pay["payment_status"] == "CONFIRMED"
        assert pay["transaction_id"].startswith("ALG-")
        print(f"[PASS] POST /payment: Confirmed Algorand on-chain settlement: {pay['transaction_id']}")

        # Get Transfer status
        res = client.get(f"/transfer/{transfer_id}", headers=headers)
        assert res.status_code == 200, res.text
        status_data = res.json()
        assert status_data["payment_status"] == "CONFIRMED"
        print(f"[PASS] GET /transfer/{transfer_id}: Verified completed state")

    print("\n========================================================")
    print(" ALL BACKEND TESTS & ALGORITHMIC PIPELINES PASSED! ")
    print("========================================================")

if __name__ == "__main__":
    test_full_pipeline()
