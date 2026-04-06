import { teamMembers } from "@/lib/data/mock";

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

export default function Team() {
  const members = teamMembers.map((m) => ({
    ...m,
    birthdayDays: getDaysUntil(m.birthday),
    anniversaryDays: getDaysUntil(m.workAnniversary),
  }));

  return (
    <div>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">{teamMembers.length} members · birthdays & anniversaries</p>
        </div>
        <button className="btn btn--primary">+ Add Member</button>
      </div>

      <div className="section-block">
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
                <td style={{ color: "var(--text-secondary)" }}>{m.role}</td>
                <td>{formatDate(m.birthday)}</td>
                <td><DaysChip days={m.birthdayDays} /></td>
                <td>{formatDate(m.workAnniversary)}</td>
                <td><DaysChip days={m.anniversaryDays} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
