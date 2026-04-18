import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { UserCheck, CheckSquare, BarChart2, TrendingDown, Copy, Check } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { clients as CLIENT_LIST } from "@/lib/data/mock";

// ─── Shared helpers ───────────────────────────────────────────
function getInitials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function Avatar({ name }) {
  return <div className="reminder-avatar">{getInitials(name)}</div>;
}
function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const d = new Date(dateStr);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}
function DaysChip({ days }) {
  if (days === null) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  if (days < 0) return <span className="badge badge--gray">Overdue</span>;
  if (days === 0) return <span className="badge badge--green">Today</span>;
  if (days <= 14) return <span className="badge badge--yellow">{days}d</span>;
  if (days <= 60) return <span className="badge badge--blue">{days}d</span>;
  return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{days}d</span>;
}
function Stars({ n, max = 5 }) {
  return (
    <span style={{ fontSize: 13 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ color: i < n ? "#f59e0b" : "var(--border)" }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>{n}/{max}</span>
    </span>
  );
}
function clientName(id) {
  return CLIENT_LIST.find(c => c.id === id)?.name || id || "—";
}

function onboardingStatus(checklist) {
  const vals = Object.values(checklist);
  if (vals.every(Boolean))  return { label: "Completed",   cls: "badge--green" };
  if (vals.some(Boolean))   return { label: "In Progress", cls: "badge--yellow" };
  return                           { label: "Pending",     cls: "badge--gray" };
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handle} className="btn btn--ghost" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 10px" }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const WELCOME_DOC = (name) => `Welcome to Niuro, ${name || "[Name]"}!

We're excited to have you join the team. At Niuro, we work with international clients across different industries, providing high-quality engineering and technical talent. Your role is a key part of making that happen.

WORKING MODEL
You'll be embedded within a client's team, working closely with their product, engineering, and business stakeholders. This means adapting to their processes and communication style while representing Niuro's standards of quality and professionalism.

WHAT WE EXPECT FROM YOU
· Clear and timely communication — proactively update your client and the Niuro team on your progress.
· Availability — be present and responsive during agreed working hours.
· Proactivity — don't wait to be told what to do next. Raise blockers early, propose solutions, and take ownership.

BEFORE YOUR FIRST DAY
Before you start, we'll schedule an onboarding session with you. In that session we'll:
· Review the client context and what to expect in your first weeks
· Validate that all your accesses and tools are ready
· Answer any questions you may have
· Make sure everything is in place so your first day runs smoothly

We're here to support you — don't hesitate to reach out to the Niuro team at any point.

Welcome aboard!
— The Niuro Team`;

const EMAIL_ES = (name) => `Asunto: ¡Bienvenido/a a Niuro! 🎉

Hola ${name || "[Nombre]"},

¡Nos alegra mucho tenerte en el equipo! Antes de tu fecha de ingreso queremos coordinar contigo una sesión de onboarding para dejarte todo listo para el primer día.

En esa sesión vamos a:
· Darte contexto del cliente y del proyecto
· Revisar que tengas todos los accesos y herramientas necesarios
· Resolver cualquier duda que tengas antes de empezar

¿Tienes disponibilidad esta semana para una llamada de 30–45 minutos? Cualquier franja que te acomode nos sirve.

¡Nos vemos pronto!

[Tu nombre]
Niuro`;

const EMAIL_EN = (name) => `Subject: Welcome to Niuro! 🎉

Hey ${name || "[Name]"},

We're really excited to have you on board! Before your start date, we'd love to set up a quick onboarding call to make sure everything's ready for day one.

In that call we'll:
· Walk you through the client context and what your first weeks will look like
· Double-check that all your accesses and tools are set up
· Answer any questions you might have before you get started

Would you be free for a 30–45 min call sometime this week? Just let us know what works best for you.

Looking forward to it!

[Your name]
Niuro`;

// ══════════════════════════════════════════════════════════════
// TAB 1 — ONBOARDING
// ══════════════════════════════════════════════════════════════
const CHECKLIST_ITEMS = [
  { key: "contractSigned",   label: "Contract Signed" },
  { key: "ndaSigned",        label: "NDA Signed" },
  { key: "niuroCredentials", label: "Niuro Credentials" },
  { key: "niuroOnboarding",  label: "Onboarding HR" },
  { key: "computer",         label: "Laptop" },
  { key: "clientCredentials",label: "Client Credentials" },
];
const EMPTY_CHECKLIST = { contractSigned: false, ndaSigned: false, niuroCredentials: false, niuroOnboarding: false, computer: false, clientCredentials: false };

function OnboardingDetailModal({ record, onClose }) {
  const { dispatch } = useStore();
  const [emailLang, setEmailLang] = useState("es");
  const done = Object.values(record.checklist).filter(Boolean).length;
  const status = onboardingStatus(record.checklist);
  const emailText = emailLang === "es" ? EMAIL_ES(record.personName) : EMAIL_EN(record.personName);

  const blockStyle = { background: "var(--bg-subtle, #f7f7f6)", borderRadius: 8, padding: "14px 16px", fontSize: 12, fontFamily: "monospace", whiteSpace: "pre-wrap", color: "var(--text-secondary)", lineHeight: 1.65, maxHeight: 220, overflowY: "auto" };
  const sectionHeader = (title) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary, #1a1a1a)" }}>{title}</span>
    </div>
  );

  return (
    <Modal title={`Onboarding — ${record.personName}`} onClose={onClose} width={580}>
      {/* Summary */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{record.role}</span>
        {record.client && <><span style={{ color: "var(--border)" }}>·</span><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{clientName(record.client)}</span></>}
        {record.startDate && <><span style={{ color: "var(--border)" }}>·</span><span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Start: {record.startDate}</span></>}
        <span className={`badge ${status.cls}`}>{status.label}</span>
      </div>

      {/* Checklist */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Checklist <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>({done}/{CHECKLIST_ITEMS.length})</span></div>
        <div className="checklist">
          {CHECKLIST_ITEMS.map(item => (
            <label key={item.key} className={`checklist-item${record.checklist[item.key] ? " checklist-item--done" : ""}`}>
              <input type="checkbox" checked={!!record.checklist[item.key]} onChange={() => dispatch({ type: "TOGGLE_ONBOARDING_CHECK", payload: { id: record.id, key: item.key } })} />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        {record.notes && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 10 }}>{record.notes}</p>}
      </div>

      {/* Welcome Document */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          {sectionHeader("Welcome Document")}
          <CopyButton text={WELCOME_DOC(record.personName)} />
        </div>
        <div style={blockStyle}>{WELCOME_DOC(record.personName)}</div>
      </div>

      {/* Email Template */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          {sectionHeader("Email Template")}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <div className="filter-tabs" style={{ gap: 4 }}>
              <button className={`filter-tab${emailLang === "es" ? " filter-tab--active" : ""}`} style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setEmailLang("es")}>ES</button>
              <button className={`filter-tab${emailLang === "en" ? " filter-tab--active" : ""}`} style={{ fontSize: 11, padding: "3px 10px" }} onClick={() => setEmailLang("en")}>EN</button>
            </div>
            <CopyButton text={emailText} />
          </div>
        </div>
        <div style={blockStyle}>{emailText}</div>
      </div>

      <div className="form-actions"><button className="btn btn--ghost" onClick={onClose}>Close</button></div>
    </Modal>
  );
}

function AddOnboardingModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", role: "", client: "", startDate: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName) return;
    dispatch({ type: "ADD_ONBOARDING", payload: { id: newId(), ...form, checklist: { ...EMPTY_CHECKLIST } } });
    toast(`${form.personName} added to onboarding`, "success");
    onClose();
  };
  return (
    <Modal title="Add to Onboarding" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.personName} onChange={e => set("personName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={form.role} onChange={e => set("role", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Client</label>
            <select className="form-select" value={form.client} onChange={e => set("client", e.target.value)}>
              <option value="">— None —</option>
              {CLIENT_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Start date</label><input className="form-input" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add</button>
        </div>
      </form>
    </Modal>
  );
}

function CheckIcon({ done, onClick }) {
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, padding: "2px 4px" }} title={done ? "Mark pending" : "Mark complete"}>
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
    (o.role || "").toLowerCase().includes(search.toLowerCase())
  );

  const complete = onboarding.filter(o => Object.values(o.checklist).every(Boolean)).length;
  const inProgress = onboarding.filter(o => Object.values(o.checklist).some(Boolean) && !Object.values(o.checklist).every(Boolean)).length;

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 520, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Total</div><div className="summary-card__value">{onboarding.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Complete</div><div className="summary-card__value">{complete}</div></div>
        <div className="summary-card"><div className="summary-card__label">In progress</div><div className="summary-card__value">{inProgress}</div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search person…" />
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><CheckSquare size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No records</div><button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr>
              <th>Contractor</th>
              <th>Client</th>
              <th>Start Date</th>
              <th>Status</th>
              {CHECKLIST_ITEMS.map(i => <th key={i.key} style={{ fontSize: 10, maxWidth: 80, textAlign: "center" }}>{i.label}</th>)}
              <th>Progress</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(o => {
                const done = Object.values(o.checklist).filter(Boolean).length;
                const pct = Math.round(done / CHECKLIST_ITEMS.length * 100);
                return (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => setSelected(o)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={o.personName} />
                        <div>
                          <div style={{ fontWeight: 500 }}>{o.personName}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{o.role || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{o.client ? clientName(o.client) : "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{o.startDate || "—"}</td>
                    <td>
                      {(() => { const s = onboardingStatus(o.checklist); return <span className={`badge ${s.cls}`}>{s.label}</span>; })()}
                    </td>
                    {CHECKLIST_ITEMS.map(item => (
                      <td key={item.key} style={{ textAlign: "center" }}>
                        <CheckIcon done={!!o.checklist[item.key]} onClick={() => dispatch({ type: "TOGGLE_ONBOARDING_CHECK", payload: { id: o.id, key: item.key } })} />
                      </td>
                    ))}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress-bar-track"><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{done}/5</span>
                      </div>
                    </td>
                    <td onClick={e => e.stopPropagation()}><DeleteButton onDelete={() => { dispatch({ type: "DELETE_ONBOARDING", payload: o.id }); toast("Deleted"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddOnboardingModal onClose={() => setShowAdd(false)} />}
      {selected && <OnboardingDetailModal record={state.onboarding.find(o => o.id === selected.id) || selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — DEV SUCCESS
// ══════════════════════════════════════════════════════════════
const FORM_TYPES = [
  { value: "check-in",    label: "Check-in",    badgeClass: "badge--blue" },
  { value: "satisfaction",label: "Satisfaction", badgeClass: "badge--green" },
  { value: "performance", label: "Performance",  badgeClass: "badge--yellow" },
];

function AddDevSuccessModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", type: "check-in", sentDate: new Date().toISOString().slice(0,10), status: "sent", satisfaction: "", highlights: "", challenges: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "ADD_DEV_SUCCESS", payload: { id: newId(), ...form, satisfaction: form.satisfaction ? Number(form.satisfaction) : null } });
    toast("Form recorded", "success");
    onClose();
  };
  return (
    <Modal title="Record Form" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Person *</label><input className="form-input" value={form.personName} onChange={e => set("personName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>{FORM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Sent date</label><input className="form-input" type="date" value={form.sentDate} onChange={e => set("sentDate", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}><option value="sent">Sent</option><option value="completed">Completed</option></select></div>
        </div>
        {form.status === "completed" && (
          <>
            <div className="form-group"><label className="form-label">Satisfaction (1–5)</label><input className="form-input" type="number" min="1" max="5" value={form.satisfaction} onChange={e => set("satisfaction", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Highlights</label><textarea className="form-textarea" value={form.highlights} onChange={e => set("highlights", e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Challenges</label><textarea className="form-textarea" value={form.challenges} onChange={e => set("challenges", e.target.value)} /></div>
          </>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Save</button>
        </div>
      </form>
    </Modal>
  );
}

function RegisterResponseModal({ record, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ satisfaction: "", highlights: "", challenges: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "UPDATE_DEV_SUCCESS", payload: { id: record.id, status: "completed", satisfaction: form.satisfaction ? Number(form.satisfaction) : null, highlights: form.highlights, challenges: form.challenges, notes: form.notes } });
    toast("Response recorded", "success");
    onClose();
  };
  return (
    <Modal title={`Response — ${record.personName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label className="form-label">Satisfaction (1–5) *</label><input className="form-input" type="number" min="1" max="5" value={form.satisfaction} onChange={e => set("satisfaction", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Highlights</label><textarea className="form-textarea" value={form.highlights} onChange={e => set("highlights", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Challenges</label><textarea className="form-textarea" value={form.challenges} onChange={e => set("challenges", e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Save response</button>
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

  const filtered = devSuccess.filter(d => (d.personName || "").toLowerCase().includes(search.toLowerCase()));
  const completed = devSuccess.filter(d => d.status === "completed");
  const responseRate = devSuccess.length > 0 ? Math.round(completed.length / devSuccess.length * 100) : 0;
  const avgSat = completed.filter(d => d.satisfaction).length > 0
    ? (completed.filter(d => d.satisfaction).reduce((s, d) => s + d.satisfaction, 0) / completed.filter(d => d.satisfaction).length).toFixed(1)
    : "—";

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 520, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Forms sent</div><div className="summary-card__value">{devSuccess.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Response rate</div><div className="summary-card__value">{responseRate}%</div></div>
        <div className="summary-card"><div className="summary-card__label">Avg. satisfaction</div><div className="summary-card__value">{avgSat}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>/5</span></div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search person…" />
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Record</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><BarChart2 size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No forms</div><button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Record</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Person</th><th>Type</th><th>Sent</th><th>Status</th><th>Satisfaction</th><th>Highlights</th><th>Challenges</th><th></th></tr></thead>
            <tbody>
              {filtered.map(d => {
                const type = FORM_TYPES.find(t => t.value === d.type) || FORM_TYPES[0];
                return (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 500 }}>{d.personName}</td>
                    <td><span className={`badge ${type.badgeClass}`}>{type.label}</span></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{d.sentDate}</td>
                    <td>
                      {d.status === "completed"
                        ? <span className="badge badge--green">Completed</span>
                        : <button className="badge badge--gray" style={{ cursor: "pointer", border: "none" }} onClick={() => setResponding(d)}>Sent · Record ▸</button>
                      }
                    </td>
                    <td>{d.satisfaction ? <Stars n={d.satisfaction} /> : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.highlights || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.challenges || "—"}</td>
                    <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_DEV_SUCCESS", payload: d.id }); toast("Deleted"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddDevSuccessModal onClose={() => setShowAdd(false)} />}
      {responding && <RegisterResponseModal record={responding} onClose={() => setResponding(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — PERFORMANCE REVIEW
// ══════════════════════════════════════════════════════════════
function addMonths(dateStr, n) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function AddPerformanceModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", reviewDate: new Date().toISOString().slice(0,10), rating: "", salaryBefore: "", salaryAfter: "", currency: "USD", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    const nextReviewDate = addMonths(form.reviewDate, 6);
    dispatch({ type: "ADD_PERFORMANCE_REVIEW", payload: { id: newId(), ...form, rating: Number(form.rating), salaryBefore: Number(form.salaryBefore), salaryAfter: Number(form.salaryAfter), nextReviewDate } });
    toast("Performance review saved", "success");
    onClose();
  };
  return (
    <Modal title="Add Performance Review" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Person *</label><input className="form-input" value={form.personName} onChange={e => set("personName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Review date</label><input className="form-input" type="date" value={form.reviewDate} onChange={e => set("reviewDate", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Rating (1–5) *</label><input className="form-input" type="number" min="1" max="5" value={form.rating} onChange={e => set("rating", e.target.value)} required /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Previous salary *</label><input className="form-input" type="number" min="0" value={form.salaryBefore} onChange={e => set("salaryBefore", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">New salary *</label><input className="form-input" type="number" min="0" value={form.salaryAfter} onChange={e => set("salaryAfter", e.target.value)} required /></div>
        </div>
        <div className="form-group"><label className="form-label">Currency</label><select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}><option value="USD">USD</option><option value="CLP">CLP</option></select></div>
        <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Save</button>
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

  const filtered = performanceReviews.filter(p => (p.personName || "").toLowerCase().includes(search.toLowerCase()));
  const avgRating = performanceReviews.length > 0 ? (performanceReviews.reduce((s, p) => s + p.rating, 0) / performanceReviews.length).toFixed(1) : "—";
  const upcoming = performanceReviews.filter(p => { const d = getDaysUntil(p.nextReviewDate); return d !== null && d >= 0 && d <= 60; }).length;

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 520, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Reviews</div><div className="summary-card__value">{performanceReviews.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Avg. rating</div><div className="summary-card__value">{avgRating}<span style={{ fontSize: 14, color: "var(--text-muted)" }}>/5</span></div></div>
        <div className="summary-card"><div className="summary-card__label">Next 60 days</div><div className="summary-card__value">{upcoming}</div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search person…" />
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><BarChart2 size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No reviews</div><button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Person</th><th>Review Date</th><th>Rating</th><th>Prev. Salary</th><th>New Salary</th><th>Change</th><th>Currency</th><th>Next Review</th><th></th></tr></thead>
            <tbody>
              {filtered.map(p => {
                const pct = p.salaryBefore > 0 ? ((p.salaryAfter - p.salaryBefore) / p.salaryBefore * 100).toFixed(1) : "0.0";
                const pos = Number(pct) > 0;
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.personName}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.reviewDate}</td>
                    <td><Stars n={p.rating} /></td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{p.salaryBefore?.toLocaleString()}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{p.salaryAfter?.toLocaleString()}</td>
                    <td><span className={`badge ${pos ? "badge--green" : "badge--gray"}`}>{pos ? "+" : ""}{pct}%</span></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.currency}</td>
                    <td><DaysChip days={getDaysUntil(p.nextReviewDate)} /></td>
                    <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_PERFORMANCE_REVIEW", payload: p.id }); toast("Deleted"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && <AddPerformanceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4 — CHURN
// ══════════════════════════════════════════════════════════════
const CHURN_TYPES = [
  { value: "resignation",  label: "Resignation",    badgeClass: "badge--red" },
  { value: "layoff",       label: "Layoff",          badgeClass: "badge--yellow" },
  { value: "contract_end", label: "Contract end",    badgeClass: "badge--gray" },
  { value: "other",        label: "Other",           badgeClass: "badge--gray" },
];

function AddChurnModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", role: "", country: "", departureDate: new Date().toISOString().slice(0,10), type: "resignation", reason: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName) return;
    dispatch({ type: "ADD_CHURN", payload: { id: newId(), ...form } });
    toast("Departure recorded", "success");
    onClose();
  };
  return (
    <Modal title="Record Departure" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.personName} onChange={e => set("personName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={form.role} onChange={e => set("role", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Country</label><select className="form-select" value={form.country} onChange={e => set("country", e.target.value)}><option value="">— Select —</option>{Object.entries(COUNTRIES).map(([c, { flag, name }]) => <option key={c} value={c}>{flag} {name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Departure date</label><input className="form-input" type="date" value={form.departureDate} onChange={e => set("departureDate", e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>{CHURN_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Reason</label><textarea className="form-textarea" value={form.reason} onChange={e => set("reason", e.target.value)} placeholder="Reason for departure…" /></div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Save</button>
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

  const filtered = churn.filter(c => (c.personName || "").toLowerCase().includes(search.toLowerCase()) || (c.role || "").toLowerCase().includes(search.toLowerCase()));
  const resignations = churn.filter(c => c.type === "resignation").length;
  const byCountry = churn.reduce((acc, c) => { if (c.country) acc[c.country] = (acc[c.country] || 0) + 1; return acc; }, {});
  const byReason = churn.reduce((acc, c) => { const t = CHURN_TYPES.find(x => x.value === c.type); const label = t?.label || "Other"; acc[label] = (acc[label] || 0) + 1; return acc; }, {});

  return (
    <div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 520, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Total departures</div><div className="summary-card__value">{churn.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Resignations</div><div className="summary-card__value">{resignations}</div></div>
        <div className="summary-card"><div className="summary-card__label">Countries</div><div className="summary-card__value">{Object.keys(byCountry).length}</div></div>
      </div>

      <div className="section-block" style={{ marginBottom: 16 }}>
        <div className="table-toolbar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search person…" />
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Record departure</button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><TrendingDown size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No departures recorded</div></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Person</th><th>Role</th><th>Country</th><th>Departure Date</th><th>Type</th><th>Reason</th><th></th></tr></thead>
            <tbody>
              {filtered.map(c => {
                const type = CHURN_TYPES.find(t => t.value === c.type) || CHURN_TYPES[0];
                const country = c.country ? getCountry(c.country) : null;
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 500 }}>{c.personName}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{c.role || "—"}</td>
                    <td>{country ? <span title={country.name}>{country.flag} {country.name}</span> : "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{c.departureDate}</td>
                    <td><span className={`badge ${type.badgeClass}`}>{type.label}</span></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.reason || "—"}</td>
                    <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_CHURN", payload: c.id }); toast("Deleted"); }} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {churn.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="section-block">
            <div className="section-block__header"><span className="section-block__title">By type</span></div>
            <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(byReason).map(([label, count]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                  <span className="badge badge--gray">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="section-block">
            <div className="section-block__header"><span className="section-block__title">By country</span></div>
            <div style={{ padding: "12px 20px", display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.entries(byCountry).map(([code, count]) => {
                const { flag, name } = getCountry(code);
                return (
                  <div key={code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span title={name}>{flag} {name}</span>
                    <span className="badge badge--gray">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddChurnModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
const TABS = [
  { key: "onboarding",   label: "Onboarding",          icon: CheckSquare },
  { key: "devsuccess",   label: "Dev Success",          icon: BarChart2 },
  { key: "performance",  label: "Performance Review",   icon: UserCheck },
  { key: "churn",        label: "Churn",                icon: TrendingDown },
];

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
        <div className="filter-tabs" style={{ marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
          {TABS.map(({ key, label }) => (
            <button key={key} className={`filter-tab${tab === key ? " filter-tab--active" : ""}`} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>
        {tab === "onboarding"  && <OnboardingTab />}
        {tab === "devsuccess"  && <DevSuccessTab />}
        {tab === "performance" && <PerformanceTab />}
        {tab === "churn"       && <ChurnTab />}
      </div>
    </>
  );
}
