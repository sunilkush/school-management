import React from "react";

const money = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    Number(v || 0)
  );

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

/**
 * Shared printable fee receipt, rendered from the persisted Payment record returned by a
 * successful pay action — not from ad hoc in-memory form state. Previously reimplemented three
 * separate times (School Admin's FeeCollection, Student's FeeStudent, Parent's ParentFees), each
 * with its own markup and each one only ever showing what the client happened to have on hand at
 * the moment of payment rather than what was actually saved.
 *
 * Props:
 *  - payment: { receiptNo, amountPaid, paymentMode, paymentDate, transactionId }
 *  - description: what this payment was for (e.g. fee head name, installment name)
 *  - student: { name, className, section }
 *  - school: { name, address }
 */
const FeeReceipt = React.forwardRef(({ payment, description, student, school }, ref) => (
  <div ref={ref} style={{ padding: 32, fontFamily: "Georgia, serif", maxWidth: 480, margin: "0 auto" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #1a1a2e", paddingBottom: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", letterSpacing: "-0.01em" }}>
        {school?.name || "School"}
      </div>
      {school?.address && <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{school.address}</div>}
      <div
        style={{
          display: "inline-block",
          marginTop: 10,
          background: "#1a1a2e",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.15em",
          padding: "4px 20px",
          borderRadius: 4,
        }}
      >
        FEE RECEIPT
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: 13 }}>
      {[
        ["Receipt No", payment?.receiptNo || "—"],
        ["Date", formatDate(payment?.paymentDate)],
        ["Student", student?.name || "—"],
        student?.className ? ["Class", `${student.className}${student.section ? ` — ${student.section}` : ""}`] : null,
        ["For", description || "—"],
        payment?.transactionId ? ["Reference", payment.transactionId] : null,
      ]
        .filter(Boolean)
        .map(([k, v]) => (
          <React.Fragment key={k}>
            <div style={{ color: "#64748B", fontWeight: 600, whiteSpace: "nowrap" }}>{k}:</div>
            <div style={{ color: "#111827" }}>{v}</div>
          </React.Fragment>
        ))}
    </div>

    <div
      style={{
        margin: "20px 0",
        padding: "14px 18px",
        background: "#f0fdf4",
        borderRadius: 10,
        border: "1px solid #bbf7d0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Amount Paid
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#22C55E" }}>{money(payment?.amountPaid)}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Method
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "capitalize" }}>
          {(payment?.paymentMode || "—").replace("_", " ")}
        </div>
      </div>
    </div>

    <div style={{ borderTop: "1px dashed #CBD5E1", paddingTop: 14, textAlign: "center", fontSize: 11, color: "#94A3B8" }}>
      Computer-generated receipt · No signature required
    </div>
  </div>
));

FeeReceipt.displayName = "FeeReceipt";

/** Opens a print-only popup for a rendered FeeReceipt ref. The popup has no <link> to index.css,
 * so FeeReceipt intentionally uses literal hex colors rather than our CSS custom properties —
 * it should also always print on white paper regardless of the app's active theme. */
export const printFeeReceipt = (receiptNode) => {
  if (!receiptNode) return;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<html><head><title>Fee Receipt</title><style>
      body { margin: 0; padding: 0; font-family: Georgia, serif; }
      * { box-sizing: border-box; }
    </style></head><body onload="window.print()">${receiptNode.innerHTML}</body></html>`
  );
  win.document.close();
};

export default FeeReceipt;
