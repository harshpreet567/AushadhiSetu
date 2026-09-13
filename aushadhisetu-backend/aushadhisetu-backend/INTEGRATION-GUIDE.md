# AushadhiSetu — Frontend & Backend Integration Guide

This guide describes how to connect the **AushadhiSetu Frontend Prototype** (`aushadhisetu-frontend`) to the **FastAPI Backend** (`aushadhisetu-backend`).

---

## 1. Architecture Overview

The frontend interacts with the backend strictly through the **`api.js`** service layer. No React component communicates with data sources directly, meaning you can toggle between mock data and the live REST backend with a single configuration flag.

```
┌────────────────────────┐         HTTP / JSON          ┌────────────────────────┐
│  aushadhisetu-frontend │ ───────────────────────────> │  aushadhisetu-backend  │
│      (www/api.js)      │ <─────────────────────────── │     (FastAPI :8000)    │
└────────────────────────┘                              └────────────────────────┘
```

---

## 2. API Contract Specification

All endpoints communicate via standard JSON with snake_case property keys.

| Route | Method | Payload / Params | Response Shape | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | `{ email, password }` | `AuthFacilityResponse` | Returns facility object + JWT token |
| `/auth/signup` | `POST` | `{ facility_name, facility_type, location, email, password }` | `AuthFacilityResponse` | Registers new facility in network |
| `/auth/me` | `GET` | Bearer Token in Header | `AuthFacilityResponse` | Profile of current facility |
| `/dashboard` | `GET` | None | `{ total_stock, low_stock, expiring_soon, surplus_count, top_alert, top_recommendation }` | Summarized metrics & alerts |
| `/inventory` | `GET` | None | `List[MedicineResponse]` | Current facility's medicine stock |
| `/inventory` | `POST` | `MedicineCreate` | `MedicineResponse` | Ingests new batch, triggers risk checks |
| `/medicine/{id}` | `GET` | Medicine ID | `MedicineResponse` | Includes AI risk scores & days of stock |
| `/alerts` | `GET` | None | `List[AlertResponse]` | Shortage and expiry warnings |
| `/surplus` | `GET` | None | `List[SurplusResponse]` | Network-wide available surplus |
| `/facilities` | `GET` | None | `List[FacilityResponse]` | Coordinates & UI map pin coordinates |
| `/recommendations` | `GET` | None | `List[RecommendationResponse]` | AI-evaluated transfer recommendations |
| `/transfer` | `POST` | `{ recommendation_id }` | `TransferResponse` | Initializes transfer (Status: INITIATED) |
| `/payment` | `POST` | `{ transfer_id }` | `TransferResponse` | Triggers x402 → GoPlausible → Algorand |
| `/transfer/{id}` | `GET` | Transfer ID | `TransferResponse` | Current verification and status |

---

## 3. How to Connect `api.js` to the Real Backend

In `aushadhisetu-frontend/www/api.js`:

```javascript
// 1. Set the live backend URL
const API_BASE = "http://localhost:8000";

// 2. Set USE_REAL_BACKEND to true (or automatic detection)
const USE_REAL_BACKEND = true;

// Example real fetch implementation inside api.js:
const api = {
  async login(payload) {
    if (!USE_REAL_BACKEND) { ... }
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("aushadhisetu_token", data.access_token);
    }
    return data;
  },

  async getDashboard() {
    if (!USE_REAL_BACKEND) { ... }
    const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
    return res.json();
  },
  ...
};
```

---

## 4. Running the Complete System Locally

### Step 1: Start Backend (Terminal 1)
```bash
cd aushadhisetu-backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to test interactive Swagger documentation.

### Step 2: Start Frontend (Terminal 2)
```bash
cd aushadhisetu-frontend/www
# You can use any lightweight static server:
python -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) to access the application UI.

---

## 5. Security & Authentication Flow
- When a facility logs in or registers, the server generates an HMAC-SHA256 authenticated JWT access token.
- The frontend includes the token in the HTTP header:
  `Authorization: Bearer <access_token>`
- In development/demo mode, if no `Authorization` header is passed, the backend automatically defaults to `FAC-B` (City General Hospital), allowing zero-friction exploration.
