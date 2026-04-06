import { equipment } from "@/lib/data/mock";

function StatusBadge({ status }) {
  const map = {
    available: ["badge--green", "Available"],
    assigned: ["badge--blue", "Assigned"],
    in_repair: ["badge--yellow", "In Repair"],
    retired: ["badge--gray", "Retired"],
  };
  const [cls, label] = map[status] || ["badge--gray", status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function TypeTag({ type }) {
  const map = {
    laptop: "Laptop",
    monitor: "Monitor",
    phone: "Phone",
    other: "Other",
  };
  return (
    <span className="badge badge--gray">{map[type] || type}</span>
  );
}

export default function Equipment() {
  const available = equipment.filter((e) => e.status === "available").length;
  const assigned = equipment.filter((e) => e.status === "assigned").length;

  return (
    <div>
      <div
        className="page-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h1 className="page-title">Equipment</h1>
          <p className="page-subtitle">{equipment.length} items · {available} available</p>
        </div>
        <button className="btn btn--primary">+ Add Item</button>
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
          <div className="summary-card__value">
            {equipment.filter((e) => e.status === "in_repair").length}
          </div>
        </div>
      </div>

      <div className="section-block">
        <table className="hr-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Serial #</th>
              <th>Assigned To</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td style={{ fontWeight: 500 }}>{item.name}</td>
                <td><TypeTag type={item.type} /></td>
                <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)" }}>
                  {item.serialNumber}
                </td>
                <td style={{ color: item.assignedTo ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {item.assignedTo || "—"}
                </td>
                <td><StatusBadge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
