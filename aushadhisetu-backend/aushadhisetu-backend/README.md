# AushadhiSetu — Backend API

> **Right Medicine · Right Facility · Right Time**
> A distributed medicine inventory redistribution, shortage forecasting, and verifiable settlement network.

---

## 🌟 Key Features

1. **AI Shortage & Expiry Risk Engine (`services/risk_engine.py`)**
   - Automatically computes dynamic **Days of Stock** based on consumption velocities.
   - Evaluates **Shortage Risk** (HIGH, MEDIUM, LOW) and raises automated proactive warnings.
   - Computes **Days to Expiry** and **Potential Surplus** to prevent costly pharmaceutical waste.

2. **Spatial & Cold-Chain Matching Engine (`services/matching_engine.py`)**
   - Calculates exact geodesic distance between healthcare centers using the **Haversine Formula**.
   - Assesses courier transit durations.
   - Enforces **Cold-Chain Logistics Constraints** (2–8°C items like Insulin cannot exceed critical transit radii).

3. **Verifiable Settlement Pipeline (`services/blockchain.py`)**
   - Incorporates the **x402 HTTP Payment Protocol**.
   - Integrates with the **GoPlausible Escrow Facilitator** to lock and verify shipments.
   - Generates immutable on-chain transfer proofs broadcasted to the **Algorand Testnet**.

4. **REST API (`routers/`)**
   - Clean FastAPI design with interactive Swagger/OpenAPI documentation.
   - Full CORS support for web and mobile Capacitor frontends.
   - Auto-seeding mechanism for demo scenarios.

---

## 📁 Directory Layout

```
aushadhisetu-backend/
├── .env.example              # Environment variables template
├── .gitignore                # Python and environment ignore rules
├── requirements.txt          # Python dependencies
├── README.md                 # System overview and instructions
├── INTEGRATION-GUIDE.md      # Frontend to backend connection guide
├── FLOWCHART.md              # System flowcharts and architecture diagrams
└── app/
    ├── __init__.py           # Application module init
    ├── main.py               # FastAPI entrypoint, CORS & routes
    ├── config.py             # System settings & environment variables
    ├── database.py           # SQLite / SQLAlchemy connection
    ├── models.py             # Facility, Medicine, Transfer, Alert, Surplus ORM
    ├── schemas.py            # Pydantic request/response contracts
    ├── auth.py               # Password hashing & JWT token verification
    ├── seed.py               # Demo database seeder
    ├── routers/
    │   ├── __init__.py
    │   ├── auth.py           # POST /auth/login, /auth/signup, GET /auth/me
    │   ├── dashboard.py      # GET /dashboard
    │   ├── inventory.py      # GET/POST /inventory, GET /medicine/{id}
    │   ├── alerts.py         # GET /alerts
    │   ├── surplus.py        # GET /surplus
    │   ├── facilities.py     # GET /facilities
    │   ├── recommendations.py# GET /recommendations
    │   ├── transfers.py      # POST /transfer, /payment, GET /transfer/{id}
    │   └── serializers.py    # ORM to JSON serializer helpers
    └── services/
        ├── __init__.py
        ├── risk_engine.py    # Shortage & expiry predictive engine
        ├── matching_engine.py# Haversine distance & cold-chain feasibility
        └── blockchain.py     # x402 -> GoPlausible -> Algorand settlement
```

---

## 🚀 Quickstart

### 1. Requirements
- Python 3.10+
- pip

### 2. Installation
```bash
# Clone or navigate to backend folder
cd aushadhisetu-backend

# Install dependencies
pip install -r requirements.txt
```

### 3. Running the Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The server will automatically create the SQLite database `aushadhisetu.db` and populate demo facilities (`FAC-A`, `FAC-B`, `FAC-C`) and stock items (`MED001`–`MED005`).

### 4. Interactive API Documentation
Open your browser to:
- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
