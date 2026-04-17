import { useState } from "react";
import Head from "next/head";
import StatusSelect from "@/components/ui/StatusSelect";
import SearchBar from "@/components/ui/SearchBar";
import DeleteButton from "@/components/ui/DeleteButton";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { FileText } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "to_issue", label: "To Issue", badgeClass: "badge--yellow" },
  { value: "sent", label: "Sent", badgeClass: "badge--blue" },
  { value: "pending_payment", label: "Pending Payment", badgeClass: "badge--yellow" },
  { value: "paid", label: "Paid", badgeClass: "badge--green" },
];

export default function Invoices() {
  const { state, dispatch } = useStore();
  const toast = useToast();
  const { invoices } = state;
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = invoices.filter((inv) => {
    const matchSearch =
      inv.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.includes(search);
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
  const tabs = [{ value: "all", label: "All" }, ...STATUS_OPTIONS];

  return (
    <>
      <Head><title>Invoices — Niuro HR</title></Head>
      <div>
        <div className="page-header">
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{invoices.length} invoices · ${pending.toLocaleString("en-US", { minimumFractionDigits: 2 })} outstanding</p>
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
            <SearchBar value={search} onChange={setSearch} placeholder="Search invoices…" />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><FileText size={28} color="var(--text-muted)" /></div>
              <div className="empty-state__title">No invoices found</div>
              <div className="empty-state__sub">
                {search || filterStatus !== "all" ? "Try adjusting your filters." : "No invoices to display."}
              </div>
            </div>
          ) : (
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", color: "var(--text-muted)" }}>#{inv.invoiceNumber}</td>
                    <td style={{ fontWeight: 500 }}>{inv.vendorName}</td>
                    <td>${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{inv.issueDate || "—"}</td>
                    <td style={{ color: "var(--text-secondary)" }}>{inv.dueDate || "—"}</td>
                    <td>
                      <StatusSelect
                        value={inv.status}
                        options={STATUS_OPTIONS}
                        onChange={(status) => {
                          dispatch({ type: "UPDATE_INVOICE_STATUS", payload: { id: inv.id, status } });
                          toast(`Status updated to ${status.replace("_", " ")}`, "success");
                        }}
                      />
                    </td>
                    <td>
                      <DeleteButton onDelete={() => {
                        dispatch({ type: "DELETE_INVOICE", payload: inv.id });
                        toast("Invoice deleted");
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
