/* ============================================================
   AUSHADHISETU API SERVICE LAYER
   Seamlessly communicates with the FastAPI backend at http://localhost:5000
   with automatic fallback to mock data if the backend server is offline.
   ============================================================ */
const API_BASE = "http://localhost:5000";

// In-memory fallback mock database
let DB = {
  facility: {
    facility_id: "FAC-B",
    name: "City General Hospital",
    type: "Hospital",
    address: "Connaught Place, New Delhi",
    latitude: 28.6315, longitude: 77.2167
  },
  network: [
    { facility_id:"FAC-A", name:"Sunrise Primary Health Centre", type:"PHC", address:"Gurugram, Haryana", latitude:28.4595, longitude:77.0266, top:"62%", left:"18%" },
    { facility_id:"FAC-B", name:"City General Hospital", type:"Hospital", address:"Connaught Place, New Delhi", latitude:28.6315, longitude:77.2167, top:"40%", left:"52%", self:true },
    { facility_id:"FAC-C", name:"Alwar Rural Health Centre", type:"CHC", address:"Alwar, Rajasthan", latitude:27.5530, longitude:76.6346, top:"78%", left:"70%" },
  ],
  medicines: [
    { medicine_id:"MED001", name:"Paracetamol 500mg", batch:"PCT102", quantity:30, expiry_date:"2026-10-01", daily_consumption:10, storage_requirement:"Room temperature", facility_id:"FAC-B",
      days_of_stock:3, shortage_risk:"HIGH", expiry_risk:"LOW", potential_surplus:0 },
    { medicine_id:"MED002", name:"Amoxicillin 250mg", batch:"AMX061", quantity:180, expiry_date:"2026-12-15", daily_consumption:14, storage_requirement:"Room temperature", facility_id:"FAC-B",
      days_of_stock:13, shortage_risk:"LOW", expiry_risk:"LOW", potential_surplus:0 },
    { medicine_id:"MED003", name:"ORS Sachets", batch:"ORS220", quantity:640, expiry_date:"2027-02-20", daily_consumption:22, storage_requirement:"Room temperature", facility_id:"FAC-B",
      days_of_stock:29, shortage_risk:"LOW", expiry_risk:"LOW", potential_surplus:120 },
    { medicine_id:"MED004", name:"Insulin Glargine", batch:"INS014", quantity:22, expiry_date:"2026-09-30", daily_consumption:6, storage_requirement:"2–8°C (cold chain)", facility_id:"FAC-B",
      days_of_stock:4, shortage_risk:"HIGH", expiry_risk:"MEDIUM", potential_surplus:0 },
    { medicine_id:"MED005", name:"Azithromycin 500mg", batch:"AZT303", quantity:410, expiry_date:"2026-09-25", daily_consumption:9, storage_requirement:"Room temperature", facility_id:"FAC-B",
      days_of_stock:45, shortage_risk:"LOW", expiry_risk:"HIGH", potential_surplus:175 },
  ],
  alerts: [
    { alert_id:"ALR001", medicine_id:"MED001", facility_id:"FAC-B", type:"SHORTAGE", severity:"HIGH", message:"Paracetamol 500mg may run out in 3 days.", created_at:"2026-09-06T08:00:00Z" },
    { alert_id:"ALR002", medicine_id:"MED005", facility_id:"FAC-B", type:"EXPIRY", severity:"MEDIUM", message:"175 units of Azithromycin 500mg may remain unused before expiry.", created_at:"2026-09-06T08:00:00Z" },
    { alert_id:"ALR003", medicine_id:"MED004", facility_id:"FAC-B", type:"SHORTAGE", severity:"HIGH", message:"Insulin Glargine may run out in 4 days.", created_at:"2026-09-06T08:00:00Z" },
  ],
  surplus: [
    { surplus_id:"SUR001", medicine_id:"MED001", facility_id:"FAC-A", available_quantity:100, expiry_date:"2026-11-05", status:"AVAILABLE" },
    { surplus_id:"SUR002", medicine_id:"MED001", facility_id:"FAC-C", available_quantity:250, expiry_date:"2026-09-16", status:"AVAILABLE" },
  ],
  recommendations: [
    { recommendation_id:"REC001", medicine_id:"MED001", source_facility:"FAC-A", destination_facility:"FAC-B", quantity:50, distance:"18 km", travel_time:"45 min", feasibility:true, reason:"Correct medicine, enough quantity, suitable expiry, close enough, travel time fits urgency.", status:"PENDING" },
    { recommendation_id:"REC002", medicine_id:"MED004", source_facility:"FAC-C", destination_facility:"FAC-B", quantity:15, distance:"250 km", travel_time:"~8 hours", feasibility:false, reason:"Distance and travel time do not fit the urgency window for a cold-chain product.", status:"PENDING" },
  ],
  transfers: {}
};

const byId = (arr, key, val) => arr.find(x => x[key] === val);
const delay = (ms=350) => new Promise(r => setTimeout(r, ms));

function getAuthHeaders() {
  const token = localStorage.getItem("aushadhisetu_token");
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

const api = {
  async login(payload) {
    try {
      const endpoint = payload.facility_name ? "/auth/signup" : "/auth/login";
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem("aushadhisetu_token", data.access_token);
        }
        return data;
      }
    } catch (e) {
      console.warn("Backend unavailable, using prototype mock data:", e);
    }
    await delay();
    return { ...DB.facility };
  },

  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock dashboard:", e);
    }
    await delay();
    const meds = DB.medicines;
    return {
      total_stock: meds.reduce((s,m)=>s+m.quantity,0),
      low_stock: meds.filter(m=>m.days_of_stock<=5).length,
      expiring_soon: meds.filter(m=>m.expiry_risk==="HIGH"||m.expiry_risk==="MEDIUM").length,
      surplus_count: meds.filter(m=>m.potential_surplus>0).length,
      top_alert: DB.alerts[0] || null,
      top_recommendation: DB.recommendations[0] || null,
    };
  },

  async getInventory() {
    try {
      const res = await fetch(`${API_BASE}/inventory`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock inventory:", e);
    }
    await delay();
    return DB.medicines.filter(m=>m.facility_id===DB.facility.facility_id);
  },

  async getMedicine(id) {
    try {
      const res = await fetch(`${API_BASE}/medicine/${id}`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock medicine:", e);
    }
    await delay();
    return byId(DB.medicines, "medicine_id", id);
  },

  async getAlerts() {
    try {
      const res = await fetch(`${API_BASE}/alerts`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock alerts:", e);
    }
    await delay();
    return DB.alerts.filter(a=>a.facility_id===DB.facility.facility_id);
  },

  async getSurplus() {
    try {
      const res = await fetch(`${API_BASE}/surplus`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock surplus:", e);
    }
    await delay();
    return DB.surplus;
  },

  async getFacilities() {
    try {
      const res = await fetch(`${API_BASE}/facilities`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock facilities:", e);
    }
    await delay();
    return DB.network;
  },

  async getRecommendations() {
    try {
      const res = await fetch(`${API_BASE}/recommendations`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock recommendations:", e);
    }
    await delay();
    return DB.recommendations;
  },

  async createTransfer(recommendation_id) {
    try {
      const res = await fetch(`${API_BASE}/transfer`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ recommendation_id })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock transfer creation:", e);
    }
    await delay();
    const transfer_id = "TRF" + Math.floor(Math.random()*900+100);
    DB.transfers[transfer_id] = {
      transfer_id, recommendation_id, status:"INITIATED",
      payment_status:"PENDING", transaction_id:null, created_at:new Date().toISOString()
    };
    return DB.transfers[transfer_id];
  },

  async initiatePayment(transfer_id) {
    try {
      const res = await fetch(`${API_BASE}/payment`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ transfer_id })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock payment settlement:", e);
    }
    await delay(900);
    const t = DB.transfers[transfer_id] || { transfer_id, recommendation_id: "REC001" };
    t.payment_status = "CONFIRMED";
    t.transaction_id = "ALG-" + Math.random().toString(36).slice(2,10).toUpperCase();
    t.status = "COMPLETED";
    DB.transfers[transfer_id] = t;
    return t;
  },

  async getTransferStatus(transfer_id) {
    try {
      const res = await fetch(`${API_BASE}/transfer/${transfer_id}`, { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock transfer status:", e);
    }
    await delay();
    return DB.transfers[transfer_id];
  }
};
