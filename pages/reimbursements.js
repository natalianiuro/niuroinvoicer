import { reimbursements } from "@/lib/data/mock";

function StatusBadge({ status }) {
  const map = {
    pending: ["badge--yellow", "Pending"],
    approved: ["badge--blue", "Approved"],
    paid: ["badge--green", "Paid"],
  };
  const [cls, label] = map[status] || ["badge--gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

const total = reimbursements.reduce((s, r) => s + r.amount, 0);
const pending = reimbursements.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);

export default function Reimbursements() {
  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Reimbursements</h1>
          <p className="page-subtitle">{reimbursements.length} requests · ${pending.toFixed(2)} pending</p>
        </div>
        <button className="btn btn--primary">+ Add Reimbursement</button>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", maxWidth: 600 }}>
        <div className="summary-card">
          <div className="summary-card__label">Total Submitted</div>
          <div className="summary-card__value">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Pending</div>
          <div className="summary-card__value">${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-card__label">Requests</div>
          <div className="summary-card__value">{reimbursements.length}</div>
        </div>
      </div>

      <div className="section-block">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Person</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Submitted</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reimbursements.map((r) => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>{r.personName}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.description}</td>
                <td>
                  <span className="badge badge--gray">{r.category}</span>
                </td>
                <td>${r.amount.toFixed(2)}</td>
                <td style={{ color: "var(--text-secondary)" }}>{r.dateSubmitted}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
