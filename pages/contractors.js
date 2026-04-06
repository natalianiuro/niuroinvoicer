import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Users } from "lucide-react";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started", badgeClass: "badge--gray" },
  { value: "in_progress", label: "In Progress", badgeClass: "badge--yellow" },
  { value: "complete", label: "Complete", badgeClass: "badge--green" },
];

const DEFAULT_STEPS = [
  { label: "Contract signed", done: false },
  { label: "NDA signed", done: false },
  { label: "Access granted", done: false },
  { label: "Intro call done", done: false },
];

function OnboardingBadge({ status }) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  return <span className={`badge ${opt.badgeClass}`}>{opt.label}</span>;
}

function ProgressBar({ steps }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{done}/{steps.length}</span>
    </div>
  );
}

function AddContractorModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "", role: "", email: "", startDate: "", contractEndDate: "", notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    dispatch({
      type: "ADD_CONTRACTOR",
      payload: { id: newId(), ...form, onboardingStatus: "not_started", onboardingSteps: DEFAULT_STEPS },
    });
    toast(`${form.name} added as contractor`, "success");
    onClose();
  };

  return (
    <Modal title="Add Contractor" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <input className="form-input" value={form.role} onChange={(e) => set("role", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input className="form-input" type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Contract End Date</label>
            <input className="form-input" type="date" value={form.contractEndDate} onChange={(e) => set("contractEndDate", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add Contractor</button>
        </div>
      </form>
    </Modal>
  );
}

function OnboardingModal({ contractor, onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();

  const toggle = (i) => {
    dispatch({ type: "TOGGLE_ONBOARDING_STEP", payload: { contractorId: contractor.id, stepIndex: i } });
  };

  return (
    <Modal title={`Onboarding — ${contractor.name}`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
        {contractor.role}{contractor.email ? ` · ${contractor.email}` : ""}
      </p>
      <div className="checklist">
        {contractor.onboardingSteps.map((step, i) => (
          <label key={i} className={`checklist-item${step.done ? " checklist-item--done" : ""}`}>
            <input type="checkbox" checked={step.done} onChange={() => toggle(i)} />
            <span>{step.label}</span>
          </label>
        ))}
      </div>
      {contractor.notes && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 16, borderTop: "1px solid var(--border-light)", paddingTop: 12 }}>
          {contractor.notes}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn--ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

export default function Contractors() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { contractors } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  const filtered = contractors.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || c.onboardingStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const tabs = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

  const handleDelete = (c) => {
    dispatch({ type: "DELETE_CONTRACTOR", payload: c.id });
    toast(`${c.name} removed`, "default");
  };

  return (
    <>
      <Head><title>Contractors — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Contractors</h1>
            <p className="page-subtitle">{contractors.length} contractors</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Contractor</button>
        </div>

        <div className="section-block">
          <div className="table-toolbar">
            <div className="filter-tabs">
              {tabs.map((t) => (
                <button
                  key={t.value}
                  className={`filter-tab${filterStatus === t.value ? " filter-tab--active" : ""}`}
                  onClick={() => setFilterStatus(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search contractors…" />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Users size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No contractors found</div>
              <div className="empty-state__sub">
                {search || filterStatus !== "all" ? "Try adjusting your filters." : "Add your first contractor to get started."}
              </div>
              {!search && filterStatus === "all" && (
                <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Contractor</button>
              )}
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Start Date</th>
                  <th>Contract End</th>
                  <th>Onboarding</th>
                  <th>Progress</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setSelected(c)}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="reminder-avatar">{getInitials(c.name)}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.role || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.startDate || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.contractEndDate || "—"}</td>
                    <td><OnboardingBadge status={c.onboardingStatus} /></td>
                    <td><ProgressBar steps={c.onboardingSteps} /></td>
                    <td><DeleteButton onDelete={() => handleDelete(c)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && <AddContractorModal onClose={() => setShowAdd(false)} />}
        {selected && (
          <OnboardingModal
            contractor={state.contractors.find((c) => c.id === selected.id) || selected}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </>
  );
}
