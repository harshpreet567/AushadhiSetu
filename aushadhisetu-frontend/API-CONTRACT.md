# AushadhiSetu — Frontend API Data Format Reference

All backend communication follows the JSON schema contracts defined below.

---

## 1. Facility Profile (`/auth/login`, `/auth/signup`, `/auth/me`)
```json
{
  "facility_id": "FAC-B",
  "name": "City General Hospital",
  "type": "Hospital",
  "address": "Connaught Place, New Delhi",
  "latitude": 28.6315,
  "longitude": 77.2167,
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer"
}
```

---

## 2. Dashboard (`GET /dashboard`)
```json
{
  "total_stock": 1282,
  "low_stock": 2,
  "expiring_soon": 2,
  "surplus_count": 2,
  "top_alert": {
    "alert_id": "ALR001",
    "medicine_id": "MED001",
    "facility_id": "FAC-B",
    "type": "SHORTAGE",
    "severity": "HIGH",
    "message": "Paracetamol 500mg may run out in 3 days."
  },
  "top_recommendation": {
    "recommendation_id": "REC001",
    "medicine_id": "MED001",
    "source_facility": "FAC-A",
    "destination_facility": "FAC-B",
    "quantity": 50,
    "distance": "18 km",
    "travel_time": "45 min",
    "feasibility": true,
    "reason": "Correct medicine, enough quantity, suitable expiry, close enough, travel time fits urgency."
  }
}
```

---

## 3. Medicine Catalog (`GET /inventory`, `GET /medicine/:id`)
```json
{
  "medicine_id": "MED001",
  "name": "Paracetamol 500mg",
  "batch": "PCT102",
  "quantity": 30,
  "expiry_date": "2026-10-01",
  "daily_consumption": 10,
  "storage_requirement": "Room temperature",
  "facility_id": "FAC-B",
  "days_of_stock": 3,
  "shortage_risk": "HIGH",
  "expiry_risk": "LOW",
  "potential_surplus": 0
}
```

---

## 4. Transfers & Blockchain Settlement (`POST /transfer`, `POST /payment`, `GET /transfer/:id`)

### Initiated Transfer:
```json
{
  "transfer_id": "TRF102",
  "recommendation_id": "REC001",
  "status": "INITIATED",
  "payment_status": "PENDING",
  "transaction_id": null,
  "created_at": "2026-09-09T16:00:00Z"
}
```

### Confirmed Transfer:
```json
{
  "transfer_id": "TRF102",
  "recommendation_id": "REC001",
  "status": "COMPLETED",
  "payment_status": "CONFIRMED",
  "transaction_id": "ALG-78F9A1B2",
  "created_at": "2026-09-09T16:00:00Z"
}
```
