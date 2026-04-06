import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Users, Pencil } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { clients as CLIENT_LIST } from "@/lib/data/mock";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const CONTRACT_TYPES = [
  { value: "contractor", label: "Contractor" },
  { value: "employee",   label: "Employee" },
  { value: "internal",   label: "Internal" },
];

// ─── Person Form (shared by Add + Edit) ──────────────────────
function PersonForm({ initial, onSave, onCancel }) {
  const emptyForm = {
    name: "", country: "", client: "", personType: "contractor",
    startDate: "", role: "", birthday: "",
    email: "", personalEmail: "", phone: "", salary: "", currency: "USD", notes: "",
  };
  const [form, setForm] = useState(initial ? {
    name: initial.name || "",
    country: initial.country || "",
    client: initial.client || "",
    personType: initial.personType || "contractor",
    startDate: initial.startDate || initial.workAnniversary || "",
    role: initial.role || "",
    birthday: initial.birthday || "",
    email: initial.email || "",
    personalEmail: initial.personalEmail || "",
    phone: initial.phone || "",
    salary: initial.salary || "",
    currency: initial.currency || "USD",
    notes: initial.notes || "",
  } : emptyForm);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, salary: form.salary ? Number(form.salary) : null });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Row 1 */}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={form.role} onChange={e => set("role", e.target.value)} /></div>
      </div>
      {/* Row 2 */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Country</label>
          <select className="form-select" value={form.country} onChange={e => set("country", e.target.value)}>
            <option value="">— Select —</option>
            {Object.entries(COUNTRIES).map(([code, { flag, name }]) => (
              <option key={code} value={code}>{flag} {name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Client</label>
          <select className="form-select" value={form.client} onChange={e => set("client", e.target.value)}>
            <option value="">— None —</option>
            {CLIENT_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      {/* Row 3 */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Contract type</label>
          <select className="form-select" value={form.personType} onChange={e => set("personType", e.target.value)}>
            {CONTRACT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-group"><label className="form-label">Start date</label><input className="form-input" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
      </div>
      {/* Row 4 */}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Birthday</label><input className="form-input" type="date" value={form.birthday} onChange={e => set("birthday", e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Currency</label>
          <select className="form-select" value={form.currency} onChange={e => set("currency", e.target.value)}>
            <option value="USD">USD</option><option value="CLP">CLP</option><option value="BRL">BRL</option><option value="COP">COP</option><option value="PEN">PEN</option><option value="ARS">ARS</option>
          </select>
        </div>
      </div>
      {/* Row 5 — salary */}
      <div className="form-group"><label className="form-label">Salary ({form.currency})</label><input className="form-input" type="number" min="0" step="0.01" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="Monthly amount" /></div>
      {/* Row 6 — emails */}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Niuro email</label><input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Personal email</label><input className="form-input" type="email" value={form.personalEmail} onChange={e => set("personalEmail", e.target.value)} /></div>
      </div>
      {/* Row 7 */}
      <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="+56 9 XXXX XXXX" /></div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{initial ? "Save changes" : "Add person"}</button>
      </div>
    </form>
  );
}

// ─── Add modal ────────────────────────────────────────────────
function AddPersonModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [source, setSource] = useState("contractor"); // which list to add to

  return (
    <Modal title="Add Person" onClose={onClose} width={560}>
      <div className="filter-tabs" style={{ marginBottom: 14 }}>
        <button type="button" className={`filter-tab${source === "contractor" ? " filter-tab--active" : ""}`} onClick={() => setSource("contractor")}>Contractor / Employee</button>
        <button type="button" className={`filter-tab${source === "team" ? " filter-tab--active" : ""}`} onClick={() => setSource("team")}>Internal team</button>
      </div>
      <PersonForm
        onSave={(data) => {
          if (source === "contractor") {
            dispatch({ type: "ADD_CONTRACTOR", payload: { id: newId(), onboardingStatus: "not_started", onboardingSteps: [], ...data } });
          } else {
            dispatch({ type: "ADD_TEAM_MEMBER", payload: { id: newId(), workAnniversary: data.startDate, ...data } });
          }
          toast(`${data.name} added`, "success");
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}

// ─── Edit modal ───────────────────────────────────────────────
function EditPersonModal({ person, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  return (
    <Modal title={`Edit — ${person.name}`} onClose={onClose} width={560}>
      <PersonForm
        initial={person}
        onSave={(data) => {
          if (person._source === "contractor") {
            dispatch({ type: "UPDATE_CONTRACTOR", payload: { id: person.id, ...data } });
          } else {
            dispatch({ type: "UPDATE_TEAM_MEMBER", payload: { id: person.id, workAnniversary: data.startDate, ...data } });
          }
          toast("Saved", "success");
          onClose();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}

const TYPE_BADGE = {
  contractor: "badge--blue",
  employee:   "badge--green",
  internal:   "badge--gray",
};

export default function Team() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editPerson, setEditPerson] = useState(null);

  // Merge contractors + team members into one list
  const allPeople = [
    ...state.contractors.map(p => ({ ...p, _source: "contractor" })),
    ...state.team.map(p => ({ ...p, _source: "team", startDate: p.startDate || p.workAnniversary })),
  ].filter((p, idx, arr) => {
    // deduplicate by email
    if (!p.email) return true;
    return arr.findIndex(x => x.email === p.email) === idx;
  });

  const filtered = allPeople.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.role || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || p.personType === filterType;
    return matchSearch && matchType;
  });

  const counts = { all: allPeople.length };
  CONTRACT_TYPES.forEach(t => { counts[t.value] = allPeople.filter(p => p.personType === t.value).length; });

  return (
    <>
      <Head><title>Team — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-subtitle">{allPeople.length} people · contractors, employees &amp; internal</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add person</button>
        </div>

        {/* Summary */}
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 640, marginBottom: 20 }}>
          <div className="summary-card"><div className="summary-card__label">Total</div><div className="summary-card__value">{counts.all}</div></div>
          <div className="summary-card"><div className="summary-card__label">Contractors</div><div className="summary-card__value">{counts.contractor}</div></div>
          <div className="summary-card"><div className="summary-card__label">Employees</div><div className="summary-card__value">{counts.employee}</div></div>
          <div className="summary-card"><div className="summary-card__label">Internal</div><div className="summary-card__value">{counts.internal}</div></div>
        </div>

        <div className="section-block">
          <div className="table-toolbar">
            <div className="filter-tabs">
              <button className={`filter-tab${filterType === "all" ? " filter-tab--active" : ""}`} onClick={() => setFilterType("all")}>All</button>
              {CONTRACT_TYPES.map(t => (
                <button key={t.value} className={`filter-tab${filterType === t.value ? " filter-tab--active" : ""}`} onClick={() => setFilterType(t.value)}>{t.label}</button>
              ))}
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, role, email…" />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Users size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No people found</div>
              <div className="empty-state__sub">{search || filterType !== "all" ? "Try adjusting your filters." : "Add your first team member."}</div>
              {!search && filterType === "all" && <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add person</button>}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Start date</th>
                    <th>Role</th>
                    <th>Birthday</th>
                    <th>Niuro email</th>
                    <th>Personal email</th>
                    <th>Phone</th>
                    <th>Salary</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const country = p.country ? getCountry(p.country) : null;
                    const client = p.client ? CLIENT_LIST.find(c => c.id === p.client) : null;
                    return (
                      <tr key={`${p._source}-${p.id}`}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="reminder-avatar">{getInitials(p.name)}</div>
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13 }}>
                          {country ? <span title={country.name}>{country.flag} {country.name}</span> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{client?.name || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                        <td>
                          {p.personType
                            ? <span className={`badge ${TYPE_BADGE[p.personType] || "badge--gray"}`}>{CONTRACT_TYPES.find(t => t.value === p.personType)?.label || p.personType}</span>
                            : <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>
                          }
                        </td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.startDate || "—"}</td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{p.role || "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.birthday || "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.email || "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.personalEmail || "—"}</td>
                        <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.phone || "—"}</td>
                        <td style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                          {p.salary ? `${p.currency || "USD"} ${Number(p.salary).toLocaleString()}` : <span style={{ color: "var(--text-muted)" }}>—</span>}
                        </td>
                        <td style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <button className="btn-delete" title="Edit" onClick={() => setEditPerson(p)}><Pencil size={13} /></button>
                          <DeleteButton onDelete={() => {
                            if (p._source === "contractor") {
                              dispatch({ type: "DELETE_CONTRACTOR", payload: p.id });
                            } else {
                              dispatch({ type: "DELETE_TEAM_MEMBER", payload: p.id });
                            }
                            toast(`${p.name} removed`);
                          }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {showAdd && <AddPersonModal onClose={() => setShowAdd(false)} />}
        {editPerson && <EditPersonModal person={editPerson} onClose={() => setEditPerson(null)} />}
      </div>
    </>
  );
}
