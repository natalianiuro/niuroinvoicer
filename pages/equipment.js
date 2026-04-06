import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import StatusSelect from "@/components/ui/StatusSelect";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { Monitor } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "available", label: "Available", badgeClass: "badge--green" },
  { value: "assigned", label: "Assigned", badgeClass: "badge--blue" },
  { value: "in_repair", label: "In Repair", badgeClass: "badge--yellow" },
  { value: "retired", label: "Retired", badgeClass: "badge--gray" },
];

const TYPES = ["laptop", "monitor", "phone", "other"];
const TYPE_LABELS = { laptop: "Laptop", monitor: "Monitor", phone: "Phone", other: "Other" };

function AddEquipmentModal({ onClose }) {
  const { dispatch, state } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "", type: "laptop", serialNumber: "", assignedTo: "", status: "available",
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = {
      id: newId(),
      ...form,
      assignedTo: form.assignedTo.trim() || null,
      status: form.assignedTo.trim() ? "assigned" : form.status,
    };
    dispatch({ type: "ADD_EQUIPMENT", payload });
    toast(`${form.name} added to inventory`, "success");
    onClose();
  };

  const teamNames = state.team.map((m) => m.name);

  return (
    <Modal title="Add Equipment" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input className="form-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder='e.g. MacBook Pro 14"' required />
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Serial #</label>
            <input className="form-input" value={form.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Assigned To</label>
            <input
              className="form-input"
              value={form.assignedTo}
              onChange={(e) => set("assignedTo", e.target.value)}
              list="team-list"
              placeholder="Leave blank if available"
            />
            <datalist id="team-list">
              {teamNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
        </div>
        {!form.assignedTo && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add Equipment</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Equipment() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { equipment } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = equipment.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.assignedTo || "").toLowerCase().includes(search.toLowerCase()) ||
      (e.serialNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const available = equipment.filter((e) => e.status === "available").length;
  const assigned = equipment.filter((e) => e.status === "assigned").length;
  const inRepair = equipment.filter((e) => e.status === "in_repair").length;
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
          <div className="summary-card">
            <div className="summary-card__label">Total</div>
            <div className="summary-card__value">{equipment.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Available</div>
            <div className="summary-card__value">{available}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Assigned</div>
            <div className="summary-card__value">{assigned}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">In Repair</div>
            <div className="summary-card__value">{inRepair}</div>
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
            <SearchBar value={search} onChange={setSearch} placeholder="Search equipment…" />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Monitor size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No equipment found</div>
              <div className="empty-state__sub">
                {search || filterStatus !== "all" ? "Try adjusting your filters." : "Add your first equipment item."}
              </div>
              {!search && filterStatus === "all" && (
                <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Item</button>
              )}
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Serial #</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 500 }}>{item.name}</td>
                    <td><span className="badge badge--gray">{TYPE_LABELS[item.type] || item.type}</span></td>
                    <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                      {item.serialNumber || "—"}
                    </td>
                    <td style={{ color: item.assignedTo ? "var(--text-primary)" : "var(--text-muted)" }}>
                      {item.assignedTo || "—"}
                    </td>
                    <td>
                      <StatusSelect
                        value={item.status}
                        options={STATUS_OPTIONS}
                        onChange={(status) => {
                          dispatch({ type: "UPDATE_EQUIPMENT_STATUS", payload: { id: item.id, status } });
                          toast(`Status updated to ${status.replace("_", " ")}`, "success");
                        }}
                      />
                    </td>
                    <td>
                      <DeleteButton onDelete={() => {
                        dispatch({ type: "DELETE_EQUIPMENT", payload: item.id });
                        toast(`${item.name} removed from inventory`);
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && <AddEquipmentModal onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
