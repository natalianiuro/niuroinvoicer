import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { getCountry } from "@/lib/countries";
import { clients as CLIENT_LIST } from "@/lib/data/mock";

// ─── Helpers ─────────────────────────────────────────────────
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
function formatEventDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function groupCount(arr, key) {
  return arr.reduce((acc, item) => {
    const val = item[key] || "Unknown";
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

// ─── Indicators widget ────────────────────────────────────────
function IndicatorsWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/indicators")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fmt = (n) =>
    n != null ? n.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  const dateStr = data?.date
    ? new Date(data.date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
    : null;

  return (
    <div className="indicators-widget">
      <div className="indicator-item">
        <span className="indicator-label">UF</span>
        <span className="indicator-value">{loading ? "…" : `$${fmt(data?.uf)}`}</span>
      </div>
      <div className="indicator-divider" />
      <div className="indicator-item">
        <span className="indicator-label">USD</span>
        <span className="indicator-value">{loading ? "…" : `$${fmt(data?.usd)}`}</span>
      </div>
      <div className="indicator-divider" />
      <div className="indicator-item">
        <span className="indicator-label" style={{ fontSize: 11 }}>
          {dateStr ? `Al ${dateStr}` : "Actualizando…"}
        </span>
      </div>
    </div>
  );
}

// ─── Client logo with clearbit fallback ──────────────────────
function ClientLogo({ client }) {
  const [failed, setFailed] = useState(false);
  const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  if (failed || !client.domain) {
    return (
      <div className="client-logo-fallback">
        {initials}
      </div>
    );
  }

  return (
    <img
      src={`https://logo.clearbit.com/${client.domain}`}
      alt={client.name}
      className="client-logo-img"
      onError={() => setFailed(true)}
    />
  );
}

// ─── Compliance reminder row ──────────────────────────────────
function ComplianceReminderRow({ label, day, description }) {
  const today = new Date();
  let target = new Date(today.getFullYear(), today.getMonth(), day);
  if (today.getDate() >= day) target = new Date(today.getFullYear(), today.getMonth() + 1, day);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  const urgent = diff <= 3, warning = diff <= 7 && !urgent;
  const badgeClass = urgent ? "badge--red" : warning ? "badge--yellow" : "badge--green";
  const dateStr = target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="reminder-item">
      <div className="reminder-avatar" style={{ background: urgent ? "var(--red-bg)" : warning ? "var(--yellow-bg)" : "var(--green-bg)", color: urgent ? "var(--red)" : warning ? "var(--yellow)" : "var(--green)", fontWeight: 700, fontSize: 13 }}>
        {diff}d
      </div>
      <div>
        <div className="reminder-name">{label}</div>
        <div className="reminder-detail">{description}</div>
      </div>
      <div className="reminder-date">
        <span className={`badge ${badgeClass}`}>{diff === 0 ? "Today!" : diff === 1 ? "Tomorrow" : `in ${diff} days`}</span>
        {" · "}{dateStr}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
const INVOICE_LABELS = {
  to_issue: ["badge--yellow", "To Issue"],
  sent: ["badge--blue", "Sent"],
  pending_payment: ["badge--yellow", "Pending Payment"],
  paid: ["badge--green", "Paid"],
};

export default function Dashboard() {
  const { state } = useStore();
  const { contractors, reimbursements, invoices, team } = state;

  // ── Deduplicated full list (contractors + team, by email) ──
  const allPeople = Object.values(
    [...contractors, ...team].reduce((acc, p) => {
      const key = p.email || p.name;
      if (!acc[key]) acc[key] = p;
      return acc;
    }, {})
  );

  // ── Headcount breakdown ────────────────────────────────────
  const totalPeople      = allPeople.length;
  const totalContractors = allPeople.filter((p) => p.personType === "contractor").length;
  const totalEmployees   = allPeople.filter((p) => p.personType === "employee").length;
  const totalInternal    = allPeople.filter((p) => p.personType === "internal").length;

  // ── Country / role breakdown ───────────────────────────────
  const byCountry  = groupCount(allPeople, "country");
  const byRole     = groupCount(allPeople, "role");
  const countriesSorted = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);
  const rolesSorted     = Object.entries(byRole).sort((a, b) => b[1] - a[1]);

  // ── Per-client engineer count ──────────────────────────────
  const engineersByClient = contractors.reduce((acc, c) => {
    if (c.client) acc[c.client] = (acc[c.client] || 0) + 1;
    return acc;
  }, {});

  // ── Reminders ─────────────────────────────────────────────
  const pendingInvoices      = invoices.filter((i) => i.status !== "paid").length;
  const openReimbursements   = reimbursements.filter((r) => r.status === "pending").length;
  const inProgressOnboarding = contractors.filter((c) => c.onboardingStatus !== "complete").length;

  const upcomingEvents = team
    .flatMap((m) => [
      { name: m.name, type: "Birthday", date: m.birthday },
      { name: m.name, type: "Anniversary", date: m.workAnniversary },
    ])
    .filter((e) => e.date)
    .map((e) => ({ ...e, daysUntil: getDaysUntil(e.date) }))
    .filter((e) => e.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const recentInvoices = invoices.slice(0, 3);

  return (
    <>
      <Head><title>Dashboard — Niuro HR</title></Head>
      <div>

        {/* ── Header + indicators ── */}
        <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back — here&apos;s what&apos;s happening.</p>
          </div>
          <IndicatorsWidget />
        </div>

        {/* ── Headcount summary ── */}
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          <div className="summary-card">
            <div className="summary-card__label">Team</div>
            <div className="summary-card__value">{totalPeople}</div>
            <div className="summary-card__sub">total people</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Contractors</div>
            <div className="summary-card__value">{totalContractors}</div>
            <div className="summary-card__sub">{inProgressOnboarding} onboarding</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Employees</div>
            <div className="summary-card__value">{totalEmployees}</div>
            <div className="summary-card__sub">working with clients</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">Internal</div>
            <div className="summary-card__value">{totalInternal}</div>
            <div className="summary-card__sub">at Niuro directly</div>
          </div>
        </div>

        {/* ── Alerts row ── */}
        <div className="card-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 480, marginBottom: 24 }}>
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
        </div>

        {/* ── Clients ── */}
        <div className="section-block" style={{ marginBottom: 24 }}>
          <div className="section-block__header">
            <span className="section-block__title">Clients</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{CLIENT_LIST.length} clients</span>
          </div>
          <div className="clients-grid">
            {CLIENT_LIST.map((client) => {
              const count = engineersByClient[client.id] || 0;
              return (
                <div key={client.id} className="client-card">
                  <div className="client-card__logo">
                    <ClientLogo client={client} />
                  </div>
                  <div className="client-card__name">{client.name}</div>
                  <div className="client-card__count">
                    {count > 0 ? (
                      <span className="badge badge--blue">{count} {count === 1 ? "engineer" : "engineers"}</span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>no engineers</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Country + Role breakdown ── */}
        <div className="headcount-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="section-block">
            <div className="section-block__header">
              <span className="section-block__title">By Country</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{totalPeople} people</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {countriesSorted.map(([code, count]) => {
                const { flag, name } = getCountry(code);
                const pct = Math.round((count / totalPeople) * 100);
                return (
                  <div key={code} className="headcount-row">
                    <span className="headcount-flag">{flag}</span>
                    <span className="headcount-label">{name}</span>
                    <div className="headcount-bar-wrap">
                      <div className="headcount-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="headcount-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="section-block">
            <div className="section-block__header">
              <span className="section-block__title">By Role</span>
            </div>
            <div style={{ padding: "8px 0" }}>
              {rolesSorted.map(([role, count]) => {
                const pct = Math.round((count / totalPeople) * 100);
                return (
                  <div key={role} className="headcount-row">
                    <span className="headcount-label" style={{ flex: 1 }}>{role || "—"}</span>
                    <div className="headcount-bar-wrap">
                      <div className="headcount-bar" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="headcount-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Upcoming reminders ── */}
        <div className="section-block" style={{ marginBottom: 24 }}>
          <div className="section-block__header">
            <span className="section-block__title">Upcoming Reminders</span>
            <Link href="/team" style={{ fontSize: 12, color: "var(--text-muted)" }}>View all</Link>
          </div>
          <ComplianceReminderRow label="Previred" day={13} description="Social security contributions" />
          <ComplianceReminderRow label="F29" day={20} description="VAT declaration & payment" />
          {upcomingEvents.map((event, i) => (
            <div className="reminder-item" key={i}>
              <div className="reminder-avatar">{getInitials(event.name)}</div>
              <div>
                <div className="reminder-name">{event.name}</div>
                <div className="reminder-detail">{event.type}</div>
              </div>
              <div className="reminder-date">
                {event.daysUntil === 0 ? "Today!" : event.daysUntil === 1 ? "Tomorrow" : `in ${event.daysUntil} days`}
                {" · "}{formatEventDate(event.date)}
              </div>
            </div>
          ))}
          {upcomingEvents.length === 0 && (
            <div style={{ padding: "8px 0", fontSize: 13, color: "var(--text-muted)" }}>No team events in the next 30 days.</div>
          )}
        </div>

        {/* ── Recent invoices ── */}
        <div className="section-block">
          <div className="section-block__header">
            <span className="section-block__title">Recent Invoices</span>
            <Link href="/invoices" style={{ fontSize: 12, color: "var(--text-muted)" }}>View all</Link>
          </div>
          <table className="hr-table">
            <thead>
              <tr>
                <th>Invoice #</th><th>Client</th><th>Amount</th><th>Due</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map((inv) => {
                const [cls, label] = INVOICE_LABELS[inv.status] || ["badge--gray", inv.status];
                return (
                  <tr key={inv.id}>
                    <td style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>#{inv.invoiceNumber}</td>
                    <td>{inv.vendorName}</td>
                    <td>${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate || "—"}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </>
  );
}
