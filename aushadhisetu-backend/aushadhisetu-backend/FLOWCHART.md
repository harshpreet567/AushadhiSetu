# AushadhiSetu — System Architecture & Workflow Flowcharts

> **Right Medicine · Right Facility · Right Time**
> A network that spots shortages before they happen and coordinates surplus redistribution across connected healthcare facilities with verifiable cryptographic settlement.

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Frontend ["Client Layer (Web & Capacitor App)"]
        UI[React + Babel UI]
        API_JS[api.js Data Boundary]
    end

    subgraph Backend ["FastAPI Application"]
        Main[main.py: App & CORS]
        AuthRouter[routers/auth.py]
        DashRouter[routers/dashboard.py]
        InvRouter[routers/inventory.py]
        AlertRouter[routers/alerts.py]
        SurplusRouter[routers/surplus.py]
        FacRouter[routers/facilities.py]
        RecRouter[routers/recommendations.py]
        TrfRouter[routers/transfers.py]
        Serializers[routers/serializers.py]
    end

    subgraph Services ["Core Intelligence & Services"]
        RiskEngine[services/risk_engine.py]
        MatchingEngine[services/matching_engine.py]
        BlockchainService[services/blockchain.py]
    end

    subgraph Storage ["Persistence & Settlement"]
        DB[(SQLite / PostgreSQL via SQLAlchemy)]
        AlgoNet[(Algorand Ledger & x402 Protocol)]
    end

    UI --> API_JS
    API_JS --> Main
    Main --> AuthRouter & DashRouter & InvRouter & AlertRouter & SurplusRouter & FacRouter & RecRouter & TrfRouter
    InvRouter --> RiskEngine
    DashRouter --> RiskEngine
    RecRouter --> MatchingEngine
    TrfRouter --> BlockchainService
    RiskEngine & MatchingEngine --> Serializers
    Serializers --> DB
    BlockchainService --> AlgoNet
```

---

## 2. Risk Engine Workflow (AI Shortage & Expiry Predictor)

The predictive risk engine analyzes consumption rates and expiration dates to proactively classify stock levels.

```mermaid
flowchart TD
    Start([Medicine Batch Evaluated]) --> Inputs[Extract: Quantity, Daily Consumption, Expiry Date]
    Inputs --> CalcDOS["Calculate Days of Stock: (Quantity / Daily Consumption)"]
    Inputs --> CalcDTE["Calculate Days to Expiry: (Expiry Date - Today)"]

    CalcDOS --> CheckShortage{"Days of Stock <= 5?"}
    CheckShortage -- Yes --> HighShortage["Shortage Risk: HIGH"]
    CheckShortage -- No --> CheckMedShortage{"Days of Stock <= 10?"}
    CheckMedShortage -- Yes --> MedShortage["Shortage Risk: MEDIUM"]
    CheckMedShortage -- No --> LowShortage["Shortage Risk: LOW"]

    CalcDTE --> CalcSurplus["Consumable Units = Days to Expiry * Daily Consumption<br/>Potential Surplus = max(0, Quantity - Consumable Units)"]
    CalcSurplus --> CheckExpiryCrit{"Days to Expiry <= 30 AND Potential Surplus > 0?"}
    CheckExpiryCrit -- Yes --> CheckSevere{"Surplus > 30% of Stock OR Days to Expiry <= 15?"}
    CheckSevere -- Yes --> HighExpiry["Expiry Risk: HIGH"]
    CheckSevere -- No --> MedExpiry["Expiry Risk: MEDIUM"]
    CheckExpiryCrit -- No --> CheckSurplusExists{"Potential Surplus > 0?"}
    CheckSurplusExists -- Yes --> MedExpiry
    CheckSurplusExists -- No --> LowExpiry["Expiry Risk: LOW"]

    HighShortage --> ShortageAlert["Generate SHORTAGE Alert: 'Medicine may run out in X days'"]
    MedShortage --> ShortageAlert
    HighExpiry --> ExpiryAlert["Generate EXPIRY Alert: 'Y units may remain unused before expiry'"]
    HighExpiry --> SurplusPool["Register into Network Surplus Pool"]
```

---

## 3. Spatial Matching & Logistics Feasibility Engine

Coordinates surplus inventory with shortage facilities while validating cold-chain temperature thresholds and delivery horizons.

```mermaid
flowchart TD
    Req[Destination Facility Identifies Shortage] --> FindSurplus[Scan Connected Facilities for Available Surplus]
    FindSurplus --> CalcDist["Compute Haversine Distance (km) between GPS Coordinates"]
    CalcDist --> CalcTime["Estimate Transit Duration (Speed: ~35 km/h urban/regional)"]

    CalcTime --> ColdChainCheck{"Storage Requirement == Cold Chain (2-8°C)?"}
    ColdChainCheck -- Yes --> ColdLimits{"Distance <= 60 km AND Travel Time <= 2.5 hrs?"}
    ColdLimits -- No --> RejectCold["Feasibility = FALSE<br/>Reason: 'Distance and travel time do not fit urgency window for cold-chain product'"]
    ColdLimits -- Yes --> CheckQty["Source Quantity >= Requested Transfer Quantity?"]

    ColdChainCheck -- No --> DistLimits{"Distance <= 220 km AND Transit Time Fits Shortage Days?"}
    DistLimits -- No --> RejectDist["Feasibility = FALSE<br/>Reason: 'Distance exceeds operational transfer threshold'"]
    DistLimits -- Yes --> CheckQty

    CheckQty -- No --> RejectQty["Feasibility = FALSE<br/>Reason: 'Insufficient surplus stock available'"]
    CheckQty -- Yes --> AcceptMatch["Feasibility = TRUE<br/>Reason: 'Correct medicine, enough quantity, suitable expiry, close enough, travel time fits urgency'"]

    AcceptMatch --> GenRec["Publish Recommendation with Status: PENDING"]
    RejectCold --> GenRec
    RejectDist --> GenRec
    RejectQty --> GenRec
```

---

## 4. Blockchain & Settlement Pipeline (x402 → GoPlausible → Algorand)

Executes instant, verifiable medical cargo handoffs without traditional clearing delays.

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Facility Health Officer
    participant Frontend as AushadhiSetu Web / Mobile
    participant Backend as FastAPI Backend
    participant Protocol as x402 Payment Protocol
    participant Escrow as GoPlausible Facilitator
    participant Ledger as Algorand Testnet

    Officer->>Frontend: Clicks "Approve & Initiate"
    Frontend->>Backend: POST /transfer { recommendation_id }
    Backend-->>Frontend: 201 Created: { transfer_id: "TRF102", status: "INITIATED", payment_status: "PENDING" }
    
    Frontend->>Backend: POST /payment { transfer_id: "TRF102" }
    activate Backend
    Backend->>Protocol: Request Escrow Settlement (x402-v1.2 Handshake)
    Protocol->>Escrow: Lock Collateral & Sign Digital Bill of Lading
    Escrow->>Ledger: Broadcast Atomic Transaction (0.001 Algo Fee)
    Ledger-->>Escrow: Confirmed in Round 39482015 (TxID: ALG-9F2B81AC)
    Escrow-->>Backend: Verified Execution Receipt
    Backend-->>Frontend: 200 OK: { status: "COMPLETED", payment_status: "CONFIRMED", transaction_id: "ALG-9F2B81AC" }
    deactivate Backend

    Frontend->>Officer: Displays Verified Algorand Transaction ID & Confirmation Checkmark
```
