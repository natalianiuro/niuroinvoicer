import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Landmark, Download } from "lucide-react";

const COMMON_BENEFICIARIES = [
  { name: "Buk",         email: "pagos@buk.cl",          accountNumber: "12345678", bankCode: "001" },
  { name: "WeWork",      email: "billing@wework.com",     accountNumber: "87654321", bankCode: "012" },
  { name: "TGP",         email: "administracion@tgp.cl",  accountNumber: "11223344", bankCode: "009" },
  { name: "Contabilidad",email: "contador@estudio.cl",    accountNumber: "55667788", bankCode: "001" },
];

// ─── Excel export ─────────────────────────────────────────────
async function exportToExcel(payments) {
  const XLSX = await import("xlsx");
  const rows = payments.map((p) => ({
    "Nombre Beneficiario": p.beneficiaryName,
    "Monto":               p.amount,
    "Número de Cuenta":    p.accountNumber,
    "Código Banco":        p.bankCode,
    "Correo Beneficiario": p.email,
    "Glosa Cartola":       p.glosa,
    "Fecha":               p.date,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pagos");

  // Column widths
  ws["!cols"] = [
    { wch: 22 }, { wch: 14 }, { wch: 20 },
    { wch: 14 }, { wch: 28 }, { wch: 36 }, { wch: 14 },
  ];

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `pagos_niuro_${today}.xlsx`);
}

// ─── Add Payment Modal ────────────────────────────────────────
function AddPaymentModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [usePreset, setUsePreset] = useState(true);
  const [preset, setPreset] = useState(COMMON_BENEFICIARIES[0].name);
  const [form, setForm] = useState({
    beneficiaryName: "",
    amount: "",
    accountNumber: "",
    bankCode: "",
    email: "",
    glosa: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePreset = (name) => {
    setPreset(name);
    const p = COMMON_BENEFICIARIES.find((b) => b.name === name);
    if (p) setForm((f) => ({ ...f, beneficiaryName: p.name, accountNumber: p.accountNumber, bankCode: p.bankCode, email: p.email }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = usePreset
      ? { ...COMMON_BENEFICIARIES.find((b) => b.name === preset), ...form, beneficiaryName: preset }
      : form;
    if (!data.beneficiaryName || !form.amount) return;
    dispatch({
      type: "ADD_BANK_PAYMENT",
      payload: { id: newId(), ...data, amount: parseFloat(form.amount) },
    });
    toast(`Pago a ${data.beneficiaryName} guardado`, "success");
    onClose();
  };

  return (
    <Modal title="Agregar Pago" onClose={onClose} width={520}>
      <form onSubmit={handleSubmit}>
        {/* Toggle preset vs custom */}
        <div className="form-group">
          <div className="filter-tabs" style={{ marginBottom: 12 }}>
            <button type="button" className={`filter-tab${usePreset ? " filter-tab--active" : ""}`} onClick={() => setUsePreset(true)}>Proveedor frecuente</button>
            <button type="button" className={`filter-tab${!usePreset ? " filter-tab--active" : ""}`} onClick={() => setUsePreset(false)}>Nuevo beneficiario</button>
          </div>
        </div>

        {usePreset ? (
          <div className="form-group">
            <label className="form-label">Beneficiario</label>
            <select className="form-select" value={preset} onChange={(e) => handlePreset(e.target.value)}>
              {COMMON_BENEFICIARIES.map((b) => <option key={b.name}>{b.name}</option>)}
            </select>
          </div>
        ) : (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre Beneficiario *</label>
              <input className="form-input" value={form.beneficiaryName} onChange={(e) => set("beneficiaryName", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Monto *</label>
            <input className="form-input" type="number" min="0" step="1" value={form.amount} onChange={(e) => set("amount", e.target.value)} required placeholder="Ej: 290000" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha</label>
            <input className="form-input" type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
        </div>

        {!usePreset && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">N° de Cuenta</label>
              <input className="form-input" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Código Banco</label>
              <input className="form-input" value={form.bankCode} onChange={(e) => set("bankCode", e.target.value)} placeholder="Ej: 001" />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Glosa Cartola</label>
          <input className="form-input" value={form.glosa} onChange={(e) => set("glosa", e.target.value)} placeholder={`Ej: Suscripción ${usePreset ? preset : ""} ${new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}`} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar Pago</button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function Pagos() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { bankPayments } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const filtered = bankPayments.filter((p) =>
    p.beneficiaryName.toLowerCase().includes(search.toLowerCase()) ||
    (p.glosa || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, p) => s + (p.amount || 0), 0);
  const fmt = (n) => Number(n).toLocaleString("es-CL", { minimumFractionDigits: 0 });

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === filtered.length ? new Set() : new Set(filtered.map((p) => p.id)));
  };

  const handleExport = () => {
    const toExport = selected.size > 0
      ? bankPayments.filter((p) => selected.has(p.id))
      : filtered;
    if (toExport.length === 0) { toast("No hay pagos para exportar", "error"); return; }
    exportToExcel(toExport);
    toast(`Exportando ${toExport.length} pago${toExport.length > 1 ? "s" : ""} a Excel`, "success");
  };

  return (
    <>
      <Head><title>Pagos — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Pagos</h1>
            <p className="page-subtitle">Pagos a proveedores · exportar a Excel para el banco</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--ghost" onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Download size={14} />
              {selected.size > 0 ? `Exportar (${selected.size})` : "Exportar Excel"}
            </button>
            <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Agregar Pago</button>
          </div>
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 560 }}>
          <div className="summary-card">
            <div className="summary-card__label">Total pagos</div>
            <div className="summary-card__value">{bankPayments.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Monto total</div>
            <div className="summary-card__value" style={{ fontSize: 18 }}>${fmt(bankPayments.reduce((s, p) => s + p.amount, 0))}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Seleccionados</div>
            <div className="summary-card__value">{selected.size > 0 ? selected.size : "—"}</div>
          </div>
        </div>

        <div className="section-block">
          <div className="table-toolbar">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar por beneficiario o glosa…" />
            {selected.size > 0 && (
              <button className="btn btn--ghost" style={{ fontSize: 12 }} onClick={() => setSelected(new Set())}>
                Limpiar selección
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Landmark size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No hay pagos</div>
              <div className="empty-state__sub">{search ? "Intenta otra búsqueda." : "Agrega el primer pago."}</div>
              {!search && <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Agregar Pago</button>}
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
                  </th>
                  <th>Beneficiario</th>
                  <th>Monto</th>
                  <th>N° Cuenta</th>
                  <th>Banco</th>
                  <th>Correo</th>
                  <th>Glosa</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} onClick={() => toggleSelect(p.id)} style={{ cursor: "pointer", background: selected.has(p.id) ? "var(--accent-soft)" : undefined }}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} style={{ cursor: "pointer", accentColor: "var(--accent)" }} />
                    </td>
                    <td style={{ fontWeight: 500 }}>{p.beneficiaryName}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>${fmt(p.amount)}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{p.accountNumber || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.bankCode || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.email || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.glosa || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.date || "—"}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DeleteButton onDelete={() => {
                        dispatch({ type: "DELETE_BANK_PAYMENT", payload: p.id });
                        setSelected((prev) => { const n = new Set(prev); n.delete(p.id); return n; });
                        toast("Pago eliminado");
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Total</td>
                  <td style={{ padding: "12px 20px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>${fmt(total)}</td>
                  <td colSpan={6} />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
          Tip: selecciona las filas que quieres exportar, o exporta todo con el botón. Cuando subas el formato exacto del banco, ajustamos las columnas.
        </p>
      </div>

      {showAdd && <AddPaymentModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
