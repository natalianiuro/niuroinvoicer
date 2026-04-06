import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import StatusSelect from "@/components/ui/StatusSelect";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Monitor, Pencil } from "lucide-react";
import { COUNTRIES } from "@/lib/countries";
import { clients as CLIENT_LIST } from "@/lib/data/mock";

const STATUS_OPTIONS = [
  { value: "available", label: "Available", badgeClass: "badge--green" },
  { value: "assigned",  label: "Assigned",  badgeClass: "badge--blue" },
  { value: "in_repair", label: "In Repair", badgeClass: "badge--yellow" },
  { value: "retired",   label: "Retired",   badgeClass: "badge--gray" },
];

const TYPES = ["laptop", "monitor", "phone", "other"];
const TYPE_LABELS = { laptop: "Laptop", monitor: "Monitor", phone: "Phone", other: "Other" };

// ─── Shared equipment form ────────────────────────────────────
function EquipmentForm({ initial, teamNames, onSave, onCancel }) {
  const empty = { name: "", type: "laptop", serialNumber: "", assignedTo: "", status: "available", country: "", client: "", specs: "" };
  const [form, setForm] = useState(initial ? {
    name:         initial.name || "",
    type:         initial.type || "laptop",
    serialNumber: initial.serialNumber || "",
    assignedTo:   initial.assignedTo || "",
    status:       initial.status || "available",
    country:      initial.country || "",
    client:       initial.client || "",
    specs:        initial.specs || "",
  } : empty);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      ...form,
      assignedTo: form.assignedTo.trim() || null,
      status: form.assignedTo.trim() && !initial ? "assigned" : form.status,
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Item Name *</label><input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder='e.g. MacBook Pro 14"' required /></div>
        <div className="form-group"><label className="form-label">Type</label><select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>{TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}</select></div>
      </div>
      <div className="form-row">
        <div className="form-group"><label className="form-label">Serial #</label><input className="form-input" value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Assigned To</label>
          <input className="form-input" value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} list="team-list-eq" placeholder="Leave blank if available" />
          <datalist id="team-list-eq">{teamNames.map(n => <option key={n} value={n} />)}</datalist>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Country</label>
          <select className="form-select" value={form.country} onChange={e => set("country", e.target.value)}>
            <option value="">— Select —</option>
            {Object.entries(COUNTRIES).map(([code, { flag, name }]) => <option key={code} value={code}>{flag} {name}</option>)}
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
      <div className="form-group"><label className="form-label">Specs</label><input className="form-input" value={form.specs} onChange={e => set("specs", e.target.value)} placeholder="e.g. M3 Pro, 18GB RAM, 512GB SSD" /></div>
      {(!form.assignedTo || initial) && (
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn--primary">{initial ? "Save changes" : "Add Equipment"}</button>
      </div>
    </form>
  );
}

export default function Equipment() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { equipment } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const teamNames = [...state.team.map(m => m.name), ...state.contractors.map(c => c.name)];

  const filtered = equipment.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.assignedTo || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.serialNumber || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.specs || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const available = equipment.filter(e => e.status === "available").length;
  const assigned  = equipment.filter(e => e.status === "assigned").length;
  const inRepair  = equipment.filter(e => e.status === "in_repair").length;
  const tabs = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

  return (
    <>
      <Head><title>Equipment — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Equipment</h1>
            <p className="page-subtitle">{equipment.length} items · {available} available</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Item</button>
        </div>

        <div className="card-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", maxWidth: 640 }}>
          <div className="summary-card"><div className="summary-card__label">Total</div><div className="summary-card__value">{equipment.length}</div></div>
          <div className="summary-card"><div className="summary-card__label">Available</div><div className="summary-card__value">{available}</div></div>
          <div className="summary-card"><div className="summary-card__label">Assigned</div><div className="summary-card__value">{assigned}</div></div>
          <div className="summary-card"><div className="summary-card__label">In Repair</div><div className="summary-card__value">{inRepair}</div></div>
        </div>

        <div className="section-block">
          <div className="table-toolbar">
            <div className="filter-tabs">
              {tabs.map(t => (
                <button key={t.value} className={`filter-tab${filterStatus === t.value ? " filter-tab--active" : ""}`} onClick={() => setFilterStatus(t.value)}>{t.label}</button>
              ))}
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search equipment…" />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Monitor size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No equipment found</div>
              <div className="empty-state__sub">{search || filterStatus !== "all" ? "Try adjusting your filters." : "Add your first equipment item."}</div>
              {!search && filterStatus === "all" && <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Item</button>}
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Item</th><th>Type</th><th>Serial #</th><th>Specs</th><th>Assigned To</th><th>Country</th><th>Client</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const client = item.client ? CLIENT_LIST.find(c => c.id === item.client) : null;
                  const countryFlag = item.country ? COUNTRIES[item.country]?.flag : null;
                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td><span className="badge badge--gray">{TYPE_LABELS[item.type] || item.type}</span></td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>{item.serialNumber || "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.specs || "—"}</td>
                      <td style={{ color: item.assignedTo ? "var(--text-primary)" : "var(--text-muted)" }}>{item.assignedTo || "—"}</td>
                      <td style={{ fontSize: 13 }}>{countryFlag ? `${countryFlag} ${COUNTRIES[item.country]?.name}` : "—"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{client?.name || "—"}</td>
                      <td>
                        <StatusSelect value={item.status} options={STATUS_OPTIONS} onChange={(status) => {
                          dispatch({ type: "UPDATE_EQUIPMENT", payload: { id: item.id, status } });
                          toast(`Status updated to ${status.replace("_", " ")}`, "success");
                        }} />
                      </td>
                      <td style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button className="btn-delete" title="Edit" onClick={() => setEditItem(item)}><Pencil size={13} /></button>
                        <DeleteButton onDelete={() => { dispatch({ type: "DELETE_EQUIPMENT", payload: item.id }); toast(`${item.name} removed`); }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && (
          <Modal title="Add Equipment" onClose={() => setShowAdd(false)}>
            <EquipmentForm teamNames={teamNames} onSave={(data) => { dispatch({ type: "ADD_EQUIPMENT", payload: { id: newId(), ...data } }); toast(`${data.name} added`, "success"); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
          </Modal>
        )}
        {editItem && (
          <Modal title={`Edit — ${editItem.name}`} onClose={() => setEditItem(null)}>
            <EquipmentForm initial={editItem} teamNames={teamNames} onSave={(data) => { dispatch({ type: "UPDATE_EQUIPMENT", payload: { id: editItem.id, ...data } }); toast("Saved", "success"); setEditItem(null); }} onCancel={() => setEditItem(null)} />
          </Modal>
        )}
      </div>
    </>
  );
}
