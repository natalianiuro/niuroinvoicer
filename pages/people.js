import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { UserCheck, CheckSquare, BarChart2, TrendingDown } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/countries";

// ─── Shared helpers ───────────────────────────────────────────
function getInitials(name) {
  return name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
}
function Avatar({ name }) {
  return <div className="reminder-avatar">{getInitials(name)}</div>;
}
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d - today) / (1000*60*60*24));
}
function DaysChip({ days }) {
  if (days === null) return <span style={{color:"var(--text-muted)",fontSize:12}}>—</span>;
  if (days < 0) return <span className="badge badge--gray">Vencido</span>;
  if (days === 0) return <span className="badge badge--green">Hoy</span>;
  if (days <= 14) return <span className="badge badge--yellow">{days}d</span>;
  if (days <= 60) return <span className="badge badge--blue">{days}d</span>;
  return <span style={{fontSize:12,color:"var(--text-muted)"}}>{days}d</span>;
}

function Stars({ n, max=5 }) {
  return (
    <span style={{ fontSize:13 }}>
      {Array.from({length:max}).map((_,i) => (
        <span key={i} style={{ color: i<n ? "#f59e0b" : "var(--border)" }}>★</span>
      ))}
      <span style={{ fontSize:11, color:"var(--text-muted)", marginLeft:4 }}>{n}/{max}</span>
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1 — ONBOARDING
// ══════════════════════════════════════════════════════════════
const CHECKLIST_ITEMS = [
  { key:"niuroCredentials",  label:"Credenciales Niuro" },
  { key:"clientCredentials", label:"Credenciales cliente" },
  { key:"computer",          label:"Computador (si aplica)" },
  { key:"onboardingMeeting", label:"Reunión de onboarding" },
  { key:"ndaSigned",         label:"Firma de NDAs" },
];

function OnboardingDetailModal({ record, onClose }) {
  const { dispatch } = useStore();
  const done = Object.values(record.checklist).filter(Boolean).length;
  return (
    <Modal title={`Onboarding — ${record.personName}`} onClose={onClose}>
      <p style={{ fontSize:13, color:"var(--text-secondary)", marginBottom:16 }}>
        {record.role} · Inicio: {record.startDate || "—"}
      </p>
      <div className="checklist">
        {CHECKLIST_ITEMS.map(item => (
          <label key={item.key} className={`checklist-item${record.checklist[item.key]?" checklist-item--done":""}`}>
            <input type="checkbox" checked={!!record.checklist[item.key]} onChange={() => dispatch({ type:"TOGGLE_ONBOARDING_CHECK", payload:{ id:record.id, key:item.key } })} />
            <span>{item.label}</span>
          </label>
        ))}
      </div>
      {record.notes && <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:14, paddingTop:12, borderTop:"1px solid var(--border-light)" }}>{record.notes}</p>}
      <div style={{ marginTop:16, fontSize:13, color:"var(--text-secondary)" }}>
        Completado: <strong>{done}/5</strong>
      </div>
      <div className="form-actions"><button className="btn btn--ghost" onClick={onClose}>Cerrar</button></div>
    </Modal>
  );
}

function AddOnboardingModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName:"", role:"", startDate:"", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName) return;
    dispatch({ type:"ADD_ONBOARDING", payload:{ id:newId(), ...form, checklist:{ niuroCredentials:false, clientCredentials:false, computer:false, onboardingMeeting:false, ndaSigned:false } } });
    toast(`${form.personName} agregado a onboarding`,"success");
    onClose();
  };
  return (
    <Modal title="Agregar a Onboarding" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.personName} onChange={e=>set("personName",e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Rol</label><input className="form-input" value={form.role} onChange={e=>set("role",e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Fecha de inicio</label><input className="form-input" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Agregar</button>
        </div>
      </form>
    </Modal>
  );
}

function CheckIcon({ done, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:16, padding:"2px 4px" }} title={done?"Marcar pendiente":"Marcar completo"}>
      {done ? "✅" : "⬜"}
    </button>
  );
}

function OnboardingTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { onboarding } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = onboarding.filter(o =>
    o.personName.toLowerCase().includes(search.toLowerCase()) ||
    (o.role||"").toLowerCase().includes(search.toLowerCase())
  );

  const complete = onboarding.filter(o => Object.values(o.checklist).every(Boolean)).length;
  const inProgress = onboarding.filter(o => Object.values(o.checklist).some(Boolean) && !Object.values(o.checklist).every(Boolean)).length;

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns:"repeat(3,1fr)", maxWidth:520, marginBottom:20 }}>
        <div className="summary-card"><div className="summary-card__label">Total</div><div className="summary-card__value">{onboarding.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Completos</div><div className="summary-card__value">{complete}</div></div>
        <div className="summary-card"><div className="summary-card__label">En progreso</div><div className="summary-card__value">{inProgress}</div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar persona…" />
          <button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Agregar</button>
        </div>
        {filtered.length===0 ? (
          <div className="empty-state"><div className="empty-state__icon"><CheckSquare size={28} color="var(--text-muted)"/></div><div className="empty-state__title">Sin registros</div><button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Agregar</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr>
              <th>Persona</th>
              {CHECKLIST_ITEMS.map(i=><th key={i.key} title={i.label} style={{fontSize:10,maxWidth:70,textAlign:"center"}}>{i.label.split(" ")[0]}</th>)}
              <th>Progreso</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(o => {
                const done = Object.values(o.checklist).filter(Boolean).length;
                const pct = Math.round(done/5*100);
                return (
                  <tr key={o.id} style={{cursor:"pointer"}} onClick={()=>setSelected(o)}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <Avatar name={o.personName} />
                        <div>
                          <div style={{fontWeight:500}}>{o.personName}</div>
                          <div style={{fontSize:12,color:"var(--text-muted)"}}>{o.role||"—"}</div>
                        </div>
                      </div>
                    </td>
                    {CHECKLIST_ITEMS.map(item=>(
                      <td key={item.key} style={{textAlign:"center"}}>
                        <CheckIcon done={!!o.checklist[item.key]} onClick={()=>dispatch({type:"TOGGLE_ONBOARDING_CHECK",payload:{id:o.id,key:item.key}})} />
                      </td>
                    ))}
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{width:`${pct}%`}} /></div>
                        <span style={{fontSize:11,color:"var(--text-muted)"}}>{done}/5</span>
                      </div>
                    </td>
                    <td onClick={e=>e.stopPropagation()}><DeleteButton onDelete={()=>{ dispatch({type:"DELETE_ONBOARDING",payload:o.id}); toast("Eliminado"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddOnboardingModal onClose={()=>setShowAdd(false)} />}
      {selected && <OnboardingDetailModal record={state.onboarding.find(o=>o.id===selected.id)||selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — DEV SUCCESS
// ══════════════════════════════════════════════════════════════
const FORM_TYPES = [
  { value:"check-in",    label:"Check-in",    badgeClass:"badge--blue" },
  { value:"satisfaction",label:"Satisfaction",badgeClass:"badge--green" },
  { value:"performance", label:"Performance", badgeClass:"badge--yellow" },
];

function AddDevSuccessModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName:"", type:"check-in", sentDate:new Date().toISOString().slice(0,10), status:"sent", satisfaction:"", highlights:"", challenges:"", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type:"ADD_DEV_SUCCESS", payload:{ id:newId(), ...form, satisfaction: form.satisfaction ? Number(form.satisfaction) : null } });
    toast("Formulario registrado","success");
    onClose();
  };
  return (
    <Modal title="Registrar Formulario" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Persona *</label><input className="form-input" value={form.personName} onChange={e=>set("personName",e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Tipo</label><select className="form-select" value={form.type} onChange={e=>set("type",e.target.value)}>{FORM_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Fecha de envío</label><input className="form-input" type="date" value={form.sentDate} onChange={e=>set("sentDate",e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Estado</label><select className="form-select" value={form.status} onChange={e=>set("status",e.target.value)}><option value="sent">Enviado</option><option value="completed">Respondido</option></select></div>
        </div>
        {form.status==="completed" && (
          <>
            <div className="form-group"><label className="form-label">Satisfacción (1–5)</label><input className="form-input" type="number" min="1" max="5" value={form.satisfaction} onChange={e=>set("satisfaction",e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Highlights</label><textarea className="form-textarea" value={form.highlights} onChange={e=>set("highlights",e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Challenges</label><textarea className="form-textarea" value={form.challenges} onChange={e=>set("challenges",e.target.value)} /></div>
          </>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function RegisterResponseModal({ record, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ satisfaction:"", highlights:"", challenges:"", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type:"UPDATE_DEV_SUCCESS", payload:{ id:record.id, status:"completed", satisfaction: form.satisfaction ? Number(form.satisfaction) : null, highlights:form.highlights, challenges:form.challenges, notes:form.notes } });
    toast("Respuesta registrada","success");
    onClose();
  };
  return (
    <Modal title={`Respuesta — ${record.personName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label className="form-label">Satisfacción (1–5) *</label><input className="form-input" type="number" min="1" max="5" value={form.satisfaction} onChange={e=>set("satisfaction",e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Highlights</label><textarea className="form-textarea" value={form.highlights} onChange={e=>set("highlights",e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Challenges</label><textarea className="form-textarea" value={form.challenges} onChange={e=>set("challenges",e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar respuesta</button>
        </div>
      </form>
    </Modal>
  );
}

function DevSuccessTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { devSuccess } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [responding, setResponding] = useState(null);

  const filtered = devSuccess.filter(d => (d.personName||"").toLowerCase().includes(search.toLowerCase()));
  const completed = devSuccess.filter(d=>d.status==="completed");
  const responseRate = devSuccess.length>0 ? Math.round(completed.length/devSuccess.length*100) : 0;
  const avgSat = completed.filter(d=>d.satisfaction).length>0
    ? (completed.filter(d=>d.satisfaction).reduce((s,d)=>s+d.satisfaction,0)/completed.filter(d=>d.satisfaction).length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns:"repeat(3,1fr)", maxWidth:520, marginBottom:20 }}>
        <div className="summary-card"><div className="summary-card__label">Forms enviados</div><div className="summary-card__value">{devSuccess.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Tasa respuesta</div><div className="summary-card__value">{responseRate}%</div></div>
        <div className="summary-card"><div className="summary-card__label">Satisfacción prom.</div><div className="summary-card__value">{avgSat}<span style={{fontSize:14,color:"var(--text-muted)"}}>/5</span></div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar persona…" />
          <button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Registrar</button>
        </div>
        {filtered.length===0 ? (
          <div className="empty-state"><div className="empty-state__icon"><BarChart2 size={28} color="var(--text-muted)"/></div><div className="empty-state__title">Sin formularios</div><button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Registrar</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Persona</th><th>Tipo</th><th>Enviado</th><th>Estado</th><th>Satisfacción</th><th>Highlights</th><th>Challenges</th><th></th></tr></thead>
            <tbody>
              {filtered.map(d=>{
                const type = FORM_TYPES.find(t=>t.value===d.type)||FORM_TYPES[0];
                return (
                  <tr key={d.id}>
                    <td style={{fontWeight:500}}>{d.personName}</td>
                    <td><span className={`badge ${type.badgeClass}`}>{type.label}</span></td>
                    <td style={{color:"var(--text-secondary)",fontSize:12}}>{d.sentDate}</td>
                    <td>
                      {d.status==="completed"
                        ? <span className="badge badge--green">Respondido</span>
                        : <button className="badge badge--gray" style={{cursor:"pointer",border:"none"}} onClick={()=>setResponding(d)}>Enviado · Registrar ▸</button>
                      }
                    </td>
                    <td>{d.satisfaction ? <Stars n={d.satisfaction} /> : <span style={{color:"var(--text-muted)",fontSize:12}}>—</span>}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:12,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.highlights||"—"}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:12,maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.challenges||"—"}</td>
                    <td><DeleteButton onDelete={()=>{ dispatch({type:"DELETE_DEV_SUCCESS",payload:d.id}); toast("Eliminado"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddDevSuccessModal onClose={()=>setShowAdd(false)} />}
      {responding && <RegisterResponseModal record={responding} onClose={()=>setResponding(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — PERFORMANCE REVIEW
// ══════════════════════════════════════════════════════════════
function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth()+n);
  return d.toISOString().slice(0,10);
}

function AddPerformanceModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName:"", reviewDate:new Date().toISOString().slice(0,10), rating:"", salaryBefore:"", salaryAfter:"", currency:"USD", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    const nextReviewDate = addMonths(form.reviewDate, 6);
    dispatch({ type:"ADD_PERFORMANCE_REVIEW", payload:{ id:newId(), ...form, rating:Number(form.rating), salaryBefore:Number(form.salaryBefore), salaryAfter:Number(form.salaryAfter), nextReviewDate } });
    toast("Performance review guardada","success");
    onClose();
  };
  return (
    <Modal title="Agregar Performance Review" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Persona *</label><input className="form-input" value={form.personName} onChange={e=>set("personName",e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Fecha review</label><input className="form-input" type="date" value={form.reviewDate} onChange={e=>set("reviewDate",e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Rating (1–5) *</label><input className="form-input" type="number" min="1" max="5" value={form.rating} onChange={e=>set("rating",e.target.value)} required /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Sueldo anterior *</label><input className="form-input" type="number" min="0" value={form.salaryBefore} onChange={e=>set("salaryBefore",e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Sueldo nuevo *</label><input className="form-input" type="number" min="0" value={form.salaryAfter} onChange={e=>set("salaryAfter",e.target.value)} required /></div>
        </div>
        <div className="form-group"><label className="form-label">Moneda</label><select className="form-select" value={form.currency} onChange={e=>set("currency",e.target.value)}><option value="USD">USD</option><option value="CLP">CLP</option></select></div>
        <div className="form-group"><label className="form-label">Notas</label><textarea className="form-textarea" value={form.notes} onChange={e=>set("notes",e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function PerformanceTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { performanceReviews } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = performanceReviews.filter(p => (p.personName||"").toLowerCase().includes(search.toLowerCase()));
  const avgRating = performanceReviews.length>0 ? (performanceReviews.reduce((s,p)=>s+p.rating,0)/performanceReviews.length).toFixed(1) : "—";
  const upcoming = performanceReviews.filter(p => { const d=getDaysUntil(p.nextReviewDate); return d!==null && d>=0 && d<=60; }).length;

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns:"repeat(3,1fr)", maxWidth:520, marginBottom:20 }}>
        <div className="summary-card"><div className="summary-card__label">Reviews</div><div className="summary-card__value">{performanceReviews.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Rating promedio</div><div className="summary-card__value">{avgRating}<span style={{fontSize:14,color:"var(--text-muted)"}}>/5</span></div></div>
        <div className="summary-card"><div className="summary-card__label">Próximas 60d</div><div className="summary-card__value">{upcoming}</div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar persona…" />
          <button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Agregar</button>
        </div>
        {filtered.length===0 ? (
          <div className="empty-state"><div className="empty-state__icon"><BarChart2 size={28} color="var(--text-muted)"/></div><div className="empty-state__title">Sin reviews</div><button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Agregar</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Persona</th><th>Fecha Review</th><th>Rating</th><th>Sueldo Ant.</th><th>Sueldo Nuevo</th><th>Cambio</th><th>Moneda</th><th>Próxima Review</th><th></th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const pct = p.salaryBefore>0 ? ((p.salaryAfter-p.salaryBefore)/p.salaryBefore*100).toFixed(1) : "0.0";
                const pos = Number(pct) > 0;
                return (
                  <tr key={p.id}>
                    <td style={{fontWeight:500}}>{p.personName}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:12}}>{p.reviewDate}</td>
                    <td><Stars n={p.rating} /></td>
                    <td style={{fontVariantNumeric:"tabular-nums"}}>{p.salaryBefore?.toLocaleString()}</td>
                    <td style={{fontVariantNumeric:"tabular-nums",fontWeight:500}}>{p.salaryAfter?.toLocaleString()}</td>
                    <td><span className={`badge ${pos?"badge--green":"badge--gray"}`}>{pos?"+":""}{pct}%</span></td>
                    <td style={{color:"var(--text-secondary)",fontSize:12}}>{p.currency}</td>
                    <td><DaysChip days={getDaysUntil(p.nextReviewDate)} /></td>
                    <td><DeleteButton onDelete={()=>{ dispatch({type:"DELETE_PERFORMANCE_REVIEW",payload:p.id}); toast("Eliminado"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddPerformanceModal onClose={()=>setShowAdd(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4 — CHURN
// ══════════════════════════════════════════════════════════════
const CHURN_TYPES = [
  { value:"resignation",  label:"Renuncia",       badgeClass:"badge--red" },
  { value:"layoff",       label:"Desvinculación",  badgeClass:"badge--yellow" },
  { value:"contract_end", label:"Fin contrato",    badgeClass:"badge--gray" },
  { value:"other",        label:"Otro",            badgeClass:"badge--gray" },
];

function AddChurnModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName:"", role:"", country:"", departureDate:new Date().toISOString().slice(0,10), type:"resignation", reason:"", notes:"" });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName) return;
    dispatch({ type:"ADD_CHURN", payload:{ id:newId(), ...form } });
    toast("Registro de salida guardado","success");
    onClose();
  };
  return (
    <Modal title="Registrar Salida" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Nombre *</label><input className="form-input" value={form.personName} onChange={e=>set("personName",e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Rol</label><input className="form-input" value={form.role} onChange={e=>set("role",e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">País</label><select className="form-select" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">— Seleccionar —</option>{Object.entries(COUNTRIES).map(([c,{flag,name}])=><option key={c} value={c}>{flag} {name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Fecha de salida</label><input className="form-input" type="date" value={form.departureDate} onChange={e=>set("departureDate",e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Tipo</label><select className="form-select" value={form.type} onChange={e=>set("type",e.target.value)}>{CHURN_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Razón</label><textarea className="form-textarea" value={form.reason} onChange={e=>set("reason",e.target.value)} placeholder="Motivo de la salida…" /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

function ChurnTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { churn } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = churn.filter(c => (c.personName||"").toLowerCase().includes(search.toLowerCase()) || (c.role||"").toLowerCase().includes(search.toLowerCase()));

  const resignations = churn.filter(c=>c.type==="resignation").length;
  const byCountry = churn.reduce((acc,c)=>{ if(c.country) acc[c.country]=(acc[c.country]||0)+1; return acc; }, {});
  const byReason = churn.reduce((acc,c)=>{ const t=CHURN_TYPES.find(x=>x.value===c.type); const label=t?.label||"Otro"; acc[label]=(acc[label]||0)+1; return acc; }, {});

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns:"repeat(3,1fr)", maxWidth:520, marginBottom:20 }}>
        <div className="summary-card"><div className="summary-card__label">Total salidas</div><div className="summary-card__value">{churn.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Renuncias</div><div className="summary-card__value">{resignations}</div></div>
        <div className="summary-card"><div className="summary-card__label">Países</div><div className="summary-card__value">{Object.keys(byCountry).length}</div></div>
      </div>

      <div className="section-block" style={{ marginBottom:16 }}>
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Buscar persona…" />
          <button className="btn btn--primary" onClick={()=>setShowAdd(true)}>+ Registrar salida</button>
        </div>
        {filtered.length===0 ? (
          <div className="empty-state"><div className="empty-state__icon"><TrendingDown size={28} color="var(--text-muted)"/></div><div className="empty-state__title">Sin registros de salida</div></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Persona</th><th>Rol</th><th>País</th><th>Fecha Salida</th><th>Tipo</th><th>Razón</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c=>{
                const type = CHURN_TYPES.find(t=>t.value===c.type)||CHURN_TYPES[0];
                const country = c.country ? getCountry(c.country) : null;
                return (
                  <tr key={c.id}>
                    <td style={{fontWeight:500}}>{c.personName}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:12}}>{c.role||"—"}</td>
                    <td>{country ? <span title={country.name}>{country.flag} {country.name}</span> : "—"}</td>
                    <td style={{color:"var(--text-secondary)",fontSize:12}}>{c.departureDate}</td>
                    <td><span className={`badge ${type.badgeClass}`}>{type.label}</span></td>
                    <td style={{color:"var(--text-secondary)",fontSize:12,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.reason||"—"}</td>
                    <td><DeleteButton onDelete={()=>{ dispatch({type:"DELETE_CHURN",payload:c.id}); toast("Eliminado"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {churn.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div className="section-block">
            <div className="section-block__header"><span className="section-block__title">Por tipo</span></div>
            <div style={{padding:"12px 20px",display:"flex",flexWrap:"wrap",gap:8}}>
              {Object.entries(byReason).map(([label,count])=>(
                <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13,color:"var(--text-secondary)"}}>{label}</span>
                  <span className="badge badge--gray">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="section-block">
            <div className="section-block__header"><span className="section-block__title">Por país</span></div>
            <div style={{padding:"12px 20px",display:"flex",flexWrap:"wrap",gap:8}}>
              {Object.entries(byCountry).map(([code,count])=>{
                const {flag,name}=getCountry(code);
                return (
                  <div key={code} style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:16}}>{flag}</span>
                    <span style={{fontSize:13,color:"var(--text-secondary)"}}>{name}</span>
                    <span className="badge badge--gray">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showAdd && <AddChurnModal onClose={()=>setShowAdd(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default function People() {
  const [tab, setTab] = useState("onboarding");
  return (
    <>
      <Head><title>People — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">People</h1>
            <p className="page-subtitle">Onboarding · Dev Success · Performance · Churn</p>
          </div>
        </div>
        <div className="filter-tabs" style={{ marginBottom:24, borderBottom:"1px solid var(--border)", paddingBottom:4 }}>
          {[["onboarding","Onboarding"],["devsuccess","Dev Success"],["performance","Performance"],["churn","Churn"]].map(([v,l])=>(
            <button key={v} className={`filter-tab${tab===v?" filter-tab--active":""}`} onClick={()=>setTab(v)}>{l}</button>
          ))}
        </div>
        {tab==="onboarding"  && <OnboardingTab />}
        {tab==="devsuccess"  && <DevSuccessTab />}
        {tab==="performance" && <PerformanceTab />}
        {tab==="churn"       && <ChurnTab />}
      </div>
    </>
  );
}
