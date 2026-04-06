import { contractors } from "@/lib/data/mock";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function OnboardingBadge({ status }) {
  const map = {
    not_started: ["badge--gray", "Not Started"],
    in_progress: ["badge--yellow", "In Progress"],
    complete: ["badge--green", "Complete"],
  };
  const [cls, label] = map[status] || ["badge--gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ProgressBar({ steps }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        {done}/{steps.length}
      </span>
    </div>
  );
}

export default function Contractors() {
  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Contractors</h1>
          <p className="page-subtitle">{contractors.length} active contractors</p>
        </div>
        <button className="btn btn--primary">+ Add Contractor</button>
      </div>

      <div className="section-block">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Start Date</th>
              <th>Contract End</th>
              <th>Onboarding</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {contractors.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="reminder-avatar">{getInitials(c.name)}</div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{c.role}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.startDate}</td>
                <td style={{ color: "var(--text-secondary)" }}>{c.contractEndDate}</td>
                <td><OnboardingBadge status={c.onboardingStatus} /></td>
                <td><ProgressBar steps={c.onboardingSteps} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
