import { useState } from "react";
import jsPDF from "jspdf";

// Datos fijos de Niuro (From)
const NIURO_NAME = "NIURO SPA";
const NIURO_ADDRESS = "CERRO EL PLOMO 5931 OF 1213 PS 12 LAS CONDES";
const NIURO_TAXID = "RUT/Tax ID: 77.755.178-7";

export default function Home() {
  const [clientName, setClientName] = useState("Fundo, LLC");
  const [clientAddress, setClientAddress] = useState(
    "3323 NE 163rd St, North Miami Beach, FL 33160"
  );
  const [invoiceDate, setInvoiceDate] = useState("November 4, 2025");
  const [invoiceNumber, setInvoiceNumber] = useState("0001");
  const [description, setDescription] = useState("Team for Fundo, LLC");
  const [billingPeriod, setBillingPeriod] = useState("November 2025"); // nuevo campo

  // Filas de la tabla
  const [rows, setRows] = useState([
    {
      name: "Mónica Mondaca",
      period: "October 14 - October 31, 2025",
      monthlyRate: 4500,
      dedication: "Full time",
      jobDescription: "Lead QA Engineer",
      comments:
        "10% discount for first month to account for onboarding period",
      totalUsd: 2465,
    },
    {
      name: "James Maradiaga",
      period: "October 27 - October 31, 2025",
      monthlyRate: 4500,
      dedication: "Full time",
      jobDescription: "Lead DevOps Engineer",
      comments:
        "10% discount for first month to account for onboarding period",
      totalUsd: 880,
    },
  ]);

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    if (["monthlyRate", "totalUsd"].includes(field)) {
      newRows[index][field] = Number(value);
    } else {
      newRows[index][field] = value;
    }
    setRows(newRows);
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        name: "",
        period: "",
        monthlyRate: 0,
        dedication: "",
        jobDescription: "",
        comments: "",
        totalUsd: 0,
      },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const invoiceTotal = rows.reduce(
    (sum, r) => sum + (Number(r.totalUsd) || 0),
    0
  );

  // Datos para vista previa y email
  const numEngineers = rows.length;
  const pluralEngineers = numEngineers === 1 ? "engineer" : "engineers";
  const formattedTotal = invoiceTotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
  });

  const emailPreview = `Hi ${clientName},

Please find attached the invoice for the ${numEngineers} ${pluralEngineers} corresponding to ${billingPeriod}, for a total of USD ${formattedTotal}.

Let me know if you need anything else.

Kind regards,
Natalia`;

  const generatePdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });

    const PAGE_WIDTH = doc.internal.pageSize.getWidth(); // ~612
    const MARGIN_X = 50;
    const LEFT = MARGIN_X;
    const RIGHT = PAGE_WIDTH - MARGIN_X;
    const CONTENT_WIDTH = RIGHT - LEFT;
    let y = 60;

    const img = new Image();
    img.src = "/logo.png";

    img.onload = () => {
      // LOGO
      try {
        doc.addImage(img, "PNG", LEFT, y, 120, 50);
        y += 70;
      } catch (e) {
        console.warn("No se pudo agregar el logo:", e);
      }

      // FROM (Niuro fijo arriba a la izquierda)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(NIURO_NAME, LEFT, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(NIURO_ADDRESS, LEFT, y);
      y += 14;
      doc.text(NIURO_TAXID, LEFT, y);

      // Bloque derecho Invoice Date / No dentro de márgenes
      const rightLabelX = LEFT + CONTENT_WIDTH * 0.55;
      const rightValueX = rightLabelX + 90;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Invoice Date:", rightLabelX, 70);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceDate, rightValueX, 70);

      doc.setFont("helvetica", "bold");
      doc.text("Invoice No:", rightLabelX, 90);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceNumber, rightValueX, 90);

      // ─────────────────────────────
      // TO y FROM A LA MISMA ALTURA
      // ─────────────────────────────
      const blockTop = y + 30; // altura base para To y From (misma línea)

      // TO (cliente)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("To:", LEFT, blockTop);

      let toY = blockTop + 14;
      doc.setFont("helvetica", "normal");
      doc.text(clientName, LEFT, toY);
      toY += 14;
      const clientAddressLines = doc.splitTextToSize(
        `Address: ${clientAddress}`,
        CONTENT_WIDTH / 2
      );
      doc.text(clientAddressLines, LEFT, toY);
      const toBlockBottom = toY + clientAddressLines.length * 10;

      // FROM (misma altura que To)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("From:", rightLabelX, blockTop);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const fromLines = doc.splitTextToSize(
        `${NIURO_NAME}\n${NIURO_ADDRESS}\n${NIURO_TAXID}`,
        CONTENT_WIDTH / 2
      );
      const fromY = blockTop + 14;
      doc.text(fromLines, rightLabelX, fromY);
      const fromBlockBottom = fromY + fromLines.length * 10;

      // Dejamos y más abajo del bloque más alto de los dos
      y = Math.max(toBlockBottom, fromBlockBottom) + 40;

      // DESCRIPTION
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Description:", LEFT, y);
      doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(description, CONTENT_WIDTH - 90);
      doc.text(descLines, LEFT + 90, y);
      y += descLines.length * 12;

      // ─────────────────────────────
      // TABLA TIPO EXCEL (COLUMNAS IGUALES) + Total USD
      // ─────────────────────────────
      y += 25;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);

      const headers = [
        "Name",
        "Period",
        "Monthly Rate",
        "Dedication",
        "Job Description",
        "Comments",
        "Total (USD)",
      ];

      // 7 columnas del mismo ancho
      const colWidth = CONTENT_WIDTH / headers.length;
      const colX = [];
      for (let i = 0; i <= headers.length; i++) {
        colX.push(LEFT + colWidth * i);
      }

      const headerY = y;
      const headerHeight = 18;

      // Rectángulo encabezado
      doc.rect(LEFT, headerY, CONTENT_WIDTH, headerHeight);

      // Líneas verticales
      for (let i = 0; i < colX.length; i++) {
        doc.line(colX[i], headerY, colX[i], headerY + headerHeight);
      }

      // Texto encabezado
      const headerTextY = headerY + 12;
      headers.forEach((h, i) => {
        doc.text(h, colX[i] + 3, headerTextY);
      });

      y = headerY + headerHeight;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      rows.forEach((row) => {
        if (y > 700) {
          doc.addPage();
          y = 60;
        }

        const lineHeight = 10;

        const nameLines = doc.splitTextToSize(row.name || "", colWidth - 6);
        const periodLines = doc.splitTextToSize(
          row.period || "",
          colWidth - 6
        );
        const rateLines = doc.splitTextToSize(
          row.monthlyRate
            ? Number(row.monthlyRate).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })
            : "",
          colWidth - 6
        );
        const dedicationLines = doc.splitTextToSize(
          row.dedication || "",
          colWidth - 6
        );
        const jobLines = doc.splitTextToSize(
          row.jobDescription || "",
          colWidth - 6
        );
        const commentsLines = doc.splitTextToSize(
          row.comments || "",
          colWidth - 6
        );
        const totalLines = doc.splitTextToSize(
          row.totalUsd
            ? Number(row.totalUsd).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })
            : "",
          colWidth - 6
        );

        const linesPerCell = Math.max(
          nameLines.length,
          periodLines.length,
          rateLines.length,
          dedicationLines.length,
          jobLines.length,
          commentsLines.length,
          totalLines.length
        );

        const rowHeight = linesPerCell * lineHeight + 4;

        // Rectángulo fila
        doc.rect(LEFT, y, CONTENT_WIDTH, rowHeight);

        // Líneas verticales fila
        for (let i = 0; i < colX.length; i++) {
          doc.line(colX[i], y, colX[i], y + rowHeight);
        }

        const baseY = y + 12;

        const drawColumnText = (lines, colIndex) => {
          doc.text(lines, colX[colIndex] + 3, baseY);
        };

        drawColumnText(nameLines, 0);
        drawColumnText(periodLines, 1);
        drawColumnText(rateLines, 2);
        drawColumnText(dedicationLines, 3);
        drawColumnText(jobLines, 4);
        drawColumnText(commentsLines, 5);
        drawColumnText(totalLines, 6);

        y += rowHeight;
      });

      // TOTAL
      y += 25;
      const formattedInvoiceTotal = invoiceTotal.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(
        `Invoice Total Amount ${formattedInvoiceTotal} USD`,
        LEFT,
        y
      );

      // Nota
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "All amounts shown on this invoice are in US dollars.",
        LEFT,
        y
      );

      doc.save(`Invoice_${invoiceNumber || "niuro"}.pdf`);
    };

    img.onerror = () => {
      console.warn("No se pudo cargar el logo, generando sin logo");
    };
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "40px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      {/* Header de la app */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 30 }}>
        <img
          src="/logo.png"
          alt="Niuro Logo"
          style={{ width: "150px", marginRight: "20px" }}
        />
        <div>
          <h1 style={{ margin: 0 }}>Niuro Invoicer</h1>
          <p style={{ margin: 0, color: "#555" }}>
            Generador de invoices en formato Niuro
          </p>
        </div>
      </div>

      {/* Datos generales del invoice */}
      <div
        style={{
          border: "1px solid #ddd",
borderRadius: "8px",
padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Datos del invoice</h2>

        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label>Invoice Date:</label>
            <input
              type="text"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: "250px" }}>
            <label>Invoice No:</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Description:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>

        <div style={{ marginTop: "10px" }}>
          <label>Billing period (for email):</label>
          <input
            type="text"
            value={billingPeriod}
            onChange={(e) => setBillingPeriod(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
          <p
            style={{
              fontSize: "12px",
              color: "#777",
              marginTop: "4px",
            }}
          >
            Ejemplo: "November 2025". Se usa en el texto del correo.
          </p>
        </div>
      </div>

      {/* To / From */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "250px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>To:</h3>
          <label>Client name:</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
          <label style={{ marginTop: "8px", display: "block" }}>
            Client address:
          </label>
          <textarea
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            rows={3}
          />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: "250px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>From:</h3>
          <p style={{ margin: "4px 0", fontWeight: "bold" }}>{NIURO_NAME}</p>
          <p style={{ margin: "4px 0" }}>{NIURO_ADDRESS}</p>
          <p style={{ margin: "4px 0" }}>{NIURO_TAXID}</p>
          <p style={{ marginTop: "10px", fontSize: "12px", color: "#555" }}>
            Estos datos están fijos y se autocompletan en el PDF.
          </p>
        </div>
      </div>

      {/* Tabla de filas (formulario) */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Detalle (filas tipo Niuro)</h3>
        {rows.map((row, index) => (
          <div
            key={index}
            style={{
              borderBottom: "1px solid #eee",
              paddingBottom: "10px",
              marginBottom: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label>Name:</label>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) =>
                    handleRowChange(index, "name", e.target.value)
                  }
                  style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label>Period:</label>
                <input
                  type="text"
                  value={row.period}
                  onChange={(e) =>
                    handleRowChange(index, "period", e.target.value)
                  }
                  style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label>Monthly Rate (USD):</label>
                <input
                  type="number"
                  value={row.monthlyRate}
                  onChange={(e) =>
                    handleRowChange(index, "monthlyRate", e.target.value)
                  }
                  style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                />
              </div>
              <div style={{ flex: 1, minWidth: "150px" }}>
                <label>Total (USD):</label>
                <input
                  type="number"
                  value={row.totalUsd}
                  onChange={(e) =>
                    handleRowChange(index, "totalUsd", e.target.value)
                  }
                  style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                />
              </div>
            </div>

            <div>
              <label>Dedication:</label>
              <input
                type="text"
                value={row.dedication}
                onChange={(e) =>
                  handleRowChange(index, "dedication", e.target.value)
                }
                style={{ width: "100%", padding: "6px", marginTop: "4px" }}
              />
            </div>

            <div style={{ marginTop: "8px" }}>
              <label>Job Description:</label>
              <input
                type="text"
                value={row.jobDescription}
                onChange={(e) =>
                  handleRowChange(index, "jobDescription", e.target.value)
                }
                style={{ width: "100%", padding: "6px", marginTop: "4px" }}
              />
            </div>

            <div style={{ marginTop: "8px" }}>
              <label>Comments:</label>
              <textarea
                value={row.comments}
                onChange={(e) =>
                  handleRowChange(index, "comments", e.target.value)
                }
                style={{ width: "100%", padding: "6px", marginTop: "4px" }}
                rows={2}
              />
            </div>

            <button
              onClick={() => removeRow(index)}
              style={{
                marginTop: "8px",
                padding: "6px 10px",
                backgroundColor: "#eee",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Eliminar fila
            </button>
          </div>
        ))}

        <button
          onClick={addRow}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            backgroundColor: "#0A0E2E",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Agregar fila
        </button>

        <div style={{ marginTop: "16px", fontWeight: "bold" }}>
          Invoice Total Amount: {formattedTotal} USD
        </div>
      </div>

      {/* Vista previa + template de correo */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {/* Vista previa del invoice */}
<div
  style={{
    flex: 1,
    minWidth: "300px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "10px",
    background: "#fafafa",
    maxHeight: "380px",
    overflowY: "auto",
  }}
>
  <h3 style={{ marginTop: 0, fontSize: "14px" }}>Vista previa del invoice</h3>
  <div style={{ fontSize: "11px" }}>
    <div style={{ marginBottom: "4px", fontWeight: "bold" }}>
      {NIURO_NAME}
    </div>
    <div>{NIURO_ADDRESS}</div>
    <div>{NIURO_TAXID}</div>

    <div
      style={{
        marginTop: "8px",
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
      }}
    >
      <div>
        <div>
          <strong>To:</strong>
        </div>
        <div>{clientName}</div>
        <div style={{ whiteSpace: "pre-line" }}>{clientAddress}</div>
      </div>
      <div style={{ fontSize: "10px" }}>
        <div>
          <strong>Invoice Date:</strong> {invoiceDate}
        </div>
        <div>
          <strong>Invoice No:</strong> {invoiceNumber}
        </div>
        <div>
          <strong>Period:</strong> {billingPeriod}
        </div>
      </div>
    </div>

    <div style={{ marginTop: "8px" }}>
      <strong>Description:</strong> {description}
    </div>

    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        marginTop: "8px",
        fontSize: "10px",
      }}
    >
      <thead>
        <tr>
          {[
            "Name",
            "Period",
            "Monthly Rate",
            "Dedication",
            "Job Description",
            "Comments",
            "Total (USD)",
          ].map((h) => (
            <th
              key={h}
              style={{
                border: "1px solid #ccc",
                padding: "3px",
                textAlign: "left",
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx}>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.name}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.period}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.monthlyRate
                ? Number(row.monthlyRate).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })
                : ""}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.dedication}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.jobDescription}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.comments}
            </td>
            <td style={{ border: "1px solid #eee", padding: "3px" }}>
              {row.totalUsd
                ? Number(row.totalUsd).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })
                : ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ marginTop: "6px", fontWeight: "bold" }}>
      Invoice Total Amount: {formattedTotal} USD
    </div>
  </div>
</div>

        {/* Template de correo */}
        <div
          style={{
            flex: 1,
            minWidth: "300px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "16px",
            background: "#fafafa",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Template de correo</h3>
          <p style={{ fontSize: "12px", color: "#555" }}>
            Copia y pega este texto en tu correo al cliente.
          </p>
          <textarea
            value={emailPreview}
            readOnly
            style={{
              width: "100%",
              height: "220px",
              padding: "8px",
              fontFamily: "inherit",
              fontSize: "13px",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      </div>

      {/* Botón PDF */}
      <button
        onClick={generatePdf}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: "#0A0E2E",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
          borderRadius: "6px",
        }}
      >
        Descargar PDF en formato Niuro
      </button>
    </div>
  );
}
