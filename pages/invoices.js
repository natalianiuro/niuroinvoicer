import Link from "next/link";
import { invoices } from "@/lib/data/mock";

function StatusBadge({ status }) {
  const map = {
    to_issue: ["badge--yellow", "To Issue"],
    sent: ["badge--blue", "Sent"],
    pending_payment: ["badge--yellow", "Pending Payment"],
    paid: ["badge--green", "Paid"],
  };
  const [cls, label] = map[status] || ["badge--gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Invoices() {
  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoices · ${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })} outstanding</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/invoices/generator" className="btn btn--ghost">
            Invoice Generator
          </Link>
          <button className="btn btn--primary">+ Add Invoice</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 600 }}>
        <div className="summary-card">
          <div className="summary-card__label">Total Billed</div>
          <div className="summary-card__value">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Outstanding</div>
          <div className="summary-card__value">${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Total Invoices</div>
          <div className="summary-card__value">{invoices.length}</div>
        </div>
      </div>

      <div className="section-block">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Issue Date</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>
                  #{inv.invoiceNumber}
                </td>
                <td style={{ fontWeight: 500 }}>{inv.vendorName}</td>
                <td>${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.issueDate}</td>
                <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate}</td>
                <td><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
