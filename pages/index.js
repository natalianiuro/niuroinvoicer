import Link from "next/link";
import { contractors, reimbursements, invoices, teamMembers } from "@/lib/data/mock";

function getInitials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function getDaysUntil(dateStr) {
  const today = new Date();
  const date = new Date(dateStr);
  date.setFullYear(today.getFullYear());
  if (date < today) date.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
  return diff;
}

function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const pendingInvoices = invoices.filter((i) => i.status !== "paid").length;
  const openReimbursements = reimbursements.filter((r) => r.status === "pending").length;
  const inProgressContractors = contractors.filter((c) => c.onboardingStatus !== "complete").length;

  // Upcoming birthdays & anniversaries (next 30 days)
  const upcomingEvents = teamMembers
    .flatMap((m) => [
      { name: m.name, type: "Birthday", date: m.birthday },
      { name: m.name, type: "Anniversary", date: m.workAnniversary },
    ])
    .map((e) => ({ ...e, daysUntil: getDaysUntil(e.date) }))
    .filter((e) => e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const recentInvoices = invoices.slice(0, 3);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening.</p>
      </div>

      {/* Summary cards */}
      <div className="card-grid">
        <div className="summary-card">
          <div className="summary-card__label">Pending Invoices</div>
          <div className="summary-card__value">{pendingInvoices}</div>
          <div className="summary-card__sub">need action</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Open Reimbursements</div>
          <div className="summary-card__value">{openReimbursements}</div>
          <div className="summary-card__sub">pending approval</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Onboarding</div>
          <div className="summary-card__value">{inProgressContractors}</div>
          <div className="summary-card__sub">in progress or not started</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Upcoming Events</div>
          <div className="summary-card__value">{upcomingEvents.length}</div>
          <div className="summary-card__sub">in the next 30 days</div>
        </div>
      </div>

      {/* Upcoming reminders */}
      <div className="section-block">
        <div className="section-block__header">
          <span className="section-block__title">Upcoming Reminders</span>
          <Link href="/team" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            View all
          </Link>
        </div>
        {upcomingEvents.length === 0 ? (
          <div className="empty-state">No events in the next 30 days.</div>
        ) : (
          upcomingEvents.map((event, i) => (
            <div className="reminder-item" key={i}>
              <div className="reminder-avatar">{getInitials(event.name)}</div>
              <div>
                <div className="reminder-name">{event.name}</div>
                <div className="reminder-detail">{event.type}</div>
              </div>
              <div className="reminder-date">
                {event.daysUntil === 0
                  ? "Today!"
                  : event.daysUntil === 1
                  ? "Tomorrow"
                  : `in ${event.daysUntil} days`}{" "}
                &middot; {formatEventDate(event.date)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent invoices */}
      <div className="section-block">
        <div className="section-block__header">
          <span className="section-block__title">Recent Invoices</span>
          <Link href="/invoices" style={{ fontSize: 12, color: "var(--text-muted)" }}>
            View all
          </Link>
        </div>
        <table className="hr-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>
                  #{inv.invoiceNumber}
                </td>
                <td>{inv.vendorName}</td>
                <td>
                  ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                <td>
                  <InvoiceStatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InvoiceStatusBadge({ status }) {
  const map = {
    to_issue: ["badge--yellow", "To Issue"],
    sent: ["badge--blue", "Sent"],
    pending_payment: ["badge--yellow", "Pending Payment"],
    paid: ["badge--green", "Paid"],
  };
  const [cls, label] = map[status] || ["badge--gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}
