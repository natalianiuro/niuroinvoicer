import { useState } from "react";
import Head from "next/head";
import Modal from "@/components/ui/Modal";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore, newId } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { CalendarHeart } from "lucide-react";
import { COUNTRIES, getCountry } from "@/lib/countries";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  const date = new Date(dateStr);
  date.setFullYear(today.getFullYear());
  if (date < today) date.setFullYear(today.getFullYear() + 1);
  return Math.ceil((date - today) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function DaysChip({ days }) {
  if (days === null) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
  if (days === 0) return <span className="badge badge--green">Today!</span>;
  if (days <= 7) return <span className="badge badge--yellow">in {days}d</span>;
  if (days <= 30) return <span className="badge badge--blue">in {days}d</span>;
  return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>in {days}d</span>;
}

function AddMemberModal({ onClose }) {
  const { dispatch } = useStore();
  const toast = useToast();
  const [form, setForm] = useState({ name: "", role: "", email: "", country: "", birthday: "", workAnniversary: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    dispatch({ type: "ADD_TEAM_MEMBER", payload: { id: newId(), ...form } });
    toast(`${form.name} added to team`, "success");
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
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="form-select" value={form.country} onChange={(e) => set("country", e.target.value)}>
              <option value="">— Select —</option>
              {Object.entries(COUNTRIES).map(([code, { flag, name }]) => (
                <option key={code} value={code}>{flag} {name}</option>
              ))}
            </select>
          </div>
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
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { team } = state;
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const members = team
    .filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role || "").toLowerCase().includes(search.toLowerCase())
    )
    .map((m) => ({
      ...m,
      birthdayDays: getDaysUntil(m.birthday),
      anniversaryDays: getDaysUntil(m.workAnniversary),
    }));

  return (
    <>
      <Head><title>Team — Niuro HR</title></Head>
      <div>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Team</h1>
            <p className="page-subtitle">{team.length} members · birthdays &amp; anniversaries</p>
          </div>
          <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Member</button>
        </div>

        <div className="section-block">
          <div className="table-toolbar">
            <div />
            <SearchBar value={search} onChange={setSearch} placeholder="Search team…" />
          </div>

          {members.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><CalendarHeart size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No team members found</div>
              <div className="empty-state__sub">
                {search ? "Try a different search." : "Add team members to track birthdays and anniversaries."}
              </div>
              {!search && (
                <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Add Member</button>
              )}
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Birthday</th>
                  <th></th>
                  <th>Work Anniversary</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
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
                    <td style={{ color: "var(--text-secondary)" }}>
                      {m.country ? (
                        <span title={getCountry(m.country).name}>{getCountry(m.country).flag} </span>
                      ) : null}
                      {m.role || "—"}
                    </td>
                    <td>{formatDate(m.birthday)}</td>
                    <td><DaysChip days={m.birthdayDays} /></td>
                    <td>{formatDate(m.workAnniversary)}</td>
                    <td><DaysChip days={m.anniversaryDays} /></td>
                    <td>
                      <DeleteButton onDelete={() => {
                        dispatch({ type: "DELETE_TEAM_MEMBER", payload: m.id });
                        toast(`${m.name} removed from team`);
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      </div>
    </>
  );
}
