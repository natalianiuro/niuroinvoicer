import { useState } from "react";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import StatusSelect from "@/components/ui/StatusSelect";
import { useStore, newId } from "@/lib/store";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending", badgeClass: "badge--yellow" },
  { value: "approved", label: "Approved", badgeClass: "badge--blue" },
  { value: "paid", label: "Paid", badgeClass: "badge--green" },
];

const CATEGORIES = ["Software", "Travel", "Equipment", "Meals", "Training", "Other"];

function AddReimbursementModal({ onClose }) {
  const { dispatch } = useStore();
  const [form, setForm] = useState({
    personName: "", amount: "", category: "Software",
    dateSubmitted: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName.trim() || !form.amount) return;
    dispatch({
      type: "ADD_REIMBURSEMENT",
      payload: { id: newId(), ...form, amount: parseFloat(form.amount), status: "pending" },
    });
    onClose();
  };

  return (
    <Modal title="Add Reimbursement" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Person *</label>
            <input className="form-input" value={form.personName} onChange={(e) => set("personName", e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (USD) *</label>
            <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date Submitted</label>
            <input className="form-input" type="date" value={form.dateSubmitted} onChange={(e) => set("dateSubmitted", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add Reimbursement</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Reimbursements() {
  const { state, dispatch } = useStore();
  const { reimbursements } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = reimbursements.filter((r) => {
    const matchSearch =
      r.personName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = reimbursements.reduce((s, r) => s + r.amount, 0);
  const pending = reimbursements.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

  const tabs = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Reimbursements</h1>
          <p className="page-subtitle">{reimbursements.length} requests · ${pending.toFixed(2)} pending</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Reimbursement</button>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 600 }}>
        <div className="summary-card">
          <div className="summary-card__label">Total Submitted</div>
          <div className="summary-card__value">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Pending</div>
          <div className="summary-card__value">${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Requests</div>
          <div className="summary-card__value">{reimbursements.length}</div>
        </div>
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search reimbursements…" />
        </div>

        <table className="hr-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">No reimbursements match your filter.</div></td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.personName}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.description}</td>
                <td><span className="badge badge--gray">{r.category}</span></td>
                <td>${r.amount.toFixed(2)}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.dateSubmitted}</td>
                <td>
                  <StatusSelect
                    value={r.status}
                    options={STATUS_OPTIONS}
                    onChange={(status) =>
                      dispatch({ type: "UPDATE_REIMBURSEMENT_STATUS", payload: { id: r.id, status } })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddReimbursementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
