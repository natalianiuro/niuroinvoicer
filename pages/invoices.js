import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import StatusSelect from "@/components/ui/StatusSelect";
import { useStore, newId } from "@/lib/store";

const STATUS_OPTIONS = [
  { value: "to_issue", label: "To Issue", badgeClass: "badge--yellow" },
  { value: "sent", label: "Sent", badgeClass: "badge--blue" },
  { value: "pending_payment", label: "Pending Payment", badgeClass: "badge--yellow" },
  { value: "paid", label: "Paid", badgeClass: "badge--green" },
];

function AddInvoiceModal({ onClose }) {
  const { dispatch, state } = useStore();
  const nextNum = String(state.invoices.length + 1).padStart(4, "0");
  const [form, setForm] = useState({
    invoiceNumber: nextNum,
    vendorName: "",
    amount: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vendorName.trim() || !form.amount) return;
    dispatch({
      type: "ADD_INVOICE",
      payload: { id: newId(), ...form, amount: parseFloat(form.amount), status: "to_issue" },
    });
    onClose();
  };

  return (
    <Modal title="Add Invoice" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Invoice #</label>
            <input className="form-input" value={form.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Client / Vendor *</label>
            <input className="form-input" value={form.vendorName} onChange={(e) => set("vendorName", e.target.value)} required />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Amount (USD) *</label>
          <input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Issue Date</label>
            <input className="form-input" type="date" value={form.issueDate} onChange={(e) => set("issueDate", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add Invoice</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Invoices() {
  const { state, dispatch } = useStore();
  const { invoices } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.includes(search);
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  const tabs = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoices · ${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })} outstanding</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/invoices/generator" className="btn btn--ghost">Invoice Generator</Link>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Invoice</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 600 }}>
        <div className="summary-card">
          <div className="summary-card__label">Total Billed</div>
          <div className="summary-card__value">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Outstanding</div>
          <div className="summary-card__value">${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Total Invoices</div>
          <div className="summary-card__value">{invoices.length}</div>
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
          <SearchBar value={search} onChange={setSearch} placeholder="Search invoices…" />
        </div>

        <table className="hr-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">No invoices match your filter.</div></td></tr>
            ) : filtered.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>#{inv.invoiceNumber}</td>
                <td style={{ fontWeight: 500 }}>{inv.vendorName}</td>
                <td>${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.issueDate || "—"}</td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate || "—"}</td>
                <td>
                  <StatusSelect
                    value={inv.status}
                    options={STATUS_OPTIONS}
                    onChange={(status) =>
                      dispatch({ type: "UPDATE_INVOICE_STATUS", payload: { id: inv.id, status } })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddInvoiceModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
