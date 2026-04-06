import { useState } from "react";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import { useStore, newId } from "@/lib/store";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDaysUntil(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  date.setFullYear(today.getFullYear());
  if (date < today) date.setFullYear(today.getFullYear() + 1);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function DaysChip({ days }) {
  if (days === 0) return <span className="badge badge--green">Today!</span>;
  if (days <= 7) return <span className="badge badge--yellow">in {days}d</span>;
  if (days <= 30) return <span className="badge badge--blue">in {days}d</span>;
  return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>in {days}d</span>;
}

function AddMemberModal({ onClose }) {
  const { dispatch } = useStore();
  const [form, setForm] = useState({
    name: "", role: "", email: "", birthday: "", workAnniversary: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_TEAM_MEMBER", payload: { id: newId(), ...form } });
    onClose();
  };

  return (
    <Modal title="Add Team Member" onClose={onClose}>
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
            <label className="form-label">Birthday</label>
            <input className="form-input" type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Work Anniversary</label>
            <input className="form-input" type="date" value={form.workAnniversary} onChange={(e) => set("workAnniversary", e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary">Add Member</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Team() {
  const { state } = useStore();
  const { team } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const members = team
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase())
    )
    .map((m) => ({
      ...m,
      birthdayDays: m.birthday ? getDaysUntil(m.birthday) : null,
      anniversaryDays: m.workAnniversary ? getDaysUntil(m.workAnniversary) : null,
    }));

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{team.length} members · birthdays & anniversaries</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Member</button>
      </div>

      <div className="section-block">
        <div className="table-toolbar">
          <div />
          <SearchBar value={search} onChange={setSearch} placeholder="Search team…" />
        </div>

        <table className="hr-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Birthday</th>
              <th></th>
              <th>Work Anniversary</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state">No members found.</div></td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="reminder-avatar">{getInitials(m.name)}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{m.role}</td>
                <td>{m.birthday ? formatDate(m.birthday) : "—"}</td>
                <td>{m.birthdayDays !== null ? <DaysChip days={m.birthdayDays} /> : "—"}</td>
                <td>{m.workAnniversary ? formatDate(m.workAnniversary) : "—"}</td>
                <td>{m.anniversaryDays !== null ? <DaysChip days={m.anniversaryDays} /> : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
