const {useState, useEffect} = React;

function Source({path}){
  return <div className="eyebrow-src">wired to <code>{path}</code></div>;
}

function Rail({view, go, facility}){
  const items = [
    ["dashboard","🏠","Dashboard"],
    ["stock","💊","Medicine Stock"],
    ["alerts","⚠️","Alerts"],
    ["surplus","📦","Surplus"],
    ["network","🌐","Facility Network"],
    ["recommendations","🔄","Recommendations"],
  ];
  return (
    <div className="rail">
      <div className="rail-brand">AushadhiSetu<small>Right Medicine · Right Facility · Right Time</small></div>
      <div className="rail-nav">
        {items.map(([key,icon,label]) => (
          <button key={key} className={"rail-item"+(view===key?" active":"")} onClick={()=>go(key)}>
            <span className="rail-icon">{icon}</span>{label}
          </button>
        ))}
      </div>
      <div className="rail-foot">{facility ? facility.name : ""}</div>
    </div>
  );
}

function TopBar({facility, onLogout}){
  return (
    <div className="topbar">
      <div className="who">Logged in as <b>{facility.name}</b> · {facility.type}</div>
      <button className="logout" onClick={onLogout}>Log out</button>
    </div>
  );
}

/* ---- Welcome ---- */
function Welcome({onNext}){
  return (
    <div className="welcome">
      <h1>AushadhiSetu</h1>
      <p>"Right Medicine. Right Facility. Right Time." A network that spots shortages before they happen and moves surplus stock to where it's needed.</p>
      <button className="btn btn-primary" onClick={onNext}>Login / Sign up</button>
    </div>
  );
}

/* ---- Login / Signup ---- */
function LoginSignup({onLogin}){
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({facility_name:"", facility_type:"Hospital", location:"", email:"", password:""});
  const [busy, setBusy] = useState(false);
  const set = (k,v) => setForm({...form, [k]:v});

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const facility = await api.login(form);
    setBusy(false);
    onLogin(facility);
  };

  return (
    <div className="authcard">
      <div className="tabs">
        <button className={"tab"+(mode==="login"?" active":"")} onClick={()=>setMode("login")}>Login</button>
        <button className={"tab"+(mode==="signup"?" active":"")} onClick={()=>setMode("signup")}>Sign up</button>
      </div>
      <Source path="POST /auth/login (or /auth/signup)" />
      <form onSubmit={submit}>
        {mode==="signup" && <>
          <label>Facility name</label>
          <input value={form.facility_name} onChange={e=>set("facility_name", e.target.value)} placeholder="e.g. City General Hospital" />
          <label>Facility type</label>
          <select value={form.facility_type} onChange={e=>set("facility_type", e.target.value)}>
            <option>Hospital</option><option>PHC</option><option>CHC</option><option>Pharmacy</option>
          </select>
          <label>Location</label>
          <input value={form.location} onChange={e=>set("location", e.target.value)} placeholder="City, state" />
        </>}
        <label>Email</label>
        <input type="email" value={form.email} onChange={e=>set("email", e.target.value)} placeholder="you@facility.org" />
        <label>Password</label>
        <input type="password" value={form.password} onChange={e=>set("password", e.target.value)} placeholder="••••••••" />
        <button className="btn btn-primary" style={{marginTop:18, width:"100%"}} disabled={busy}>
          {busy ? "Please wait…" : (mode==="login" ? "Log in" : "Create facility account")}
        </button>
      </form>
    </div>
  );
}

/* ---- Dashboard ---- */
function Dashboard({go, selectMedicine}){
  const [data, setData] = useState(null);
  useEffect(()=>{ api.getDashboard().then(setData); }, []);
  if(!data) return <div className="empty">Loading dashboard…</div>;
  const alert = data.top_alert, rec = data.top_recommendation;
  return (
    <div>
      <h2>Main dashboard</h2>
      <Source path="GET /dashboard" />
      <div className="grid-stats">
        <div className="stat"><div className="num">{data.total_stock}</div><div className="lbl">Total stock</div></div>
        <div className="stat danger"><div className="num">{data.low_stock}</div><div className="lbl">Low stock</div></div>
        <div className="stat warn"><div className="num">{data.expiring_soon}</div><div className="lbl">Expiring soon</div></div>
        <div className="stat ok"><div className="num">{data.surplus_count}</div><div className="lbl">Surplus</div></div>
      </div>
      {alert && (
        <div className="banner">
          <div className="btxt"><b>⚠️ Attention required</b><span>{alert.message}</span></div>
          <button className="btn btn-ghost" onClick={()=>{selectMedicine(alert.medicine_id); go("medicineDetail");}}>View</button>
        </div>
      )}
      {rec && (
        <div className="banner accent">
          <div className="btxt"><b>🔄 Recommended action</b><span>{rec.quantity} units available nearby to cover a predicted shortage.</span></div>
          <button className="btn btn-accent" onClick={()=>go("recommendations")}>View recommendation</button>
        </div>
      )}
    </div>
  );
}

/* ---- Medicine Stock ---- */
function Stock({onOpen}){
  const [meds, setMeds] = useState(null);
  useEffect(()=>{ api.getInventory().then(setMeds); }, []);
  if(!meds) return <div className="empty">Loading inventory…</div>;
  return (
    <div>
      <h2>Medicine stock</h2>
      <p style={{color:"var(--muted)", marginTop:-8}}>What do we currently have?</p>
      <Source path="GET /inventory" />
      <table>
        <thead><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Days of stock</th><th>Shortage risk</th><th>Expiry risk</th></tr></thead>
        <tbody>
          {meds.map(m=>(
            <tr key={m.medicine_id} className="clickable" onClick={()=>onOpen(m.medicine_id)}>
              <td>{m.name}</td>
              <td className="mono">{m.batch}</td>
              <td className="mono">{m.quantity}</td>
              <td className="mono">{m.days_of_stock}d</td>
              <td><span className={"badge "+m.shortage_risk.toLowerCase()}>{m.shortage_risk}</span></td>
              <td><span className={"badge "+m.expiry_risk.toLowerCase()}>{m.expiry_risk}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MedicineDetail({id, back}){
  const [m, setM] = useState(null);
  useEffect(()=>{ api.getMedicine(id).then(setM); }, [id]);
  if(!m) return <div className="empty">Loading medicine…</div>;
  return (
    <div>
      <button className="btn btn-ghost" onClick={back}>← Back</button>
      <h2 style={{marginTop:12}}>{m.name}</h2>
      <Source path={`GET /medicine/${id}`} />
      <div className="card">
        <div className="kv">
          <div>Batch</div><div className="mono">{m.batch}</div>
          <div>Quantity</div><div className="mono">{m.quantity}</div>
          <div>Expiry date</div><div className="mono">{m.expiry_date}</div>
          <div>Daily consumption</div><div className="mono">{m.daily_consumption}/day</div>
          <div>Days of stock</div><div className="mono">{m.days_of_stock} days</div>
          <div>Storage requirement</div><div>{m.storage_requirement}</div>
          <div>Shortage risk</div><div><span className={"badge "+m.shortage_risk.toLowerCase()}>{m.shortage_risk}</span></div>
          <div>Expiry risk</div><div><span className={"badge "+m.expiry_risk.toLowerCase()}>{m.expiry_risk}</span></div>
        </div>
      </div>
      <p style={{fontSize:12, color:"var(--muted)"}}>Shortage / expiry risk and "days of stock" come from the AI service's output contract — the frontend only displays them, it never calculates them.</p>
    </div>
  );
}

/* ---- Alerts ---- */
function Alerts({onOpen}){
  const [alerts, setAlerts] = useState(null);
  useEffect(()=>{ api.getAlerts().then(setAlerts); }, []);
  if(!alerts) return <div className="empty">Loading alerts…</div>;
  return (
    <div>
      <h2>Alerts</h2>
      <p style={{color:"var(--muted)", marginTop:-8}}>What needs my attention?</p>
      <Source path="GET /alerts" />
      {alerts.length===0 && <div className="empty">No active alerts.</div>}
      {alerts.map(a=>(
        <div key={a.alert_id} className={"card list-alert"+(a.type==="EXPIRY"?" expiry":"")}>
          <div className="card-row">
            <div>
              <b>{a.type==="SHORTAGE" ? "🔴 Shortage" : "🟠 Expiry"}</b>
              <p style={{margin:"4px 0 0 0"}}>{a.message}</p>
            </div>
            <button className="btn btn-ghost" onClick={()=>onOpen(a.medicine_id)}>View details</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---- Surplus ---- */
function Surplus(){
  const [rows, setRows] = useState(null);
  const [meds, setMeds] = useState(null);
  const [fac, setFac] = useState(null);
  useEffect(()=>{
    api.getSurplus().then(setRows);
    api.getInventory().then(setMeds);
    api.getFacilities().then(setFac);
  }, []);
  if(!rows || !meds || !fac) return <div className="empty">Loading surplus…</div>;
  return (
    <div>
      <h2>Surplus</h2>
      <p style={{color:"var(--muted)", marginTop:-8}}>What do we have more than we need?</p>
      <Source path="GET /surplus" />
      {rows.map(s=>{
        const f = byId(fac,"facility_id",s.facility_id);
        return (
          <div key={s.surplus_id} className="card">
            <div className="kv">
              <div>Medicine</div><div>Paracetamol 500mg</div>
              <div>Surplus</div><div className="mono">{s.available_quantity} units</div>
              <div>Expiry</div><div className="mono">{s.expiry_date}</div>
              <div>Facility</div><div>{f ? f.name : s.facility_id}</div>
            </div>
          </div>
        );
      })}
      <p style={{fontSize:12, color:"var(--muted)"}}>This stock becomes available for matching against other authorized, connected facilities.</p>
    </div>
  );
}

/* ---- Facility Network ---- */
function Network(){
  const [fac, setFac] = useState(null);
  const [selected, setSelected] = useState(null);
  useEffect(()=>{ api.getFacilities().then(f=>{setFac(f); setSelected(f.find(x=>!x.self)||f[0]);}); }, []);
  if(!fac) return <div className="empty">Loading network…</div>;
  return (
    <div>
      <h2>Facility network</h2>
      <p style={{color:"var(--muted)", marginTop:-8}}>Where are the other connected facilities?</p>
      <Source path="GET /facilities  (paired with Google Maps JS API + Distance Matrix API)" />
      <div className="map">
        <div className="map-note">Map preview — swap for a real Google Map centered on these coordinates</div>
        {fac.map(f=>(
          <div key={f.facility_id} className={"pin"+(f.self?" self":"")} style={{top:f.top, left:f.left}} onClick={()=>setSelected(f)}>
            <div className="dot"></div>
            <div className="lbl">📍 {f.name.split(" ")[0]}</div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="card">
          <div className="kv">
            <div>Facility</div><div>{selected.name}{selected.self ? " (this facility)" : ""}</div>
            <div>Type</div><div>{selected.type}</div>
            <div>Address</div><div>{selected.address}</div>
            {!selected.self && <>
              <div>Distance</div><div className="mono">{selected.facility_id==="FAC-A" ? "18 km" : "250 km"}</div>
              <div>Est. travel time</div><div className="mono">{selected.facility_id==="FAC-A" ? "45 min" : "~8 hours"}</div>
            </>}
          </div>
        </div>
      )}
      <p style={{fontSize:12, color:"var(--muted)"}}>The location service only supplies distance, travel time and route data — it never decides whether a transfer should happen.</p>
    </div>
  );
}

/* ---- Recommendations ---- */
function Recommendations({onOpen}){
  const [recs, setRecs] = useState(null);
  const [meds, setMeds] = useState(null);
  const [fac, setFac] = useState(null);
  useEffect(()=>{
    api.getRecommendations().then(setRecs);
    api.getInventory().then(setMeds);
    api.getFacilities().then(setFac);
  }, []);
  if(!recs || !meds || !fac) return <div className="empty">Loading recommendations…</div>;
  const nameOf = id => (byId(fac,"facility_id",id)||{}).name || id;
  return (
    <div>
      <h2>Recommendations</h2>
      <p style={{color:"var(--muted)", marginTop:-8}}>AI + matching + location, brought together.</p>
      <Source path="GET /recommendations" />
      {recs.map(r=>(
        <div key={r.recommendation_id} className="card">
          <div className="card-row">
            <div>
              <b>{r.feasibility ? "✅ Recommended" : "⛔ Not feasible"}</b>
              <p style={{margin:"4px 0"}}>Transfer {r.quantity} units — {nameOf(r.source_facility)} → {nameOf(r.destination_facility)}</p>
              <p style={{margin:0, fontSize:12.5, color:"var(--muted)"}}>{r.distance} · {r.travel_time}</p>
            </div>
            <button className="btn btn-ghost" onClick={()=>onOpen(r.recommendation_id)}>Open</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecommendationDetail({id, back, onApprove}){
  const [r, setR] = useState(null);
  const [fac, setFac] = useState(null);
  useEffect(()=>{
    api.getRecommendations().then(list => setR(byId(list,"recommendation_id",id)));
    api.getFacilities().then(setFac);
  }, [id]);
  if(!r || !fac) return <div className="empty">Loading…</div>;
  const nameOf = fid => (byId(fac,"facility_id",fid)||{}).name || fid;
  return (
    <div>
      <button className="btn btn-ghost" onClick={back}>← Back</button>
      <h2 style={{marginTop:12}}>Recommendation {r.recommendation_id}</h2>
      <Source path="GET /recommendations (matching + AI + location output contract)" />
      <div className="card">
        <div className="kv">
          <div>Source facility</div><div>{nameOf(r.source_facility)}</div>
          <div>Destination facility</div><div>{nameOf(r.destination_facility)}</div>
          <div>Quantity</div><div className="mono">{r.quantity} units</div>
          <div>Distance</div><div className="mono">{r.distance}</div>
          <div>Travel time</div><div className="mono">{r.travel_time}</div>
        </div>
        <p style={{fontSize:13, marginTop:10}}><b>Reason: </b>{r.reason}</p>
      </div>
      {r.feasibility ? (
        <button className="btn btn-primary" onClick={()=>onApprove(r)}>Review &amp; approve</button>
      ) : (
        <p style={{color:"var(--muted)", fontSize:13}}>This match doesn't meet the urgency/logistics threshold, so no transfer is offered.</p>
      )}
    </div>
  );
}

/* ---- Approve & Initiate ---- */
function Approve({rec, fac, onDone}){
  const [stage, setStage] = useState("review"); // review -> processing -> done
  const [pipe, setPipe] = useState(0);
  const [transfer, setTransfer] = useState(null);
  const nameOf = fid => (byId(fac,"facility_id",fid)||{}).name || fid;

  const approve = async () => {
    setStage("processing");
    const t = await api.createTransfer(rec.recommendation_id);
    setPipe(1);
    await delay(500); setPipe(2);
    const done = await api.initiatePayment(t.transfer_id);
    setPipe(3);
    await delay(400); setPipe(4);
    setTransfer(done);
    setStage("done");
  };

  const steps = ["Approve","x402 payment","GoPlausible facilitator","Algorand testnet","Confirmed"];

  return (
    <div>
      <h2>{stage==="done" ? "Transfer status" : "Approve & initiate"}</h2>
      <Source path={stage==="done" ? "GET /transfer/:id" : "POST /transfer  →  POST /payment"} />
      <div className="card">
        <div className="kv">
          <div>Medicine</div><div>Paracetamol 500mg</div>
          <div>Quantity</div><div className="mono">{rec.quantity} units</div>
          <div>From</div><div>{nameOf(rec.source_facility)}</div>
          <div>To</div><div>{nameOf(rec.destination_facility)}</div>
          <div>Distance</div><div className="mono">{rec.distance}</div>
          <div>Travel time</div><div className="mono">{rec.travel_time}</div>
        </div>
      </div>

      {stage!=="review" && (
        <div className="pipeline">
          {steps.map((s,i)=>(
            <div key={s} className={"pstep"+(i<pipe?" done":"")+(i===pipe?" active":"")}>
              <div className="dot"></div>{s}
            </div>
          ))}
        </div>
      )}

      {stage==="review" && <button className="btn btn-accent" onClick={approve}>Approve &amp; initiate</button>}
      {stage==="processing" && <p style={{color:"var(--muted)", fontSize:13}}>The frontend only reports on payment_status / transaction_id — the actual x402 → GoPlausible → Algorand flow runs entirely on the backend.</p>}
      {stage==="done" && transfer && (
        <div className="card" style={{borderLeft:"4px solid var(--ok)"}}>
          <div className="kv">
            <div>Payment</div><div>✓ {transfer.payment_status}</div>
            <div>Transfer</div><div>✓ {transfer.status}</div>
            <div>Algorand Tx ID</div><div className="mono">{transfer.transaction_id}</div>
          </div>
          <button className="btn btn-primary" style={{marginTop:14}} onClick={onDone}>Back to dashboard</button>
        </div>
      )}
    </div>
  );
}

/* ============================================================ ROOT APP ============================================================ */
function App(){
  const [facility, setFacility] = useState(null);
  const [view, setView] = useState("welcome");
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [selectedRec, setSelectedRec] = useState(null);
  const [facList, setFacList] = useState(null);
  const [activeRec, setActiveRec] = useState(null);

  useEffect(()=>{ if(facility) api.getFacilities().then(setFacList); }, [facility]);

  if(view==="welcome") return <Welcome onNext={()=>setView("login")} />;
  if(view==="login") return <LoginSignup onLogin={(f)=>{setFacility(f); setView("dashboard");}} />;

  const go = (v) => setView(v);

  let body;
  if(view==="dashboard") body = <Dashboard go={go} selectMedicine={setSelectedMedicine} />;
  else if(view==="stock") body = <Stock onOpen={(id)=>{setSelectedMedicine(id); go("medicineDetail");}} />;
  else if(view==="medicineDetail") body = <MedicineDetail id={selectedMedicine} back={()=>go("stock")} />;
  else if(view==="alerts") body = <Alerts onOpen={(id)=>{setSelectedMedicine(id); go("medicineDetail");}} />;
  else if(view==="surplus") body = <Surplus />;
  else if(view==="network") body = <Network />;
  else if(view==="recommendations") body = <Recommendations onOpen={(id)=>{setSelectedRec(id); go("recommendationDetail");}} />;
  else if(view==="recommendationDetail") body = <RecommendationDetail id={selectedRec} back={()=>go("recommendations")} onApprove={(r)=>{setActiveRec(r); go("approve");}} />;
  else if(view==="approve") body = facList ? <Approve rec={activeRec} fac={facList} onDone={()=>go("dashboard")} /> : <div className="empty">Loading…</div>;
  else body = <div className="empty">Unknown view</div>;

  return (
    <div className="shell">
      <Rail view={view} go={go} facility={facility} />
      <div className="main">
        <TopBar facility={facility} onLogout={()=>{setFacility(null); setView("welcome");}} />
        <div className="content">{body}</div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
