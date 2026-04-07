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

// Exact Santander column headers
const COL = {
  cuentaOrigen:  "Cuenta origen(obligatorio)",
  monedaOrigen:  "Moneda origen(obligatorio)",
  cuentaDestino: "Cuenta destino(obligatorio)",
  monedaDestino: "Moneda destino(obligatorio)",
  codigoBanco:   "Código banco destino(obligatorio solo si banco destino no es Santander)",
  rut:           "RUT beneficiario(obligatorio solo si banco destino no es Santander)",
  nombre:        "Nombre beneficiario(obligatorio solo si banco destino no es Santander)",
  monto:         "Monto transferencia(obligatorio)",
  glosa:         "Glosa personalizada transferencia(opcional)",
  correo:        "Correo beneficiario(opcional)",
  mensaje:       "Mensaje correo beneficiario(opcional)",
  glosaOrigen:   "Glosa cartola origen(opcional)",
  glosaDestino:  "Glosa cartola destino(opcional, solo aplica si la cuenta destino es Santander)",
};
const SANTANDER_WIDTHS = [{ wch:22 },{ wch:16 },{ wch:22 },{ wch:16 },{ wch:16 },{ wch:20 },{ wch:30 },{ wch:18 },{ wch:36 },{ wch:28 },{ wch:28 },{ wch:36 },{ wch:36 }];
const padAccount = (n) => String(n || "").replace(/\D/g, "").padStart(22, "0");

async function exportBankPayments(payments, groupLabel, cuentaOrigen) {
  const suffix = groupLabel || new Date().toISOString().slice(0,10);
  await toExcel(
    payments.map((p) => ({
      [COL.cuentaOrigen]:  cuentaOrigen || "",
      [COL.monedaOrigen]:  "CLP",
      [COL.cuentaDestino]: padAccount(p.accountNumber),
      [COL.monedaDestino]: "CLP",
      [COL.codigoBanco]:   p.bankCode || "",
      [COL.rut]:           p.rut || "",
      [COL.nombre]:        p.beneficiaryName || "",
      [COL.monto]:         p.amount,
      [COL.glosa]:         p.glosa || "",
      [COL.correo]:        p.email || "",
      [COL.mensaje]:       "",
      [COL.glosaOrigen]:   p.glosa || "",
      [COL.glosaDestino]:  "",
    })),
    "Facturas",
    `facturas_niuro_${suffix}.xlsx`,
    SANTANDER_WIDTHS
  );
}

async function exportReimbursements(rows, groupLabel, cuentaOrigen) {
  const suffix = groupLabel || new Date().toISOString().slice(0,10);
  await toExcel(
    rows.map((r) => ({
      [COL.cuentaOrigen]:  cuentaOrigen || "",
      [COL.monedaOrigen]:  "CLP",
      [COL.cuentaDestino]: padAccount(r.accountNumber),
      [COL.monedaDestino]: "CLP",
      [COL.codigoBanco]:   r.bankCode || "",
      [COL.rut]:           r.rut || "",
      [COL.nombre]:        r.personName || "",
      [COL.monto]:         r.amount,
      [COL.glosa]:         r.detail || r.description || "",
      [COL.correo]:        r.email || "",
      [COL.mensaje]:       "",
      [COL.glosaOrigen]:   r.detail || r.description || "",
      [COL.glosaDestino]:  "",
    })),
    "Reimbursements",
    `reimbursements_niuro_${suffix}.xlsx`,
    SANTANDER_WIDTHS
  );
}

function BankPaymentForm({ initial, onSave, onCancel }) {
  const [usePreset, setUsePreset] = useState(!initial?.id);
  const [preset, setPreset] = useState(COMMON_BENEFICIARIES[0].name);
  const [form, setForm] = useState({
    beneficiaryName: initial?.beneficiaryName || "",
    rut:             initial?.rut             || "",
    amount:          initial?.amount          || "",
    accountNumber:   initial?.accountNumber   || "",
    bankCode:        initial?.bankCode        || "",
    email:           initial?.email           || "",
    glosa:           initial?.glosa           || "",
    date:            initial?.date            || new Date().toISOString().slice(0,10),
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
      <div className="form-group"><label className="form-label">RUT beneficiary</label><input className="form-input" value={form.rut} onChange={e => set("rut", e.target.value)} placeholder="12.345.678-9" /></div>
      <div className="form-group"><label className="form-label">Glosa</label><input className="form-input" value={form.glosa} onChange={e => set("glosa", e.target.value)} /></div>
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{isEdit ? "Save changes" : "Add"}</button>
      </div>
    </form>
  );
}

// ─── Export modal — asks for Cuenta Origen (Santander) ────────
function ExportGroupModal({ group, rows, groupType, onClose, dispatch, toast }) {
  const [cuentaOrigen, setCuentaOrigen] = useState(group.cuentaOrigen || "");
  const safeName = group.name.replace(/\s+/g, "_");

  const handleExport = async (e) => {
    e.preventDefault();
    if (!rows.length) { toast("No lines in this group", "error"); onClose(); return; }
    // Save cuenta origen back to group for next time
    const updateAction = groupType === "payment" ? "UPDATE_PAYMENT_GROUP" : "UPDATE_REIMBURSEMENT_GROUP";
    dispatch({ type: updateAction, payload: { id: group.id, cuentaOrigen } });
    if (groupType === "payment") {
      await exportBankPayments(rows, safeName, cuentaOrigen);
    } else {
      await exportReimbursements(rows, safeName, cuentaOrigen);
    }
    toast(`${rows.length} line(s) exported`, "success");
    onClose();
  };

  return (
    <Modal title={`Export — ${group.name}`} onClose={onClose}>
      <form onSubmit={handleExport}>
        <div className="form-group">
          <label className="form-label">Cuenta origen (Santander)</label>
          <input
            className="form-input"
            value={cuentaOrigen}
            onChange={e => setCuentaOrigen(e.target.value)}
            placeholder="Your Santander account number"
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            This is Niuro&apos;s source account. It will be saved for next time.
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          {rows.length} line{rows.length !== 1 ? "s" : ""} will be exported in Santander format.
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Download size={14} /> Download Excel
          </button>
        </div>
      </form>
    </Modal>
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
  const [showExport, setShowExport] = useState(false);

  const total = payments.reduce((s, p) => s + (p.amount || 0), 0);

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
          <button className="btn btn--ghost" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }} onClick={() => setShowExport(true)}>
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
      {showExport && (
        <ExportGroupModal group={group} rows={payments} groupType="payment" dispatch={dispatch} toast={toast} onClose={() => setShowExport(false)} />
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

function AddReimbursementModal({ onClose, groupId, groupName }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ personName: "", detail: "", amount: "", category: "Software", dateSubmitted: new Date().toISOString().slice(0,10), accountNumber: "", bankCode: "", rut: "", email: "", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.personName || !form.amount) return;
    dispatch({ type: "ADD_REIMBURSEMENT", payload: { id: newId(), ...form, amount: parseFloat(form.amount), status: "pending", attachment: null, groupId: groupId || null } });
    toast("Reimbursement added", "success");
    onClose();
  };
  const title = groupName ? `Add Reimbursement — ${groupName}` : "Add Reimbursement";
  return (
    <Modal title={title} onClose={onClose} width={540}>
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

// ─── New Reimbursement Group Modal ───────────────────────────
function NewReimbursementGroupModal({ onClose }) {
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
    dispatch({ type: "ADD_REIMBURSEMENT_GROUP", payload: { id: newId(), ...form, month: Number(form.month), year: Number(form.year) } });
    toast("Group created", "success");
    onClose();
  };
  return (
    <Modal title="New Reimbursement Group" onClose={onClose}>
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

// ─── Single reimbursement group ───────────────────────────────
function ReimbursementGroup({ group, reimbursements, dispatch, toast }) {
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const total = reimbursements.reduce((s, r) => s + (r.amount || 0), 0);
  const pending = reimbursements.filter(r => r.status === "pending").length;

  return (
    <div className="section-block" style={{ marginBottom: 16 }}>
      {/* Group header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: open ? "1px solid var(--border-light)" : "none", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{group.name}</span>
          <span className="badge badge--gray">{reimbursements.length} {reimbursements.length === 1 ? "line" : "lines"}</span>
          {pending > 0 && <span className="badge badge--yellow">{pending} pending</span>}
          <span style={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "var(--text-secondary)" }}>${fmt(total)}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
          <button className="btn btn--ghost" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 13 }} onClick={() => setShowExport(true)}>
            <Download size={13} /> Export
          </button>
          <button className="btn btn--primary" style={{ fontSize: 13, padding: "5px 12px" }} onClick={() => setShowAdd(true)}>+ Add line</button>
          <DeleteButton onDelete={() => dispatch({ type: "DELETE_REIMBURSEMENT_GROUP", payload: group.id })} />
          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 4 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Lines table */}
      {open && (
        reimbursements.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No lines yet. <button className="btn btn--ghost" style={{ fontSize: 13 }} onClick={() => setShowAdd(true)}>+ Add line</button>
          </div>
        ) : (
          <table className="hr-table">
            <thead><tr>
              <th>Beneficiary</th><th>Amount</th><th>Account #</th><th>Bank</th><th>Email</th><th>Glosa</th><th>Date</th><th></th>
            </tr></thead>
            <tbody>
              {reimbursements.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.personName}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>${r.amount?.toFixed(2)}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-secondary)" }}>{r.accountNumber || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.bankCode || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.email || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{r.detail || r.description || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.dateSubmitted}</td>
                  <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_REIMBURSEMENT", payload: r.id }); toast("Deleted"); }} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={1} style={{ padding: "10px 20px", fontWeight: 600, fontSize: 13, color: "var(--text-secondary)" }}>Total</td>
                <td style={{ padding: "10px 20px", fontWeight: 700 }}>${fmt(total)}</td>
                <td colSpan={6} />
              </tr>
            </tfoot>
          </table>
        )
      )}

      {showAdd && (
        <AddReimbursementModal
          groupId={group.id}
          groupName={group.name}
          onClose={() => setShowAdd(false)}
        />
      )}
      {showExport && (
        <ExportGroupModal group={group} rows={reimbursements} groupType="reimbursement" dispatch={dispatch} toast={toast} onClose={() => setShowExport(false)} />
      )}
    </div>
  );
}

function ReimbursementsTab() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const groups = state.reimbursementGroups || [];
  const { reimbursements } = state;
  const [showNewGroup, setShowNewGroup] = useState(false);

  const ungrouped = reimbursements.filter(r => !r.groupId || !groups.find(g => g.id === r.groupId));
  const totalAll = reimbursements.reduce((s, r) => s + (r.amount || 0), 0);
  const pendingAll = reimbursements.filter(r => r.status === "pending").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {groups.length} group{groups.length !== 1 ? "s" : ""} · {reimbursements.length} total lines · {pendingAll} pending · ${fmt(totalAll)}
        </span>
        <button className="btn btn--primary" onClick={() => setShowNewGroup(true)}>+ New group</button>
      </div>

      {groups.length === 0 && (
        <div className="empty-state">
          <div className="empty-state__icon"><Receipt size={28} color="var(--text-muted)" /></div>
          <div className="empty-state__title">No reimbursement groups yet</div>
          <div className="empty-state__sub">Create a group for each month to keep reimbursements organised.</div>
          <button className="btn btn--primary" onClick={() => setShowNewGroup(true)}>+ New group</button>
        </div>
      )}

      {groups.map(group => (
        <ReimbursementGroup
          key={group.id}
          group={group}
          reimbursements={reimbursements.filter(r => r.groupId === group.id)}
          dispatch={dispatch}
          toast={toast}
        />
      ))}

      {ungrouped.length > 0 && (
        <div className="section-block" style={{ marginBottom: 16 }}>
          <div style={{ padding: "12px 20px", fontWeight: 600, fontSize: 13, color: "var(--text-muted)", borderBottom: "1px solid var(--border-light)" }}>Ungrouped</div>
          <table className="hr-table">
            <thead><tr><th>Person</th><th>Detail</th><th>Category</th><th>Amount</th><th>Date</th><th>Status</th><th>File</th><th></th></tr></thead>
            <tbody>
              {ungrouped.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.personName}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.detail || r.description || "—"}</td>
                  <td><span className="badge badge--gray">{r.category}</span></td>
                  <td>${r.amount?.toFixed(2)}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.dateSubmitted}</td>
                  <td><StatusSelect value={r.status} options={REIMB_STATUS} onChange={status => { dispatch({ type: "UPDATE_REIMBURSEMENT_STATUS", payload: { id: r.id, status } }); toast("Status updated", "success"); }} /></td>
                  <td><AttachmentCell r={r} dispatch={dispatch} /></td>
                  <td><DeleteButton onDelete={() => { dispatch({ type: "DELETE_REIMBURSEMENT", payload: r.id }); toast("Deleted"); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewGroup && <NewReimbursementGroupModal onClose={() => setShowNewGroup(false)} />}
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
