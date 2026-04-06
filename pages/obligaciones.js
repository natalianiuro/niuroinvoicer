import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { AlertCircle, Clock } from "lucide-react";

// ─── Deadline countdown ──────────────────────────────────────
function getDeadline(dayOfMonth) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  let target = new Date(year, month, dayOfMonth);
  if (now > target) target = new Date(year, month + 1, dayOfMonth);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return { diff, target };
}

function CountdownCard({ name, dayOfMonth, description, color }) {
  const { diff, target } = getDeadline(dayOfMonth);
  const dateStr = target.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
  const urgent = diff <= 3;
  const warning = diff <= 7 && diff > 3;

  return (
    <div className={`countdown-card${urgent ? " countdown-card--urgent" : warning ? " countdown-card--warning" : ""}`}>
      <div className="countdown-card__icon">
        <Clock size={20} strokeWidth={1.8} />
      </div>
      <div className="countdown-card__body">
        <div className="countdown-card__name">{name}</div>
        <div className="countdown-card__desc">{description}</div>
        <div className="countdown-card__date">Vence el {dateStr}</div>
      </div>
      <div className="countdown-card__days">
        <span className="countdown-number">{diff}</span>
        <span className="countdown-label">días</span>
      </div>
    </div>
  );
}

// ─── Month name helper ────────────────────────────────────────
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function AddPaymentModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({
    type: "previred",
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: "",
    paidDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    dispatch({
      type: "ADD_COMPLIANCE_PAYMENT",
      payload: { id: newId(), ...form, amount: parseInt(form.amount, 10), year: Number(form.year), month: Number(form.month) },
    });
    toast("Pago registrado", "success");
    onClose();
  };

  return (
    <Modal title="Registrar Pago" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option value="previred">Previred</option>
              <option value="f29">F29</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Monto (CLP)</label>
            <input className="form-input" type="number" min="0" step="1000" value={form.amount} onChange={(e) => set("amount", e.target.value)} required placeholder="Ej: 480000" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Mes</label>
            <select className="form-select" value={form.month} onChange={(e) => set("month", e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Año</label>
            <input className="form-input" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha de pago</label>
          <input className="form-input" type="date" value={form.paidDate} onChange={(e) => set("paidDate", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Notas</label>
          <textarea className="form-textarea" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary">Guardar Pago</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Obligaciones() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { compliancePayments } = state;
  const [showAdd, setShowAdd] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const payments2026 = compliancePayments
    .filter((p) => p.year === 2026)
    .filter((p) => filterType === "all" || p.type === filterType)
    .sort((a, b) => a.month - b.month || a.type.localeCompare(b.type));

  const totalPrevired = compliancePayments.filter((p) => p.year === 2026 && p.type === "previred").reduce((s, p) => s + p.amount, 0);
  const totalF29 = compliancePayments.filter((p) => p.year === 2026 && p.type === "f29").reduce((s, p) => s + p.amount, 0);

  const fmt = (n) => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

  return (
    <>
      <Head><title>Obligaciones — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Obligaciones</h1>
            <p className="page-subtitle">Previred · F29 · Historial de pagos 2026</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Registrar Pago</button>
        </div>

        {/* Countdowns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          <CountdownCard
            name="Previred"
            dayOfMonth={13}
            description="Pago de cotizaciones previsionales"
          />
          <CountdownCard
            name="F29"
            dayOfMonth={20}
            description="Declaración y pago mensual IVA"
          />
        </div>

        {/* Summary cards */}
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 600, marginBottom: 24 }}>
          <div className="summary-card">
            <div className="summary-card__label">Previred 2026</div>
            <div className="summary-card__value" style={{ fontSize: 18 }}>{fmt(totalPrevired)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">F29 2026</div>
            <div className="summary-card__value" style={{ fontSize: 18 }}>{fmt(totalF29)}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Total 2026</div>
            <div className="summary-card__value" style={{ fontSize: 18 }}>{fmt(totalPrevired + totalF29)}</div>
          </div>
        </div>

        {/* History table */}
        <div className="section-block">
          <div className="table-toolbar">
            <div className="filter-tabs">
              {[["all","Todos"],["previred","Previred"],["f29","F29"]].map(([v, l]) => (
                <button key={v} className={`filter-tab${filterType === v ? " filter-tab--active" : ""}`} onClick={() => setFilterType(v)}>{l}</button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{payments2026.length} registros en 2026</span>
          </div>

          {payments2026.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><AlertCircle size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">Sin registros</div>
              <div className="empty-state__sub">Registra el primer pago del año.</div>
              <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Registrar Pago</button>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Fecha de Pago</th>
                  <th>Notas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {payments2026.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{MONTHS[p.month - 1]} {p.year}</td>
                    <td>
                      <span className={`badge ${p.type === "previred" ? "badge--blue" : "badge--green"}`}>
                        {p.type === "previred" ? "Previred" : "F29"}
                      </span>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmt(p.amount)}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{p.paidDate || "—"}</td>
                    <td style={{ color: "var(--text-secondary)", fontSize: 12 }}>{p.notes || "—"}</td>
                    <td>
                      <DeleteButton onDelete={() => {
                        dispatch({ type: "DELETE_COMPLIANCE_PAYMENT", payload: p.id });
                        toast("Registro eliminado");
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdd && <AddPaymentModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
