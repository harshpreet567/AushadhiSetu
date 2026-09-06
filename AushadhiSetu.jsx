import { useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import {
  Cross, ArrowLeft, Search, Bell, X, LayoutDashboard, Pill, AlertTriangle, PackageOpen,
  Sparkles, Share2, History, Wifi, Boxes, TrendingDown, CalendarClock, Plus, Thermometer,
  Calendar, Gauge, AlertOctagon, ChevronRight, ArrowRight, MapPin, Navigation, CheckCircle2,
  Clock, PackagePlus, ArrowDown, Circle, Loader2, ExternalLink, Save,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────
   AushadhiSetu — "Right Medicine. Right Facility. Right Time."
   Single-file port of the uploaded Vite/React project into an artifact.
   All data is in-memory mock data (CONFIG.USE_MOCK equivalent = true),
   exactly as the original app runs by default — no backend calls.
───────────────────────────────────────────────────────────────────────── */

const COLORS = {
  ink: '#06213D',
  navy950: '#04162B', navy900: '#0A2A4A', navy800: '#0F3A63', navy700: '#164E80', navy600: '#1E63A0',
  sky500: '#2E8FE0', sky400: '#5FADEC', sky300: '#93C9F5', sky200: '#C3E2FA', sky100: '#E6F3FD', sky50: '#F4FAFE',
  mint: '#1FAE8E', amber: '#E8A23D', coral: '#E15C5C',
};

const GlobalStyle = () => (
  <style>{`
    .as-root { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; color:${COLORS.ink}; }
    .as-root * { box-sizing: border-box; }
    .as-card { border-radius:14px; box-shadow: 0 1px 0 rgba(6,33,61,0.06), 0 8px 24px -12px rgba(10,42,74,0.18); }
    .as-focus:focus-visible { outline: 2px solid ${COLORS.sky500}; outline-offset: 2px; }
    .as-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .as-scroll::-webkit-scrollbar-thumb { background: ${COLORS.sky300}; border-radius: 8px; }
    .as-input { width:100%; border:1px solid rgba(10,42,74,0.12); border-radius:10px; padding:10px 12px; font-size:14px; background:${COLORS.sky50}; }
    .as-input:focus { outline:2px solid ${COLORS.sky500}; outline-offset:1px; }
    @keyframes as-fadeIn { from { opacity:0; transform:translateY(-4px);} to {opacity:1; transform:translateY(0);} }
    @keyframes as-spin { to { transform: rotate(360deg); } }
    .as-spin { animation: as-spin 0.8s linear infinite; }
  `}</style>
);

/* ── Mock data ─────────────────────────────────────────────────────────── */

const CURRENT_FACILITY_ID = 'FAC_B';

const initialFacilities = [
  { facility_id: 'FAC_A', name: 'Facility A — Rajiv Gandhi PHC', type: 'Primary Health Centre', address: 'Sector 12, Rohini, Delhi', latitude: 28.7196, longitude: 77.1256 },
  { facility_id: 'FAC_B', name: 'Facility B — Ashoka District Hospital', type: 'District Hospital', address: 'Civil Lines, Delhi', latitude: 28.6774, longitude: 77.2211 },
  { facility_id: 'FAC_C', name: 'Facility C — Meerut Base Hospital', type: 'Base Hospital', address: 'Meerut, Uttar Pradesh', latitude: 28.9845, longitude: 77.7064 },
  { facility_id: 'FAC_D', name: 'Facility D — Gurugram CHC', type: 'Community Health Centre', address: 'Sector 31, Gurugram, Haryana', latitude: 28.4506, longitude: 77.0269 },
];

const initialMedicines = [
  { medicine_id: 'MED001', medicine_name: 'Paracetamol 500mg', batch: 'PCT102', quantity: 30, expiry_date: '2026-11-05', daily_consumption: 10, storage_requirement: 'Room temperature', facility_id: 'FAC_B' },
  { medicine_id: 'MED002', medicine_name: 'Paracetamol 500mg', batch: 'PCT098', quantity: 300, expiry_date: '2026-10-01', daily_consumption: 12, storage_requirement: 'Room temperature', facility_id: 'FAC_A' },
  { medicine_id: 'MED003', medicine_name: 'Amoxicillin 250mg', batch: 'AMX221', quantity: 180, expiry_date: '2026-09-20', daily_consumption: 6, storage_requirement: 'Cool & dry', facility_id: 'FAC_A' },
  { medicine_id: 'MED004', medicine_name: 'ORS Sachets', batch: 'ORS041', quantity: 45, expiry_date: '2027-03-15', daily_consumption: 15, storage_requirement: 'Room temperature', facility_id: 'FAC_B' },
  { medicine_id: 'MED005', medicine_name: 'Insulin Glargine', batch: 'INS777', quantity: 12, expiry_date: '2026-10-12', daily_consumption: 4, storage_requirement: '2-8°C refrigerated', facility_id: 'FAC_B' },
  { medicine_id: 'MED006', medicine_name: 'Paracetamol 500mg', batch: 'PCT250', quantity: 250, expiry_date: '2026-09-16', daily_consumption: 3, storage_requirement: 'Room temperature', facility_id: 'FAC_C' },
  { medicine_id: 'MED007', medicine_name: 'Cefixime 200mg', batch: 'CFX310', quantity: 90, expiry_date: '2026-12-01', daily_consumption: 5, storage_requirement: 'Cool & dry', facility_id: 'FAC_D' },
  { medicine_id: 'MED008', medicine_name: 'IV Fluids (NS 500ml)', batch: 'IVF018', quantity: 20, expiry_date: '2027-01-20', daily_consumption: 8, storage_requirement: 'Room temperature', facility_id: 'FAC_B' },
];

/* ── Helpers (ports of utils/helpers.js) ─────────────────────────────── */

function daysOfStock(quantity, dailyConsumption) {
  if (!dailyConsumption || dailyConsumption <= 0) return Infinity;
  return Math.floor(quantity / dailyConsumption);
}
function shortageRisk(days) {
  if (days <= 4) return 'HIGH';
  if (days <= 10) return 'MEDIUM';
  return 'LOW';
}
function daysToExpiry(expiryDate) {
  const ms = new Date(expiryDate).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
function expiryRisk(daysLeft, daysOfStockValue) {
  if (daysLeft <= 20 && daysLeft < daysOfStockValue * 1.5) return 'HIGH';
  if (daysLeft <= 45) return 'MEDIUM';
  return 'LOW';
}
function potentialSurplus(quantity, dailyConsumption, bufferDays = 21) {
  const needed = dailyConsumption * bufferDays;
  return Math.max(0, quantity - needed);
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
function estimateTravelMinutes(distanceKm) {
  return Math.round((distanceKm / 40) * 60);
}
function evaluateFeasibility({ quantityAvailable, quantityNeeded, expiryDaysLeft, travelMinutes, urgencyDays }) {
  const checks = {
    correctMedicine: true,
    enoughQuantity: quantityAvailable >= quantityNeeded,
    suitableExpiry: expiryDaysLeft > 14,
    closeEnough: travelMinutes <= 600,
    travelFitsUrgency: travelMinutes / 60 < urgencyDays * 24,
  };
  const feasible = Object.values(checks).every(Boolean);
  return { feasible, checks };
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
function getAiPrediction(medicine) {
  const dos = daysOfStock(medicine.quantity, medicine.daily_consumption);
  const expiryDaysLeft = daysToExpiry(medicine.expiry_date);
  return {
    medicine_id: medicine.medicine_id,
    current_stock: medicine.quantity,
    days_of_stock: dos,
    shortage_risk: shortageRisk(dos),
    expiry_risk: expiryRisk(expiryDaysLeft, dos),
    potential_surplus: potentialSurplus(medicine.quantity, medicine.daily_consumption),
  };
}
function getDistanceAndTravelTime(origin, destination) {
  const distance_km = haversineKm(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
  return { distance_km, travel_time_minutes: estimateTravelMinutes(distance_km) };
}

function riskBadgeStyle(risk) {
  if (risk === 'HIGH') return { background: `${COLORS.coral}1A`, color: COLORS.coral, borderColor: `${COLORS.coral}4D` };
  if (risk === 'MEDIUM') return { background: `${COLORS.amber}1A`, color: COLORS.amber, borderColor: `${COLORS.amber}4D` };
  return { background: `${COLORS.mint}1A`, color: COLORS.mint, borderColor: `${COLORS.mint}4D` };
}

/* ── App "store" — mimics services/api.js + mockData.js as a data engine ─ */

function useAushadhiStore() {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [transfers, setTransfers] = useState([]);

  const getInventory = useCallback((facilityId = CURRENT_FACILITY_ID, meds = medicines) =>
    meds.filter((m) => m.facility_id === facilityId).map((m) => ({ ...m, ...getAiPrediction(m) })),
  [medicines]);

  const getSurplus = useCallback((facilityId, meds = medicines) => {
    const pool = facilityId ? meds.filter((m) => m.facility_id === facilityId) : meds;
    return pool
      .map((m) => ({ ...m, ...getAiPrediction(m) }))
      .filter((m) => m.potential_surplus > 0)
      .map((m) => ({
        surplus_id: uid('SUR'),
        medicine_id: m.medicine_id,
        medicine_name: m.medicine_name,
        facility_id: m.facility_id,
        available_quantity: m.potential_surplus,
        expiry_date: m.expiry_date,
        storage_requirement: m.storage_requirement,
        status: 'AVAILABLE',
      }));
  }, [medicines]);

  const getAlerts = useCallback((facilityId = CURRENT_FACILITY_ID, meds = medicines) => {
    const inv = getInventory(facilityId, meds);
    const alerts = [];
    inv.forEach((m) => {
      if (m.shortage_risk === 'HIGH' || m.shortage_risk === 'MEDIUM') {
        alerts.push({
          alert_id: uid('ALT'), medicine_id: m.medicine_id, medicine_name: m.medicine_name,
          facility_id: m.facility_id, type: 'SHORTAGE', severity: m.shortage_risk,
          message: `${m.medicine_name} may run out in ${m.days_of_stock} day${m.days_of_stock === 1 ? '' : 's'}.`,
          created_at: new Date().toISOString(),
        });
      }
      if (m.expiry_risk === 'HIGH' || m.expiry_risk === 'MEDIUM') {
        alerts.push({
          alert_id: uid('ALT'), medicine_id: m.medicine_id, medicine_name: m.medicine_name,
          facility_id: m.facility_id, type: 'EXPIRY', severity: m.expiry_risk,
          message: `${m.quantity} units of ${m.medicine_name} may remain unused before expiry (${daysToExpiry(m.expiry_date)}d left).`,
          created_at: new Date().toISOString(),
        });
      }
    });
    return alerts;
  }, [getInventory, medicines]);

  const getFacilities = useCallback((currentFacilityId = CURRENT_FACILITY_ID) => {
    const me = initialFacilities.find((f) => f.facility_id === currentFacilityId);
    const others = initialFacilities.filter((f) => f.facility_id !== currentFacilityId);
    return others.map((f) => {
      const { distance_km, travel_time_minutes } = getDistanceAndTravelTime(me, f);
      const surplusHere = getSurplus(f.facility_id);
      return { ...f, distance_km, travel_time_minutes, surplus_medicine_count: surplusHere.length };
    });
  }, [getSurplus]);

  const getRecommendations = useCallback((facilityId = CURRENT_FACILITY_ID, meds = medicines) => {
    const me = initialFacilities.find((f) => f.facility_id === facilityId);
    const myInventory = getInventory(facilityId, meds);
    const shortages = myInventory.filter((m) => m.shortage_risk === 'HIGH' || m.shortage_risk === 'MEDIUM');
    const recs = [];
    for (const shortage of shortages) {
      const quantityNeeded = Math.max(shortage.daily_consumption * 14 - shortage.quantity, shortage.daily_consumption * 5);
      const candidateSurplus = meds.filter((m) => m.facility_id !== facilityId && m.medicine_name === shortage.medicine_name);
      for (const candidate of candidateSurplus) {
        const prediction = getAiPrediction(candidate);
        if (prediction.potential_surplus <= 0) continue;
        const sourceFacility = initialFacilities.find((f) => f.facility_id === candidate.facility_id);
        const { distance_km, travel_time_minutes } = getDistanceAndTravelTime(sourceFacility, me);
        const expiryDaysLeft = daysToExpiry(candidate.expiry_date);
        const { feasible, checks } = evaluateFeasibility({
          quantityAvailable: prediction.potential_surplus,
          quantityNeeded,
          expiryDaysLeft,
          travelMinutes: travel_time_minutes,
          urgencyDays: shortage.days_of_stock === Infinity ? 30 : Math.max(shortage.days_of_stock, 1),
        });
        recs.push({
          recommendation_id: uid('REC'), medicine_id: shortage.medicine_id, medicine_name: shortage.medicine_name,
          source_facility: candidate.facility_id, source_facility_name: sourceFacility?.name,
          destination_facility: facilityId, destination_facility_name: me?.name,
          quantity: Math.min(prediction.potential_surplus, quantityNeeded),
          distance_km, travel_time_minutes, expiry_date: candidate.expiry_date,
          feasibility: feasible, checks,
          reason: feasible
            ? 'Correct medicine, sufficient quantity, suitable expiry, distance and travel time fit the shortage urgency.'
            : 'Does not meet quantity, expiry, distance or urgency requirements — filtered out.',
          status: 'PENDING',
        });
      }
    }
    return recs.filter((r) => r.feasibility).sort((a, b) => a.distance_km - b.distance_km);
  }, [getInventory, medicines]);

  const getDashboard = useCallback((facilityId = CURRENT_FACILITY_ID) => {
    const inv = getInventory(facilityId);
    const alerts = getAlerts(facilityId);
    const surplus = getSurplus(facilityId);
    return {
      total_stock: inv.reduce((s, m) => s + m.quantity, 0),
      low_stock_count: inv.filter((m) => m.shortage_risk === 'HIGH').length,
      expiring_soon_count: inv.filter((m) => m.expiry_risk === 'HIGH' || m.expiry_risk === 'MEDIUM').length,
      surplus_count: surplus.length,
      top_alert: alerts.find((a) => a.type === 'SHORTAGE') || null,
      inventory_preview: inv.slice(0, 4),
    };
  }, [getInventory, getAlerts, getSurplus]);

  const addMedicine = useCallback((payload) => {
    const record = { medicine_id: uid('MED'), facility_id: CURRENT_FACILITY_ID, ...payload };
    setMedicines((list) => [...list, record]);
  }, []);

  const createTransfer = useCallback((recommendation) => {
    const record = {
      transfer_id: `TRF${String(transfers.length + 1).padStart(3, '0')}`,
      recommendation_id: recommendation.recommendation_id, medicine_id: recommendation.medicine_id,
      medicine_name: recommendation.medicine_name, quantity: recommendation.quantity,
      source_facility: recommendation.source_facility, source_facility_name: recommendation.source_facility_name,
      destination_facility: recommendation.destination_facility, destination_facility_name: recommendation.destination_facility_name,
      distance_km: recommendation.distance_km, travel_time_minutes: recommendation.travel_time_minutes,
      status: 'INITIATED', payment_status: 'PENDING', transaction_id: null, created_at: new Date().toISOString(),
    };
    setTransfers((list) => [...list, record]);
    setMedicines((list) => {
      const next = list.map((m) => ({ ...m }));
      const sourceMed = next.find((m) => m.medicine_id === recommendation.medicine_id && m.facility_id === recommendation.source_facility);
      if (sourceMed) sourceMed.quantity = Math.max(0, sourceMed.quantity - recommendation.quantity);
      const destMed = next.find((m) => m.medicine_name === recommendation.medicine_name && m.facility_id === recommendation.destination_facility);
      if (destMed) {
        destMed.quantity += recommendation.quantity;
      } else {
        next.push({
          medicine_id: uid('MED'), medicine_name: recommendation.medicine_name, batch: 'TRANSFERRED',
          quantity: recommendation.quantity, expiry_date: recommendation.expiry_date,
          daily_consumption: sourceMed?.daily_consumption || 5,
          storage_requirement: sourceMed?.storage_requirement || 'Room temperature',
          facility_id: recommendation.destination_facility,
        });
      }
      return next;
    });
    return record;
  }, [transfers]);

  const payForTransfer = useCallback((transferId) => new Promise((resolve) => {
    setTimeout(() => {
      setTransfers((list) => {
        const next = list.map((t) => {
          if (t.transfer_id !== transferId) return t;
          const updated = {
            ...t, payment_status: 'PAID', status: 'COMPLETED',
            transaction_id: uid('ALGO').replace('ALGO_', 'ALGO'),
          };
          resolve(updated);
          return updated;
        });
        return next;
      });
    }, 900);
  }), []);

  return { medicines, transfers, getInventory, getAlerts, getSurplus, getFacilities, getRecommendations, getDashboard, addMedicine, createTransfer, payForTransfer };
}

/* ── App context (navigation + shared derived data) ─────────────────── */

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

/* ── Small shared bits ────────────────────────────────────────────────── */

function RiskBadge({ risk }) {
  if (!risk) return null;
  return (
    <span className="as-focus" style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 999, border: '1px solid', padding: '2px 8px', fontSize: 11, fontWeight: 600, ...riskBadgeStyle(risk) }}>
      {risk}
    </span>
  );
}

function StatCard({ label, value, tone = 'sky', icon: Icon }) {
  const tones = {
    sky: `linear-gradient(135deg, ${COLORS.sky500}, ${COLORS.navy900})`,
    coral: `linear-gradient(135deg, ${COLORS.coral}, #B23E3E)`,
    amber: `linear-gradient(135deg, ${COLORS.amber}, #B87A1F)`,
    mint: `linear-gradient(135deg, ${COLORS.mint}, #12735D)`,
  };
  return (
    <div className="as-card" style={{ background: '#fff', padding: 16, border: `1px solid ${COLORS.navy900}0D` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: `${COLORS.navy900}8C`, margin: 0 }}>{label}</p>
        {Icon && (
          <div style={{ display: 'grid', placeItems: 'center', height: 28, width: 28, borderRadius: 8, background: tones[tone], color: '#fff' }}>
            <Icon size={14} />
          </div>
        )}
      </div>
      <p style={{ marginTop: 8, fontSize: 24, fontWeight: 800, color: COLORS.navy950 }}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, message }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 14, border: `1px dashed ${COLORS.navy900}26`, background: 'rgba(255,255,255,0.6)', padding: '56px 0', textAlign: 'center' }}>
      {Icon && <Icon size={28} style={{ color: `${COLORS.navy900}40`, marginBottom: 12 }} />}
      <p style={{ fontWeight: 600, color: `${COLORS.navy900}B3`, margin: 0 }}>{title}</p>
      {message && <p style={{ fontSize: 13, color: `${COLORS.navy900}73`, marginTop: 4, maxWidth: 320 }}>{message}</p>}
    </div>
  );
}

function Loading({ label = 'Loading live data…' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0', justifyContent: 'center', color: `${COLORS.navy900}80`, fontSize: 14 }}>
      <span className="as-spin" style={{ height: 14, width: 14, borderRadius: '50%', border: `2px solid ${COLORS.sky300}`, borderTopColor: COLORS.sky500 }} />
      {label}
    </div>
  );
}

function Popup({ icon: Icon, tone = 'sky', title, message, action, onAction, onDismiss, delay = 0 }) {
  const [visible, setVisible] = useState(delay === 0);
  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!visible) return null;
  const tones = {
    sky: { border: COLORS.sky300, bg: COLORS.sky50 },
    coral: { border: `${COLORS.coral}66`, bg: `${COLORS.coral}0D` },
    mint: { border: `${COLORS.mint}66`, bg: `${COLORS.mint}0D` },
  };
  const t = tones[tone];
  const iconColor = tone === 'coral' ? COLORS.coral : tone === 'mint' ? COLORS.mint : COLORS.sky500;
  return (
    <div className="as-card" style={{ animation: 'as-fadeIn .25s ease', display: 'flex', alignItems: 'flex-start', gap: 12, border: `1px solid ${t.border}`, background: t.bg, padding: 14, color: COLORS.navy950 }}>
      {Icon && (
        <div style={{ marginTop: 2, display: 'grid', placeItems: 'center', height: 32, width: 32, flexShrink: 0, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{title}</p>
        <p style={{ fontSize: 12, color: `${COLORS.navy900}B3`, marginTop: 2 }}>{message}</p>
        {action && (
          <button onClick={onAction} className="as-focus" style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: COLORS.sky500, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            {action}
          </button>
        )}
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="as-focus" style={{ color: `${COLORS.navy900}4D`, background: 'none', border: 'none', cursor: 'pointer' }}>
        <X size={14} />
      </button>
    </div>
  );
}

function Logo({ compact = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, borderRadius: 8, background: `linear-gradient(135deg, ${COLORS.sky400}, ${COLORS.navy800})`, color: '#fff' }}>
        <Cross size={18} strokeWidth={2.5} />
      </div>
      {!compact && (
        <div style={{ lineHeight: 1.2 }}>
          <p style={{ fontWeight: 800, letterSpacing: '-0.01em', color: '#fff', fontSize: 15, margin: 0 }}>AushadhiSetu</p>
          <p style={{ fontSize: 10, color: `${COLORS.sky200}CC`, marginTop: -2, marginBottom: 0 }}>Right Medicine. Right Facility. Right Time.</p>
        </div>
      )}
    </div>
  );
}

/* ── Layout: TopBar, Sidebar, MobileNav ──────────────────────────────── */

const TITLES = {
  dashboard: 'Dashboard', stock: 'Medicine Stock', alerts: 'Alerts', surplus: 'Surplus',
  network: 'Facility Network', recommendations: 'Recommendations', 'medicine-detail': 'Medicine Details',
  approve: 'Approve & Initiate Transfer', 'transfer-status': 'Transfer Status', 'transfer-history': 'Transfer History',
};

function TopBar() {
  const { screen, canGoBack, goBack, searchQuery, setSearchQuery, alerts } = useApp();
  const showSearch = ['stock', 'surplus', 'network', 'recommendations'].includes(screen);

  const searchBox = (
    <div style={{ position: 'relative', width: '100%' }}>
      <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: `${COLORS.navy900}59` }} />
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search medicine, facility..."
        className="as-focus"
        style={{ width: '100%', borderRadius: 999, border: `1px solid ${COLORS.navy900}1A`, background: `${COLORS.sky50}99`, padding: '8px 12px 8px 34px', fontSize: 14 }}
      />
    </div>
  );

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 20, borderBottom: `1px solid ${COLORS.navy900}0D`, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', padding: '12px 16px' }}>
      <div className="as-mobile-only" style={{ marginBottom: 12 }}>
        <div style={{ borderRadius: 12, background: COLORS.navy950, padding: '10px 12px' }}>
          <Logo compact={false} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {canGoBack ? (
          <button onClick={goBack} aria-label="Go back" className="as-focus" style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, flexShrink: 0, borderRadius: '50%', border: `1px solid ${COLORS.navy900}1A`, color: COLORS.navy950, background: '#fff', cursor: 'pointer' }}>
            <ArrowLeft size={17} />
          </button>
        ) : <div style={{ width: 36 }} />}
        <h1 style={{ flex: 1, fontSize: 18, fontWeight: 700, color: COLORS.navy950, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{TITLES[screen] || 'AushadhiSetu'}</h1>
        {showSearch && <div style={{ width: 260, display: window.innerWidth < 640 ? 'none' : 'block' }}>{searchBox}</div>}
        <button aria-label="Alerts" className="as-focus" style={{ position: 'relative', display: 'grid', placeItems: 'center', height: 36, width: 36, borderRadius: '50%', border: `1px solid ${COLORS.navy900}1A`, background: '#fff', cursor: 'pointer' }}>
          <Bell size={17} style={{ color: `${COLORS.navy900}B3` }} />
          {alerts.length > 0 && (
            <span style={{ position: 'absolute', top: -2, right: -2, height: 16, minWidth: 16, borderRadius: '50%', background: COLORS.coral, padding: '0 4px', fontSize: 9, fontWeight: 700, lineHeight: '16px', color: '#fff' }}>{alerts.length}</span>
          )}
        </button>
      </div>
      {showSearch && <div style={{ marginTop: 12 }} className="as-mobile-search">{searchBox}</div>}
    </header>
  );
}

const SIDEBAR_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'stock', label: 'Medicine Stock', icon: Pill },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { key: 'surplus', label: 'Surplus', icon: PackageOpen },
  { key: 'network', label: 'Facility Network', icon: Share2 },
  { key: 'recommendations', label: 'Recommendations', icon: Sparkles },
];

function Sidebar() {
  const { screen, navigate, alerts, lastSynced } = useApp();
  return (
    <aside className="as-desktop-only" style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', background: `linear-gradient(180deg, ${COLORS.navy950}, ${COLORS.navy900})`, color: '#fff' }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}><Logo /></div>
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {SIDEBAR_NAV.map(({ key, label, icon: Icon }) => {
          const active = screen === key;
          const badge = key === 'alerts' ? alerts.length : null;
          return (
            <button key={key} onClick={() => navigate(key)} className="as-focus" style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', borderRadius: 8, padding: '10px 12px', fontSize: 14, border: 'none', cursor: 'pointer',
              background: active ? `${COLORS.sky500}26` : 'transparent', color: active ? '#fff' : 'rgba(230,243,253,0.7)',
            }}>
              <Icon size={17} style={{ color: active ? COLORS.sky300 : 'rgba(230,243,253,0.5)' }} />
              <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{label}</span>
              {badge ? <span style={{ borderRadius: 999, background: COLORS.coral, padding: '2px 6px', fontSize: 10, fontWeight: 700, lineHeight: 1, color: '#fff' }}>{badge}</span> : null}
              {active && <span style={{ height: 6, width: 6, borderRadius: '50%', background: COLORS.sky300 }} />}
            </button>
          );
        })}
        <button onClick={() => navigate('transfer-history')} className="as-focus" style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', borderRadius: 8, padding: '10px 12px', fontSize: 14, border: 'none', cursor: 'pointer',
          background: (screen === 'transfer-history' || screen === 'transfer-status') ? `${COLORS.sky500}26` : 'transparent',
          color: (screen === 'transfer-history' || screen === 'transfer-status') ? '#fff' : 'rgba(230,243,253,0.7)',
        }}>
          <History size={17} style={{ color: 'rgba(230,243,253,0.5)' }} />
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Transfer History</span>
        </button>
      </nav>
      <div style={{ margin: '0 12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', padding: '10px 12px', fontSize: 11, color: 'rgba(230,243,253,0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Wifi size={12} style={{ color: COLORS.mint }} /><span>Live sync active</span></div>
        {lastSynced && <p style={{ marginTop: 2, color: 'rgba(230,243,253,0.4)' }}>Updated {lastSynced.toLocaleTimeString()}</p>}
      </div>
    </aside>
  );
}

const MOBILE_NAV = [
  { key: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { key: 'stock', label: 'Stock', icon: Pill },
  { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { key: 'surplus', label: 'Surplus', icon: PackageOpen },
  { key: 'recommendations', label: 'Match', icon: Sparkles },
];

function MobileNav() {
  const { screen, navigate } = useApp();
  return (
    <nav className="as-mobile-only" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30, display: 'flex', justifyContent: 'space-around', borderTop: `1px solid ${COLORS.navy900}1A`, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(6px)', padding: '6px 4px', boxShadow: '0 -4px 16px rgba(6,33,61,0.08)' }}>
      {MOBILE_NAV.map(({ key, label, icon: Icon }) => {
        const active = screen === key;
        return (
          <button key={key} onClick={() => navigate(key)} className="as-focus" style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 8, padding: '6px 0', fontSize: 10, fontWeight: 500, border: 'none', background: 'none', cursor: 'pointer', color: active ? COLORS.sky500 : `${COLORS.navy900}66` }}>
            <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

/* ── Screens ──────────────────────────────────────────────────────────── */

function Dashboard() {
  const { dashboard, recommendations, alerts, loading, navigate, popupsSeen, setPopupsSeen } = useApp();
  if (loading || !dashboard) return <Loading />;
  const topShortage = alerts.find((a) => a.type === 'SHORTAGE');
  const topRecommendation = recommendations[0];
  const showPopups = !popupsSeen;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      {showPopups && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topShortage && (
            <Popup icon={AlertTriangle} tone="coral" title="Attention required" message={topShortage.message} action="View alert" onAction={() => navigate('alerts')} onDismiss={() => setPopupsSeen(true)} />
          )}
          {topRecommendation && (
            <Popup icon={Sparkles} tone="mint" title="Recommended action" message={`${topRecommendation.quantity} units of ${topRecommendation.medicine_name} available nearby at ${topRecommendation.source_facility_name}.`} action="View recommendation" onAction={() => navigate('recommendations')} onDismiss={() => setPopupsSeen(true)} delay={350} />
          )}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }} className="as-stat-grid">
        <StatCard label="Total Stock" value={dashboard.total_stock.toLocaleString('en-IN')} icon={Boxes} tone="sky" />
        <StatCard label="Low Stock" value={dashboard.low_stock_count} icon={TrendingDown} tone="coral" />
        <StatCard label="Expiring Soon" value={dashboard.expiring_soon_count} icon={CalendarClock} tone="amber" />
        <StatCard label="Surplus" value={dashboard.surplus_count} icon={PackageOpen} tone="mint" />
      </div>

      <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.navy900}0D`, padding: '16px 20px' }}>
          <h2 style={{ fontWeight: 700, color: COLORS.navy950, margin: 0 }}>Medicine Inventory</h2>
          <button onClick={() => navigate('stock', { openAdd: true })} className="as-focus" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, background: COLORS.navy950, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
            <Plus size={14} /> Add Medicine
          </button>
        </div>
        <div>
          {dashboard.inventory_preview.map((m, i) => (
            <button key={m.medicine_id} onClick={() => navigate('medicine-detail', { medicineId: m.medicine_id })} className="as-focus" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12, padding: '12px 20px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.navy900}0D` }}>
              <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, flexShrink: 0, borderRadius: 8, background: COLORS.sky100, color: COLORS.sky500 }}><Pill size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy950, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.medicine_name}</p>
                <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>Batch {m.batch} · {m.quantity} units</p>
              </div>
              <RiskBadge risk={m.shortage_risk === 'HIGH' ? 'HIGH' : m.expiry_risk === 'HIGH' ? 'HIGH' : m.shortage_risk === 'MEDIUM' ? 'MEDIUM' : 'LOW'} />
            </button>
          ))}
        </div>
        <button onClick={() => navigate('stock')} className="as-focus" style={{ display: 'block', width: '100%', padding: '12px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, color: COLORS.sky500, border: 'none', background: 'none', cursor: 'pointer', borderTop: `1px solid ${COLORS.navy900}0D` }}>
          View all medicine stock →
        </button>
      </div>

      <div style={{ display: 'grid', gap: 14 }} className="as-two-col">
        <NavTile label="Alerts" desc="Shortage & expiry warnings" icon={AlertTriangle} onClick={() => navigate('alerts')} count={alerts.length} tone="coral" />
        <NavTile label="Facility Network" desc="Nearby connected facilities" icon={PackageOpen} onClick={() => navigate('network')} tone="sky" />
      </div>
    </div>
  );
}

function NavTile({ label, desc, icon: Icon, onClick, count, tone }) {
  const tones = { coral: { color: COLORS.coral, bg: `${COLORS.coral}1A` }, sky: { color: COLORS.sky500, bg: COLORS.sky100 } };
  const t = tones[tone];
  return (
    <button onClick={onClick} className="as-card as-focus" style={{ display: 'flex', alignItems: 'center', gap: 14, border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 16, textAlign: 'left', cursor: 'pointer' }}>
      <div style={{ display: 'grid', placeItems: 'center', height: 40, width: 40, flexShrink: 0, borderRadius: 8, background: t.bg, color: t.color }}><Icon size={18} /></div>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, color: COLORS.navy950, fontSize: 14, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>{desc}</p>
      </div>
      {typeof count === 'number' && count > 0 && <span style={{ borderRadius: 999, background: COLORS.coral, padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#fff' }}>{count}</span>}
    </button>
  );
}

function MiniStat({ label, value, small }) {
  return (
    <div style={{ borderRadius: 8, background: `${COLORS.sky50}B3`, padding: '6px 0' }}>
      <p style={{ fontWeight: 700, color: COLORS.navy950, fontSize: small ? 12 : 14, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 10, color: `${COLORS.navy900}73`, margin: 0 }}>{label}</p>
    </div>
  );
}

function MedicineStock() {
  const { inventory, loading, navigate, searchQuery, params } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { if (params?.openAdd) setShowAdd(true); }, [params]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((m) => m.medicine_name.toLowerCase().includes(q) || m.batch.toLowerCase().includes(q));
  }, [inventory, searchQuery]);

  if (loading) return <Loading />;

  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 14, color: `${COLORS.navy900}8C`, margin: 0 }}>{filtered.length} medicine{filtered.length === 1 ? '' : 's'} in stock</p>
        <button onClick={() => setShowAdd(true)} className="as-focus" style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 999, background: COLORS.navy950, padding: '8px 16px', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={14} /> Add Medicine
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Pill} title="No medicine found" message="Try a different search, or add a new medicine to inventory." />
      ) : (
        <div style={{ display: 'grid', gap: 14 }} className="as-two-col">
          {filtered.map((m) => (
            <button key={m.medicine_id} onClick={() => navigate('medicine-detail', { medicineId: m.medicine_id })} className="as-card as-focus" style={{ textAlign: 'left', border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 16, cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, flexShrink: 0, borderRadius: 8, background: COLORS.sky100, color: COLORS.sky500 }}><Pill size={16} /></div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{m.medicine_name}</p>
                    <p style={{ fontSize: 12, color: `${COLORS.navy900}73`, margin: 0 }}>Batch {m.batch}</p>
                  </div>
                </div>
                <RiskBadge risk={m.shortage_risk} />
              </div>
              <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                <MiniStat label="Qty" value={m.quantity} />
                <MiniStat label="Days left" value={m.days_of_stock === Infinity ? '—' : m.days_of_stock} />
                <MiniStat label="Expiry risk" value={m.expiry_risk} small />
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${COLORS.navy900}0D`, paddingTop: 10, fontSize: 11, color: `${COLORS.navy900}80` }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {formatDate(m.expiry_date)}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Thermometer size={12} /> {m.storage_requirement}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showAdd && <AddMedicineForm onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function Detail({ label, value, icon: Icon }) {
  return (
    <div style={{ borderRadius: 8, background: `${COLORS.sky50}99`, padding: 12 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: `${COLORS.navy900}73`, margin: 0 }}>{Icon && <Icon size={11} />} {label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, marginTop: 2, marginBottom: 0 }}>{value}</p>
    </div>
  );
}

function MedicineDetail() {
  const { params, getMedicineById } = useApp();
  const medicine = getMedicineById(params.medicineId);
  if (!medicine) return <Loading />;

  return (
    <div style={{ paddingBottom: 32, maxWidth: 560 }}>
      <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'grid', placeItems: 'center', height: 48, width: 48, borderRadius: 12, background: COLORS.sky100, color: COLORS.sky500 }}><Pill size={22} /></div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy950, margin: 0 }}>{medicine.medicine_name}</h2>
            <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>Batch {medicine.batch} · ID {medicine.medicine_id}</p>
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Detail label="Quantity" value={`${medicine.quantity} units`} />
          <Detail label="Daily consumption" value={`${medicine.daily_consumption}/day`} />
          <Detail label="Days of stock" value={medicine.days_of_stock === Infinity ? '—' : `${medicine.days_of_stock} days`} />
          <Detail label="Expiry date" value={formatDate(medicine.expiry_date)} icon={Calendar} />
          <Detail label="Storage requirement" value={medicine.storage_requirement} icon={Thermometer} />
          <Detail label="Facility" value={medicine.facility_id} />
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${COLORS.coral}33`, background: `${COLORS.coral}0D`, padding: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: `${COLORS.navy900}80`, marginBottom: 4 }}>Shortage risk</p>
            <RiskBadge risk={medicine.shortage_risk} />
          </div>
          <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${COLORS.amber}33`, background: `${COLORS.amber}0D`, padding: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 11, color: `${COLORS.navy900}80`, marginBottom: 4 }}>Expiry risk</p>
            <RiskBadge risk={medicine.expiry_risk} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, borderRadius: 8, background: COLORS.sky50, padding: '10px 12px', fontSize: 12, color: `${COLORS.navy900}99` }}>
          <Gauge size={14} style={{ color: COLORS.sky500, flexShrink: 0 }} />
          AI prediction · potential surplus: <strong style={{ color: COLORS.navy950 }}>{medicine.potential_surplus} units</strong>
        </div>
      </div>
    </div>
  );
}

function AlertsScreen() {
  const { alerts, loading, navigate } = useApp();
  if (loading) return <Loading />;
  const shortages = alerts.filter((a) => a.type === 'SHORTAGE');
  const expiries = alerts.filter((a) => a.type === 'EXPIRY');
  return (
    <div style={{ paddingBottom: 32, display: 'grid', gap: 16 }} className="as-two-col-md">
      <AlertColumn title="Shortage" tone="coral" icon={AlertOctagon} items={shortages} onOpen={navigate} />
      <AlertColumn title="Expiry" tone="amber" icon={CalendarClock} items={expiries} onOpen={navigate} />
    </div>
  );
}

function AlertColumn({ title, tone, icon: Icon, items, onOpen }) {
  const tones = {
    coral: { dot: COLORS.coral, text: COLORS.coral, bg: `${COLORS.coral}0D` },
    amber: { dot: COLORS.amber, text: COLORS.amber, bg: `${COLORS.amber}0D` },
  };
  const t = tones[tone];
  return (
    <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${COLORS.navy900}0D`, padding: '14px 20px', background: t.bg }}>
        <span style={{ height: 8, width: 8, borderRadius: '50%', background: t.dot }} />
        <Icon size={15} style={{ color: t.text }} />
        <h2 style={{ fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{title}</h2>
        <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 600, color: `${COLORS.navy900}73` }}>{items.length}</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: 24 }}><EmptyState icon={Icon} title={`No ${title.toLowerCase()} alerts`} message="Everything looks fine here right now." /></div>
      ) : (
        <div>
          {items.map((a, i) => (
            <button key={a.alert_id} onClick={() => onOpen('medicine-detail', { medicineId: a.medicine_id })} className="as-focus" style={{ display: 'flex', width: '100%', alignItems: 'flex-start', gap: 12, padding: '14px 20px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.navy900}0D` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy950, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.medicine_name}</p>
                  <RiskBadge risk={a.severity} />
                </div>
                <p style={{ fontSize: 12, color: `${COLORS.navy900}8C`, marginTop: 2 }}>{a.message}</p>
              </div>
              <ChevronRight size={16} style={{ color: `${COLORS.navy900}40`, flexShrink: 0, marginTop: 4 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SurplusScreen() {
  const { surplus, loading, navigate, searchQuery } = useApp();
  if (loading) return <Loading />;
  const filtered = surplus.filter((s) => s.medicine_name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  return (
    <div style={{ paddingBottom: 32 }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 14, color: `${COLORS.navy900}8C`, margin: 0 }}>{filtered.length} surplus item{filtered.length === 1 ? '' : 's'} available for redistribution</p>
        <button onClick={() => navigate('recommendations')} className="as-focus" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: COLORS.sky500, border: 'none', background: 'none', cursor: 'pointer' }}>
          See recommendations <ArrowRight size={13} />
        </button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={PackageOpen} title="No surplus right now" message="Surplus appears here automatically once a medicine's stock exceeds projected need." />
      ) : (
        <div style={{ display: 'grid', gap: 14 }} className="as-two-col">
          {filtered.map((s) => (
            <div key={s.surplus_id} className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'grid', placeItems: 'center', height: 36, width: 36, borderRadius: 8, background: `${COLORS.mint}1A`, color: COLORS.mint }}><PackageOpen size={16} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.medicine_name}</p>
                  <p style={{ fontSize: 12, color: `${COLORS.navy900}73`, margin: 0 }}>{s.facility_id}</p>
                </div>
                <span style={{ borderRadius: 999, background: `${COLORS.mint}1A`, color: COLORS.mint, border: `1px solid ${COLORS.mint}4D`, padding: '4px 10px', fontSize: 12, fontWeight: 700 }}>{s.available_quantity} units</span>
              </div>
              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: `${COLORS.navy900}80`, borderTop: `1px solid ${COLORS.navy900}0D`, paddingTop: 10 }}>
                <span>Expiry: {formatDate(s.expiry_date)}</span>
                <span>{s.storage_requirement}</span>
              </div>
              <button onClick={() => navigate('recommendations')} className="as-focus" style={{ marginTop: 12, width: '100%', borderRadius: 999, background: COLORS.navy950, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Match with facility →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacilityMiniStat({ icon: Icon, label, value }) {
  return (
    <div style={{ borderRadius: 8, background: `${COLORS.sky50}B3`, padding: 10 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: `${COLORS.navy900}73`, margin: 0 }}><Icon size={11} /> {label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{value}</p>
    </div>
  );
}

function FacilityNetwork() {
  const { facilities, loading, navigate, searchQuery } = useApp();
  const [selected, setSelected] = useState(null);
  const filtered = useMemo(() => facilities.filter((f) => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase())), [facilities, searchQuery]);
  const bounds = useMemo(() => {
    if (filtered.length === 0) return null;
    const lats = filtered.map((f) => f.latitude);
    const lngs = filtered.map((f) => f.longitude);
    return { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  }, [filtered]);

  if (loading) return <Loading />;

  return (
    <div style={{ paddingBottom: 32, display: 'grid', gap: 16 }} className="as-network-grid">
      <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: `linear-gradient(135deg, ${COLORS.sky100}, ${COLORS.sky50}, #fff)`, position: 'relative', overflow: 'hidden', height: 360 }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.35, backgroundImage: `radial-gradient(${COLORS.sky300} 1px, transparent 1px)`, backgroundSize: '18px 18px' }} />
        {filtered.length === 0 ? (
          <div style={{ position: 'relative', height: '100%', display: 'grid', placeItems: 'center' }}><EmptyState icon={MapPin} title="No facilities found" /></div>
        ) : (
          filtered.map((f) => {
            const x = bounds.maxLng === bounds.minLng ? 50 : 12 + ((f.longitude - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 76;
            const y = bounds.maxLat === bounds.minLat ? 50 : 12 + ((bounds.maxLat - f.latitude) / (bounds.maxLat - bounds.minLat)) * 76;
            const active = selected?.facility_id === f.facility_id;
            return (
              <button key={f.facility_id} onClick={() => setSelected(f)} className="as-focus" style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-100%) ${active ? 'scale(1.1)' : ''}`, zIndex: active ? 10 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer' }}>
                <div style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, borderRadius: '50%', color: '#fff', boxShadow: '0 4px 10px rgba(6,33,61,0.25)', background: active ? COLORS.coral : COLORS.navy800 }}><MapPin size={15} /></div>
                <span style={{ marginTop: 4, borderRadius: 999, background: '#fff', padding: '2px 8px', fontSize: 10, fontWeight: 600, color: COLORS.navy950, boxShadow: '0 1px 2px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>{f.name.split('—')[0].trim()}</span>
              </button>
            );
          })
        )}
        <p style={{ position: 'absolute', bottom: 8, left: 8, borderRadius: 999, background: 'rgba(255,255,255,0.8)', padding: '4px 10px', fontSize: 10, color: `${COLORS.navy900}80` }}>
          Live map via Google Maps Platform once GOOGLE_MAPS_API_KEY is set
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {selected ? (
          <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 16 }}>
            <p style={{ fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{selected.name}</p>
            <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>{selected.type} · {selected.address}</p>
            <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <FacilityMiniStat icon={Navigation} label="Distance" value={`${selected.distance_km} km`} />
              <FacilityMiniStat icon={PackageOpen} label="Surplus items" value={selected.surplus_medicine_count} />
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: `${COLORS.navy900}80` }}>Estimated travel time: <strong style={{ color: COLORS.navy950 }}>{selected.travel_time_minutes} min</strong></p>
            <button onClick={() => navigate('recommendations')} className="as-focus" style={{ marginTop: 12, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 999, background: COLORS.navy950, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Sparkles size={13} /> View recommendations
            </button>
          </div>
        ) : (
          <div style={{ borderRadius: 14, border: `1px dashed ${COLORS.navy900}26`, background: 'rgba(255,255,255,0.6)', padding: 24, textAlign: 'center', fontSize: 14, color: `${COLORS.navy900}73` }}>
            Tap a facility pin to see distance, travel time and surplus.
          </div>
        )}
        <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff' }}>
          {filtered.map((f, i) => (
            <button key={f.facility_id} onClick={() => setSelected(f)} className="as-focus" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12, padding: '12px 16px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.navy900}0D` }}>
              <div style={{ display: 'grid', placeItems: 'center', height: 32, width: 32, flexShrink: 0, borderRadius: '50%', background: COLORS.sky100, color: COLORS.sky500 }}><MapPin size={14} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy950, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                <p style={{ fontSize: 11, color: `${COLORS.navy900}73`, margin: 0 }}>{f.distance_km} km · ~{f.travel_time_minutes} min</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecMetric({ icon: Icon, label, value }) {
  return (
    <div style={{ borderRadius: 8, background: `${COLORS.sky50}B3`, padding: 10, textAlign: 'center' }}>
      <Icon size={13} style={{ margin: '0 auto 4px', display: 'block', color: COLORS.sky500 }} />
      <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 10, color: `${COLORS.navy900}73`, margin: 0 }}>{label}</p>
    </div>
  );
}

function Recommendations() {
  const { recommendations, loading, navigate, searchQuery } = useApp();
  if (loading) return <Loading />;
  const filtered = recommendations.filter((r) => r.medicine_name.toLowerCase().includes(searchQuery.trim().toLowerCase()));
  return (
    <div style={{ paddingBottom: 32 }}>
      <p style={{ marginBottom: 16, fontSize: 14, color: `${COLORS.navy900}8C` }}>
        {filtered.length} feasible match{filtered.length === 1 ? '' : 'es'} — non-feasible options are filtered out automatically.
      </p>
      {filtered.length === 0 ? (
        <EmptyState icon={Sparkles} title="No recommendations right now" message="AushadhiSetu will surface a match here as soon as a shortage lines up with nearby surplus." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((r) => (
            <div key={r.recommendation_id} className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'grid', placeItems: 'center', height: 40, width: 40, borderRadius: 8, background: `${COLORS.mint}1A`, color: COLORS.mint }}><CheckCircle2 size={19} /></div>
                <div>
                  <span style={{ display: 'inline-block', borderRadius: 999, background: `${COLORS.mint}1A`, color: COLORS.mint, fontSize: 10, fontWeight: 700, padding: '2px 8px', marginBottom: 4 }}>RECOMMENDED</span>
                  <p style={{ fontWeight: 700, color: COLORS.navy950, lineHeight: 1.3, margin: 0 }}>Transfer {r.quantity} units of {r.medicine_name}</p>
                  <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>{r.source_facility_name} → {r.destination_facility_name}</p>
                </div>
              </div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} className="as-rec-grid">
                <RecMetric icon={PackagePlus} label="Quantity" value={`${r.quantity} u`} />
                <RecMetric icon={CalendarClock} label="Expiry" value={formatDate(r.expiry_date)} />
                <RecMetric icon={Navigation} label="Distance" value={`${r.distance_km} km`} />
                <RecMetric icon={Clock} label="Travel time" value={`${r.travel_time_minutes} min`} />
              </div>
              <p style={{ marginTop: 14, fontSize: 12, color: `${COLORS.navy900}8C`, background: `${COLORS.sky50}B3`, borderRadius: 8, padding: '8px 12px' }}>
                <strong style={{ color: COLORS.navy950 }}>Reason: </strong>{r.reason}
              </p>
              <button onClick={() => navigate('approve', { recommendationId: r.recommendation_id })} className="as-focus" style={{ marginTop: 14, width: '100%', borderRadius: 999, background: COLORS.navy950, padding: '10px 0', fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}>
                Review transfer →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FacilityChip({ label, name, tone }) {
  const tones = { sky: { bg: COLORS.sky50, border: COLORS.sky200 }, mint: { bg: `${COLORS.mint}0D`, border: `${COLORS.mint}33` } };
  const t = tones[tone];
  return (
    <div style={{ flex: 1, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg, padding: 12, color: COLORS.navy950 }}>
      <p style={{ fontSize: 10, fontWeight: 700, color: `${COLORS.navy900}66`, margin: 0 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 600, marginTop: 2, marginBottom: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
    </div>
  );
}

function ApproveTransfer() {
  const { recommendations, params, navigate, doCreateTransfer } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const rec = recommendations.find((r) => r.recommendation_id === params.recommendationId);
  if (!rec) return <EmptyState icon={CheckCircle2} title="Recommendation no longer available" message="It may have already been approved or refreshed." />;

  function handleApprove() {
    setSubmitting(true);
    const transfer = doCreateTransfer(rec);
    setSubmitting(false);
    navigate('transfer-status', { transferId: transfer.transfer_id });
  }

  return (
    <div style={{ paddingBottom: 32, maxWidth: 480, margin: '0 auto' }}>
      <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: `${COLORS.navy900}66`, marginBottom: 4 }}>Transfer request</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy950, marginBottom: 16, marginTop: 0 }}>{rec.medicine_name} · {rec.quantity} units</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FacilityChip label="FROM" name={rec.source_facility_name} tone="sky" />
          <ArrowDown style={{ transform: 'rotate(-90deg)', color: `${COLORS.navy900}4D`, flexShrink: 0 }} size={18} />
          <FacilityChip label="TO" name={rec.destination_facility_name} tone="mint" />
        </div>
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ borderRadius: 8, background: `${COLORS.sky50}B3`, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Navigation size={15} style={{ color: COLORS.sky500 }} />
            <div><p style={{ fontSize: 10, color: `${COLORS.navy900}73`, margin: 0 }}>Distance</p><p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, margin: 0 }}>{rec.distance_km} km</p></div>
          </div>
          <div style={{ borderRadius: 8, background: `${COLORS.sky50}B3`, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={15} style={{ color: COLORS.sky500 }} />
            <div><p style={{ fontSize: 10, color: `${COLORS.navy900}73`, margin: 0 }}>Travel time</p><p style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy950, margin: 0 }}>~{rec.travel_time_minutes} min</p></div>
          </div>
        </div>
        <p style={{ marginTop: 16, fontSize: 12, color: `${COLORS.navy900}80`, background: `${COLORS.mint}0D`, border: `1px solid ${COLORS.mint}26`, borderRadius: 8, padding: '10px 12px' }}>
          Approving will start payment via <strong>x402</strong>, settle through the <strong>GoPlausible</strong> facilitator, and record the confirmed transaction on the <strong>Algorand</strong> network. The medicine itself is never stored on-chain.
        </p>
        <button onClick={handleApprove} disabled={submitting} className="as-focus" style={{ marginTop: 20, width: '100%', borderRadius: 999, background: COLORS.navy950, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.6 : 1 }}>
          {submitting ? 'Initiating…' : 'Approve & Initiate'}
        </button>
      </div>
    </div>
  );
}

function TransferStatus() {
  const { params, getTransferById, doPayForTransfer } = useApp();
  const [paying, setPaying] = useState(false);
  const transfer = getTransferById(params.transferId);
  if (!transfer) return <Loading />;

  async function handlePay() {
    setPaying(true);
    await doPayForTransfer(transfer.transfer_id);
    setPaying(false);
  }

  const steps = [
    { key: 'payment', label: 'Payment (x402)', done: transfer.payment_status === 'PAID' },
    { key: 'transaction', label: 'Algorand transaction', done: !!transfer.transaction_id },
    { key: 'transfer', label: 'Transfer complete', done: transfer.status === 'COMPLETED' },
  ];

  return (
    <div style={{ paddingBottom: 32, maxWidth: 480, margin: '0 auto' }}>
      <div className="as-card" style={{ border: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', color: `${COLORS.navy900}66` }}>Transfer {transfer.transfer_id}</p>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: COLORS.navy950, marginBottom: 4, marginTop: 4 }}>{transfer.medicine_name} · {transfer.quantity} units</h2>
        <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, marginBottom: 20 }}>{transfer.source_facility_name} → {transfer.destination_facility_name}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {steps.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {s.done ? <CheckCircle2 size={19} style={{ color: COLORS.mint, flexShrink: 0 }} /> : <Circle size={19} style={{ color: `${COLORS.navy900}33`, flexShrink: 0 }} />}
              <span style={{ fontSize: 14, fontWeight: 500, color: s.done ? COLORS.navy950 : `${COLORS.navy900}73` }}>{s.label}</span>
              {s.done && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: COLORS.mint }} />}
            </div>
          ))}
        </div>
        {transfer.transaction_id && (
          <div style={{ marginTop: 16, borderRadius: 8, background: COLORS.navy950, padding: '12px 14px', color: '#fff' }}>
            <p style={{ fontSize: 10, color: `${COLORS.sky200}B3`, margin: 0 }}>Algorand Tx ID (testnet)</p>
            <p style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 2, wordBreak: 'break-all' }}>{transfer.transaction_id}</p>
            <a href="https://lora.algokit.io/testnet" target="_blank" rel="noreferrer" className="as-focus" style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: COLORS.sky300 }}>
              View on Lora explorer <ExternalLink size={11} />
            </a>
          </div>
        )}
        {transfer.payment_status !== 'PAID' && (
          <button onClick={handlePay} disabled={paying} className="as-focus" style={{ marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, background: COLORS.navy950, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', cursor: paying ? 'default' : 'pointer', opacity: paying ? 0.6 : 1 }}>
            {paying && <Loader2 size={15} className="as-spin" />}
            {paying ? 'Processing via x402 → Algorand…' : 'Pay & confirm transfer'}
          </button>
        )}
        {transfer.status === 'COMPLETED' && (
          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 14, fontWeight: 600, color: COLORS.mint }}>Inventory updated across all facilities ✓</p>
        )}
      </div>
    </div>
  );
}

function TransferHistory() {
  const { navigate, transfers } = useApp();
  const list = [...transfers].reverse();
  if (list.length === 0) {
    return <EmptyState icon={History} title="No transfers yet" message="Approved recommendations will show up here with live status." />;
  }
  return (
    <div className="as-card" style={{ paddingBottom: 0, border: `1px solid ${COLORS.navy900}0D`, background: '#fff' }}>
      {list.map((t, i) => (
        <button key={t.transfer_id} onClick={() => navigate('transfer-status', { transferId: t.transfer_id })} className="as-focus" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 12, padding: '16px 20px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.navy900}0D` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy950, margin: 0 }}>{t.medicine_name} · {t.quantity} units</p>
            <p style={{ fontSize: 12, color: `${COLORS.navy900}80`, margin: 0 }}>{t.source_facility_name} → {t.destination_facility_name}</p>
          </div>
          <span style={{ borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700, background: t.status === 'COMPLETED' ? `${COLORS.mint}1A` : `${COLORS.amber}1A`, color: t.status === 'COMPLETED' ? COLORS.mint : COLORS.amber }}>{t.status}</span>
          <ChevronRight size={16} style={{ color: `${COLORS.navy900}40` }} />
        </button>
      ))}
    </div>
  );
}

const STORAGE_OPTIONS = ['Room temperature', 'Cool & dry', '2-8°C refrigerated', 'Frozen'];
const EMPTY_MED = { medicine_name: '', batch: '', quantity: '', expiry_date: '', daily_consumption: '', storage_requirement: STORAGE_OPTIONS[0] };

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 600, color: `${COLORS.navy900}99` }}>{label}</span>
      {children}
    </label>
  );
}

function AddMedicineForm({ onClose }) {
  const { doAddMedicine } = useApp();
  const [form, setForm] = useState(EMPTY_MED);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.medicine_name || !form.batch || !form.quantity || !form.expiry_date || !form.daily_consumption) {
      setError('Please fill in every field.');
      return;
    }
    setSaving(true);
    doAddMedicine({
      medicine_name: form.medicine_name, batch: form.batch, quantity: Number(form.quantity),
      expiry_date: form.expiry_date, daily_consumption: Number(form.daily_consumption),
      storage_requirement: form.storage_requirement,
    });
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${COLORS.navy950}80`, backdropFilter: 'blur(2px)', padding: 16 }}>
      <div className="as-card as-scroll" style={{ width: '100%', maxWidth: 420, background: '#fff', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ position: 'sticky', top: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${COLORS.navy900}0D`, background: '#fff', padding: '16px 20px' }}>
          <h2 style={{ fontWeight: 700, color: COLORS.navy950, margin: 0 }}>Add Medicine Inventory</h2>
          <button onClick={onClose} aria-label="Close" className="as-focus" style={{ color: `${COLORS.navy900}66`, background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
          <Field label="Medicine name"><input value={form.medicine_name} onChange={set('medicine_name')} placeholder="e.g. Paracetamol 500mg" className="as-input as-focus" /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Batch"><input value={form.batch} onChange={set('batch')} placeholder="PCT102" className="as-input as-focus" /></Field>
            <Field label="Quantity"><input type="number" min="0" value={form.quantity} onChange={set('quantity')} placeholder="300" className="as-input as-focus" /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Expiry date"><input type="date" value={form.expiry_date} onChange={set('expiry_date')} className="as-input as-focus" /></Field>
            <Field label="Daily consumption"><input type="number" min="0" value={form.daily_consumption} onChange={set('daily_consumption')} placeholder="12" className="as-input as-focus" /></Field>
          </div>
          <Field label="Storage requirement">
            <select value={form.storage_requirement} onChange={set('storage_requirement')} className="as-input as-focus">
              {STORAGE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          {error && <p style={{ fontSize: 12, fontWeight: 500, color: COLORS.coral, margin: 0 }}>{error}</p>}
          <button type="submit" disabled={saving} className="as-focus" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 999, background: COLORS.navy950, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Medicine'}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Shell + App ──────────────────────────────────────────────────────── */

const SCREENS = {
  dashboard: Dashboard, stock: MedicineStock, 'medicine-detail': MedicineDetail, alerts: AlertsScreen,
  surplus: SurplusScreen, network: FacilityNetwork, recommendations: Recommendations, approve: ApproveTransfer,
  'transfer-status': TransferStatus, 'transfer-history': TransferHistory,
};

function Shell() {
  const { screen } = useApp();
  const Screen = SCREENS[screen] || Dashboard;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.sky50 }} className="as-shell">
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', paddingBottom: 64 }} className="as-main-col">
        <TopBar />
        <main style={{ flex: 1, padding: '20px 16px' }}>
          <Screen />
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

export default function AushadhiSetuApp() {
  const store = useAushadhiStore();
  const [screen, setScreenState] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [params, setParams] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [popupsSeen, setPopupsSeen] = useState(false);
  const [lastSynced] = useState(new Date());

  const navigate = useCallback((next, nextParams = {}) => {
    setHistory((h) => [...h, screen]);
    setScreenState(next);
    setParams(nextParams);
  }, [screen]);

  const goBack = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = [...h];
      const prev = copy.pop();
      setScreenState(prev);
      return copy;
    });
  }, []);

  const inventory = store.getInventory();
  const alerts = store.getAlerts();
  const surplus = store.getSurplus();
  const facilities = store.getFacilities();
  const recommendations = store.getRecommendations();
  const dashboard = store.getDashboard();

  const getMedicineById = useCallback((id) => {
    const m = store.medicines.find((x) => x.medicine_id === id);
    return m ? { ...m, ...getAiPrediction(m) } : null;
  }, [store.medicines]);

  const getTransferById = useCallback((id) => store.transfers.find((t) => t.transfer_id === id) || null, [store.transfers]);

  const value = {
    screen, navigate, goBack, canGoBack: history.length > 0, params,
    searchQuery, setSearchQuery, popupsSeen, setPopupsSeen,
    dashboard, inventory, alerts, surplus, facilities, recommendations,
    transfers: store.transfers, loading: false, lastSynced,
    getMedicineById, getTransferById,
    doAddMedicine: store.addMedicine, doCreateTransfer: store.createTransfer, doPayForTransfer: store.payForTransfer,
  };

  return (
    <div className="as-root">
      <GlobalStyle />
      <style>{`
        .as-mobile-only { display: none; }
        .as-desktop-only { display: none; }
        .as-mobile-search { display: block; }
        .as-two-col, .as-two-col-md, .as-network-grid, .as-rec-grid, .as-stat-grid { grid-template-columns: 1fr; }
        @media (max-width: 767px) { .as-mobile-only { display: flex; } }
        @media (min-width: 640px) { .as-two-col { grid-template-columns: 1fr 1fr; } .as-rec-grid { grid-template-columns: repeat(4,1fr); } }
        @media (min-width: 768px) {
          .as-desktop-only { display: flex; }
          .as-main-col { padding-bottom: 0 !important; }
          .as-two-col-md { grid-template-columns: 1fr 1fr; }
          .as-stat-grid { grid-template-columns: repeat(4,1fr); }
        }
        @media (min-width: 1024px) { .as-network-grid { grid-template-columns: 3fr 2fr; } }
      `}</style>
      <AppContext.Provider value={value}>
        <Shell />
      </AppContext.Provider>
    </div>
  );
}