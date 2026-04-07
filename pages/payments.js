import { useState, useRef } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import StatusSelect from "@/components/ui/StatusSelect";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Download, Paperclip, X, CreditCard, Receipt, AlertCircle, Pencil } from "lucide-react";

// ─── Excel export helper ──────────────────────────────────────
async function toExcel(rows, sheetName, filename, colWidths) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const fmt = (n) => Number(n).toLocaleString("es-CL", { minimumFractionDigits: 0 });
const fmtCLP = (n) => `$${fmt(n)}`;

// ══════════════════════════════════════════════════════════════
// TAB 1 — FACTURAS LOCALES (bank payments)
// ══════════════════════════════════════════════════════════════
const COMMON_BENEFICIARIES = [
  { name: "Buk",          email: "pagos@buk.cl",       accountNumber: "12345678", bankCode: "001" },
  { name: "WeWork",       email: "billing@wework.com", accountNumber: "87654321", bankCode: "012" },
  { name: "TGP",          email: "admin@tgp.cl",       accountNumber: "11223344", bankCode: "009" },
  { name: "Contabilidad", email: "contador@estudio.cl",accountNumber: "55667788", bankCode: "001" },
];

async function exportBankPayments(payments, groupLabel) {
  const suffix = groupLabel || new Date().toISOString().slice(0,10);
  await toExcel(
    payments.map((p) => ({
      "Beneficiary":    p.beneficiaryName,
      "Amount":         p.amount,
      "Account #":      p.accountNumber,
      "Bank Code":      p.bankCode,
      "Email":          p.email,
      "Glosa":          p.glosa,
      "Date":           p.date,
    })),
    "Facturas",
    `facturas_niuro_${suffix}.xlsx`,
    [{ wch:22 },{ wch:14 },{ wch:18 },{ wch:14 },{ wch:26 },{ wch:36 },{ wch:14 }]
  );
}

function BankPaymentForm({ initial, onSave, onCancel }) {
  const [usePreset, setUsePreset] = useState(!initial?.id);
  const [preset, setPreset] = useState(COMMON_BENEFICIARIES[0].name);
  const [form, setForm] = useState({
    beneficiaryName: initial?.beneficiaryName || "",
    amount: initial?.amount || "",
    accountNumber: initial?.accountNumber || "",
    bankCode: initial?.bankCode || "",
    email: initial?.email || "",
    glosa: initial?.glosa || "",
    date: initial?.date || new Date().toISOString().slice(0,10),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePreset = (name) => {
    setPreset(name);
    const p = COMMON_BENEFICIARIES.find(b => b.name === name);
    if (p) setForm(f => ({ ...f, beneficiaryName: p.name, accountNumber: p.accountNumber, bankCode: p.bankCode, email: p.email }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const base = usePreset && !initial?.id ? COMMON_BENEFICIARIES.find(b => b.name === preset) : {};
    onSave({ ...base, ...form, beneficiaryName: usePreset && !initial?.id ? preset : form.beneficiaryName, amount: parseFloat(form.amount) });
  };

  const isEdit = !!initial?.id;

  return (
    <form onSubmit={handleSubmit}>
      {!isEdit && (
        <div className="filter-tabs" style={{ marginBottom: 14 }}>
          <button type="button" className={`filter-tab${usePreset ? " filter-tab--active" : ""}`} onClick={() => setUsePreset(true)}>Common beneficiary</button>
          <button type="button" className={`filter-tab${!usePreset ? " filter-tab--active" : ""}`} onClick={() => setUsePreset(false)}>New beneficiary</button>
        </div>
      )}
      {!isEdit && usePreset ? (
        <div className="form-group">
          <label className="form-label">Beneficiary</label>
          <select className="form-select" value={preset} onChange={e => handlePreset(e.target.value)}>
            {COMMON_BENEFICIARIES.map(b => <option key={b.name}>{b.name}</option>)}
          </select>
        </div>
      ) : (
        <div className="form-row">
          <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={form.beneficiaryName} onChange={e => set("beneficiaryName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        </div>
      )}
      <div className="form-row">
        <div className="form-group"><label className="form-label">Amount *</label><input className="form-input" type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} required /></div>
        <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => set("date", e.target.value)} /></div>
      </div>
      {(!usePreset || isEdit) && (
        <div className="form-row">
          <div className="form-group"><label className="form-label">Account #</label><input className="form-input" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Bank Code</label><input className="form-input" value={form.bankCode} onChange={e => set("bankCode", e.target.value)} /></div>
        </div>
      )}
      <div className="form-group"><label className="form-label">Glosa</label><input className="form-input" value={form.glosa} onChange={e => set("glosa", e.target.value)} /></div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{isEdit ? "Save changes" : "Add"}</button>
      </div>
    </form>
  );
}

// ─── New Group Modal ──────────────────────────────────────────
function NewGroupModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const now = new Date();
  const [form, setForm] = useState({
    name: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: "ADD_PAYMENT_GROUP", payload: { id: newId(), ...form, month: Number(form.month), year: Number(form.year) } });
    toast("Group created", "success");
    onClose();
  };
  return (
    <Modal title="New Invoice Group" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Group name *</label>
          <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Month</label>
            <select className="form-select" value={form.month} onChange={e => { const m = Number(e.target.value); set("month", m); set("name", `${MONTHS[m-1]} ${form.year}`); }}>
              {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year</label>
            <input className="form-input" type="number" value={form.year} onChange={e => { set("year", e.target.value); set("name", `${MONTHS[form.month-1]} ${e.target.value}`); }} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Create group</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Single group section ─────────────────────────────────────
function PaymentGroup({ group, payments, dispatch, toast }) {
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

  const handleExport = async () => {
    if (!payments.length) { toast("No invoices in this group", "error"); return; }
    const safeName = group.name.replace(/\s+/g, "_");
    await exportBankPayments(payments, safeName);
    toast(`${payments.length} invoice(s) exported`, "success");
  };

  return (
    <div className="section-block" style={{ marginBottom: 16 }}>
      {/* Group header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: open ? "1px solid var(--border-light)" : "none", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{group.name}</span>
          <span className="badge badge--gray">{payments.length} {payments.length === 1 ? "line" : "lines"}</span>
          <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>{fmtCLP(total)}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          <button className="btn btn--ghost" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }} onClick={handleExport}>
            <Download size={13} /> Export
          </button>
          <button className="btn btn--primary" style={{ fontSize: 13, padding: "5px 12px" }} onClick={() => setShowAdd(true)}>+ Add line</button>
          <DeleteButton onDelete={() => dispatch({ type: "DELETE_PAYMENT_GROUP", payload: group.id })} />
          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Lines table */}
      {open && (
        payments.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No lines yet. <button className="btn btn--ghost" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>+ Add line</button>
          </div>
        ) : (
          <table className="hr-table">
            <thead><tr>
              <th>Beneficiary</th><th>Amount</th><th>Account #</th><th>Bank</th><th>Email</th><th>Glosa</th><th>Date</th><th></th>
            </tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.beneficiaryName}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCLP(p.amount)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{p.accountNumber || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.bankCode || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.email || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.glosa || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{p.date || "—"}</td>
                  <td style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button className="btn-delete" title="Edit" onClick={() => setEditItem(p)}><Pencil size={13} /></button>
                    <DeleteButton onDelete={() => { dispatch({ type: "DELETE_BANK_PAYMENT", payload: p.id }); toast("Deleted"); }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}

      {showAdd && (
        <Modal title={`Add line — ${group.name}`} onClose={() => setShowAdd(false)} width={520}>
          <BankPaymentForm
            onSave={(data) => { dispatch({ type: "ADD_BANK_PAYMENT", payload: { id: newId(), groupId: group.id, ...data } }); toast("Line added", "success"); setShowAdd(false); }}
            onCancel={() => setShowAdd(false)}
          />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit line" onClose={() => setEditItem(null)} width={520}>
          <BankPaymentForm
            initial={editItem}
            onSave={(data) => { dispatch({ type: "UPDATE_BANK_PAYMENT", payload: { id: editItem.id, ...data } }); toast("Saved", "success"); setEditItem(null); }}
            onCancel={() => setEditItem(null)}
          />
        </Modal>
      )}
    </div>
  );
}

function BankPaymentsTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const groups = state.paymentGroups || [];
  const { bankPayments } = state;
  const [showNewGroup, setShowNewGroup] = useState(false);

  // Payments with no group (legacy / ungrouped)
  const ungrouped = bankPayments.filter(p => !p.groupId || !groups.find(g => g.id === p.groupId));
  const totalAll = bankPayments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{groups.length} group{groups.length !== 1 ? "s" : ""} · {bankPayments.length} total lines · {fmtCLP(totalAll)}</span>
        </div>
        <button className="btn btn--primary" onClick={() => setShowNewGroup(true)}>+ New group</button>
      </div>

      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><CreditCard size={28} color="var(--text-muted)" /></div>
          <div className="empty-state__title">No invoice groups yet</div>
          <div className="empty-state__sub">Create a group for each month to keep invoices organised.</div>
          <button className="btn btn--primary" onClick={() => setShowNewGroup(true)}>+ New group</button>
        </div>
      )}

      {groups.map(group => (
        <PaymentGroup
          key={group.id}
          group={group}
          payments={bankPayments.filter(p => p.groupId === group.id)}
          dispatch={dispatch}
          toast={toast}
        />
      ))}

      {ungrouped.length > 0 && (
        <div className="section-block" style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", fontWeight: 600, fontSize: 13, color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>Ungrouped</div>
          <table className="hr-table">
            <thead><tr><th>Beneficiary</th><th>Amount</th><th>Account #</th><th>Bank</th><th>Email</th><th>Glosa</th><th>Date</th><th></th></tr></thead>
            <tbody>
              {ungrouped.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.beneficiaryName}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCLP(p.amount)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{p.accountNumber || "—"}</td>
                  <td style={{ fontSize: 12 }}>{p.bankCode || "—"}</td>
                  <td style={{ fontSize: 12 }}>{p.email || "—"}</td>
                  <td style={{ fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.glosa || "—"}</td>
                  <td style={{ fontSize: 12 }}>{p.date || "—"}</td>
                  <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_BANK_PAYMENT", payload: p.id }); toast("Deleted"); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewGroup && <NewGroupModal onClose={() => setShowNewGroup(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — PREVIRED & F29
// ══════════════════════════════════════════════════════════════
function getDeadline(day) {
  const now = new Date();
  let target = new Date(now.getFullYear(), now.getMonth(), day);
  if (now >= target) target = new Date(now.getFullYear(), now.getMonth() + 1, day);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return { diff, target };
}

function CompactCountdown({ name, day, description }) {
  const { diff, target } = getDeadline(day);
  const dateStr = target.toLocaleDateString("en-US", { day: "numeric", month: "long" });
  const urgent = diff <= 3, warning = diff <= 7 && !urgent;
  const color  = urgent ? "#dc2626" : warning ? "#d97706" : "var(--accent)";
  const bg     = urgent ? "#fef2f2" : warning ? "#fffbeb" : "var(--accent-soft)";
  const border = urgent ? "#ef4444" : warning ? "#f59e0b" : "var(--border)";
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{description} · due {dateStr}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1, color }}>{diff}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>days</div>
      </div>
    </div>
  );
}

function ComplianceForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    type: initial?.type || "previred",
    year: initial?.year || new Date().getFullYear(),
    month: initial?.month || new Date().getMonth() + 1,
    amount: initial?.amount || "",
    paidDate: initial?.paidDate || new Date().toISOString().slice(0, 10),
    notes: initial?.notes || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, amount: parseInt(form.amount, 10), year: Number(form.year), month: Number(form.month) });
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}><option value="previred">Previred</option><option value="f29">F29</option></select></div>
        <div className="form-group"><label className="form-label">Amount (CLP) *</label><input className="form-input" type="number" min="0" value={form.amount} onChange={e => set("amount", e.target.value)} required /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Month</label><select className="form-select" value={form.month} onChange={e => set("month", e.target.value)}>{MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}</select></div>
        <div className="form-group"><label className="form-label">Year</label><input className="form-input" type="number" value={form.year} onChange={e => set("year", e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Payment date</label><input className="form-input" type="date" value={form.paidDate} onChange={e => set("paidDate", e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => set("notes", e.target.value)} /></div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{initial?.id ? "Save changes" : "Record"}</button>
      </div>
    </form>
  );
}

function ComplianceTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const payments2026 = state.compliancePayments
    .filter(p => p.year === 2026 && (filter === "all" || p.type === filter))
    .sort((a, b) => a.month - b.month || a.type.localeCompare(b.type));

  const totalPrevired = state.compliancePayments.filter(p => p.year === 2026 && p.type === "previred").reduce((s, p) => s + p.amount, 0);
  const totalF29      = state.compliancePayments.filter(p => p.year === 2026 && p.type === "f29").reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <CompactCountdown name="Previred" day={13} description="Social security contributions" />
        <CompactCountdown name="F29" day={20} description="VAT declaration & payment" />
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 560, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Previred 2026</div><div className="summary-card__value" style={{ fontSize: 18 }}>{fmtCLP(totalPrevired)}</div></div>
        <div className="summary-card"><div className="summary-card__label">F29 2026</div><div className="summary-card__value" style={{ fontSize: 18 }}>{fmtCLP(totalF29)}</div></div>
        <div className="summary-card"><div className="summary-card__label">Total 2026</div><div className="summary-card__value" style={{ fontSize: 18 }}>{fmtCLP(totalPrevired + totalF29)}</div></div>
      </div>
      <div className="section-block">
        <div className="table-toolbar">
          <div className="filter-tabs">
            {[["all", "All"], ["previred", "Previred"], ["f29", "F29"]].map(([v, l]) => (
              <button key={v} className={`filter-tab${filter === v ? " filter-tab--active" : ""}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Record</button>
        </div>
        {payments2026.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><AlertCircle size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No records</div><button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Record Payment</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr><th>Month</th><th>Type</th><th>Amount</th><th>Payment Date</th><th>Notes</th><th></th></tr></thead>
            <tbody>
              {payments2026.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{MONTHS[p.month - 1]} {p.year}</td>
                  <td><span className={`badge ${p.type === "previred" ? "badge--blue" : "badge--green"}`}>{p.type === "previred" ? "Previred" : "F29"}</span></td>
                  <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtCLP(p.amount)}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{p.paidDate || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.notes || "—"}</td>
                  <td style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <button className="btn-delete" title="Edit" onClick={() => setEditItem(p)}><Pencil size={13} /></button>
                    <DeleteButton onDelete={() => { dispatch({ type: "DELETE_COMPLIANCE_PAYMENT", payload: p.id }); toast("Deleted"); }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showAdd && (
        <Modal title="Record Payment" onClose={() => setShowAdd(false)}>
          <ComplianceForm onSave={(data) => { dispatch({ type: "ADD_COMPLIANCE_PAYMENT", payload: { id: newId(), ...data } }); toast("Payment recorded", "success"); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}
      {editItem && (
        <Modal title="Edit Payment" onClose={() => setEditItem(null)}>
          <ComplianceForm initial={editItem} onSave={(data) => { dispatch({ type: "UPDATE_COMPLIANCE_PAYMENT", payload: { id: editItem.id, ...data } }); toast("Payment updated", "success"); setEditItem(null); }} onCancel={() => setEditItem(null)} />
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — REIMBURSEMENTS
// ══════════════════════════════════════════════════════════════
const REIMB_STATUS = [
  { value: "pending",  label: "Pending",  badgeClass: "badge--yellow" },
  { value: "approved", label: "Approved", badgeClass: "badge--blue" },
  { value: "paid",     label: "Paid",     badgeClass: "badge--green" },
];
const CATEGORIES = ["Software","Travel","Equipment","Meals","Training","Office","Other"];

async function exportReimbursements(rows) {
  await toExcel(
    rows.map(p => ({
      "Name":           p.personName,
      "Amount":         p.amount,
      "Account #":      p.accountNumber || "",
      "RUT":            p.rut || "",
      "Bank Code":      p.bankCode || "",
      "Email":          p.email || "",
      "Detail / Glosa": p.detail || p.description || "",
      "Date":           p.dateSubmitted,
    })),
    "Reimbursements",
    `reimbursements_niuro_${new Date().toISOString().slice(0,10)}.xlsx`,
    [{ wch:22 },{ wch:12 },{ wch:16 },{ wch:14 },{ wch:14 },{ wch:26 },{ wch:30 },{ wch:14 }]
  );
}

function AttachmentCell({ r, dispatch }) {
  const fileRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => dispatch({ type: "UPDATE_REIMBURSEMENT_ATTACHMENT", payload: { id: r.id, attachment: { name: file.name, dataUrl: ev.target.result } } });
    reader.readAsDataURL(file);
  };
  if (r.attachment) return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
      <a href={r.attachment.dataUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: 3 }}>
        <Paperclip size={12} /> {r.attachment.name.length > 16 ? r.attachment.name.slice(0, 14) + "…" : r.attachment.name}
      </a>
      <button onClick={(e) => { e.stopPropagation(); dispatch({ type: "UPDATE_REIMBURSEMENT_ATTACHMENT", payload: { id: r.id, attachment: null } }); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}><X size={11} /></button>
    </div>
  );
  return (
    <>
      <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />
      <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} className="btn-delete" title="Attach file"><Paperclip size={13} /></button>
    </>
  );
}

function AddReimbursementModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", detail: "", amount: "", category: "Software", dateSubmitted: new Date().toISOString().slice(0,10), accountNumber: "", bankCode: "", rut: "", email: "", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName || !form.amount) return;
    dispatch({ type: "ADD_REIMBURSEMENT", payload: { id: newId(), ...form, amount: parseFloat(form.amount), status: "pending", attachment: null } });
    toast("Reimbursement added", "success");
    onClose();
  };
  return (
    <Modal title="Add Reimbursement" onClose={onClose} width={540}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Person *</label><input className="form-input" value={form.personName} onChange={e => set("personName", e.target.value)} required /></div>
          <div className="form-group"><label className="form-label">Amount *</label><input className="form-input" type="number" min="0" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} required /></div>
        </div>
        <div className="form-group"><label className="form-label">Detail / Glosa</label><input className="form-input" value={form.detail} onChange={e => set("detail", e.target.value)} placeholder='e.g. Birthday cake, GitHub subscription…' /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.dateSubmitted} onChange={e => set("dateSubmitted", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Account #</label><input className="form-input" value={form.accountNumber} onChange={e => set("accountNumber", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">RUT</label><input className="form-input" value={form.rut} onChange={e => set("rut", e.target.value)} placeholder="12.345.678-9" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Bank Code</label><input className="form-input" value={form.bankCode} onChange={e => set("bankCode", e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set("email", e.target.value)} /></div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add</button>
        </div>
      </form>
    </Modal>
  );
}

function ReimbursementsTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { reimbursements } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);

  const filtered = reimbursements.filter(r => {
    const ms = (r.personName || "").toLowerCase().includes(search.toLowerCase()) || (r.detail || r.description || "").toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus === "all" || r.status === filterStatus;
    return ms && mf;
  });

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map(r => r.id)));
  const total = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  const handleExport = async () => {
    const rows = selected.size > 0 ? reimbursements.filter(r => selected.has(r.id)) : filtered;
    if (!rows.length) { toast("No reimbursements to export", "error"); return; }
    await exportReimbursements(rows);
    toast(`${rows.length} reimbursement(s) exported`, "success");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="filter-tabs">
            {[["all", "All"], ...REIMB_STATUS.map(s => [s.value, s.label])].map(([v, l]) => (
              <button key={v} className={`filter-tab${filterStatus === v ? " filter-tab--active" : ""}`} onClick={() => setFilterStatus(v)}>{l}</button>
            ))}
          </div>
          <SearchBar value={search} onChange={setSearch} placeholder="Search…" />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn--ghost" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6 }}><Download size={14} />{selected.size > 0 ? `Export (${selected.size})` : "Export Excel"}</button>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button>
        </div>
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", maxWidth: 520, marginBottom: 20 }}>
        <div className="summary-card"><div className="summary-card__label">Total</div><div className="summary-card__value">{reimbursements.length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Pending</div><div className="summary-card__value">{reimbursements.filter(r => r.status === "pending").length}</div></div>
        <div className="summary-card"><div className="summary-card__label">Filtered amount</div><div className="summary-card__value" style={{ fontSize: 18 }}>${fmt(total)}</div></div>
      </div>
      <div className="section-block">
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state__icon"><Receipt size={28} color="var(--text-muted)" /></div><div className="empty-state__title">No reimbursements</div><button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add</button></div>
        ) : (
          <table className="hr-table">
            <thead><tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: "pointer", accentColor: "var(--accent)" }} /></th>
              <th>Person</th><th>Detail</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th>File</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ background: selected.has(r.id) ? "var(--accent-soft)" : undefined }}>
                  <td onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} style={{ cursor: "pointer", accentColor: "var(--accent)" }} /></td>
                  <td style={{ fontWeight: 500 }}>{r.personName}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.detail || r.description || "—"}</td>
                  <td><span className="badge badge--gray">{r.category}</span></td>
                  <td>${r.amount?.toFixed(2)}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.dateSubmitted}</td>
                  <td>
                    <StatusSelect value={r.status} options={REIMB_STATUS} onChange={status => { dispatch({ type: "UPDATE_REIMBURSEMENT_STATUS", payload: { id: r.id, status } }); toast("Status updated", "success"); }} />
                  </td>
                  <td><AttachmentCell r={r} dispatch={dispatch} /></td>
                  <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_REIMBURSEMENT", payload: r.id }); toast("Deleted"); }} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={4} style={{ padding: "12px 20px", fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>Total</td><td style={{ padding: "12px 20px", fontWeight: 700 }}>${fmt(total)}</td><td colSpan={4} /></tr></tfoot>
          </table>
        )}
      </div>
      {showAdd && <AddReimbursementModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════
export default function Payments() {
  const [tab, setTab] = useState("bank");
  return (
    <>
      <Head><title>Payments — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Payments</h1>
            <p className="page-subtitle">Local invoices · Previred &amp; F29 · Reimbursements</p>
          </div>
        </div>
        <div className="filter-tabs" style={{ marginBottom: 24, borderBottom: "1px solid var(--border)", paddingBottom: 4 }}>
          {[["bank", "Local Invoices"], ["compliance", "Previred & F29"], ["reimbursements", "Reimbursements"]].map(([v, l]) => (
            <button key={v} className={`filter-tab${tab === v ? " filter-tab--active" : ""}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>
        {tab === "bank"           && <BankPaymentsTab />}
        {tab === "compliance"     && <ComplianceTab />}
        {tab === "reimbursements" && <ReimbursementsTab />}
      </div>
    </>
  );
}
