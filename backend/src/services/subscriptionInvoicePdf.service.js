import PDFDocument from "pdfkit";

/**
 * Streams a professionally laid-out A4 subscription tax-invoice PDF.
 *
 * Standard PDFKit fonts (Helvetica) can't render the ₹ glyph, so amounts are
 * prefixed "Rs." — the convention on Indian tax invoices anyway.
 *
 * @param {object}  opts
 * @param {Writable} opts.stream    where to pipe the PDF (an Express res)
 * @param {object}  opts.invoice    lean SubscriptionInvoice document
 * @param {object}  opts.school     lean School ({ name, address, email, phone, website })
 * @param {string}  opts.planName   resolved plan name
 * @param {object}  opts.config     lean GlobalConfig ({ platformName, supportEmail, supportPhone })
 */
export const renderSubscriptionInvoicePdf = ({ stream, invoice, school, planName, config = {} }) => {
  const ACCENT = "#2563EB";
  const INK = "#0F172A";
  const SUBTLE = "#64748B";
  const FAINT = "#94A3B8";
  const RULE = "#E5E9F0";
  const BAND = "#F5F7FB";

  const M = 40;                 // page margin
  const RIGHT = 555;            // content right edge (A4 width 595 - margin)
  const doc = new PDFDocument({ size: "A4", margin: M });
  doc.pipe(stream);

  const money = (n) =>
    "Rs. " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmtDate = (d) => {
    if (!d) return "—";
    const x = new Date(d);
    if (Number.isNaN(x.getTime())) return "—";
    return `${String(x.getDate()).padStart(2, "0")} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  };

  const rule = (y) => {
    doc.moveTo(M, y).lineTo(RIGHT, y).lineWidth(1).strokeColor(RULE).stroke();
  };

  const label = (txt, x, y, w, align = "left") =>
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(FAINT)
      .text(String(txt).toUpperCase(), x, y, { width: w, align, characterSpacing: 0.8 });

  const platformName = config.platformName || "School Management System";
  const status = String(invoice.status || "draft").toLowerCase();

  const STATUS_STYLE = {
    paid: { bg: "#DCFCE7", fg: "#15803D", text: "PAID" },
    unpaid: { bg: "#FEF3C7", fg: "#B45309", text: "UNPAID" },
    overdue: { bg: "#FEE2E2", fg: "#B91C1C", text: "OVERDUE" },
    draft: { bg: "#F1F5F9", fg: "#64748B", text: "DRAFT" },
    cancelled: { bg: "#F1F5F9", fg: "#64748B", text: "CANCELLED" },
  };
  const st = STATUS_STYLE[status] || STATUS_STYLE.draft;

  /* ── Header ─────────────────────────────────────────────────── */
  doc.font("Helvetica-Bold").fontSize(17).fillColor(INK).text(platformName, M, 44);
  const contactBits = [config.supportEmail, config.supportPhone].filter(Boolean).join("  ·  ");
  if (contactBits) doc.font("Helvetica").fontSize(8.5).fillColor(SUBTLE).text(contactBits, M, 68);

  doc.font("Helvetica-Bold").fontSize(20).fillColor(ACCENT).text("TAX INVOICE", M, 42, { width: RIGHT - M, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(SUBTLE)
    .text(`# ${invoice.invoiceNumber}`, M, 68, { width: RIGHT - M, align: "right" });

  rule(96);

  /* ── Bill-to / invoice meta ─────────────────────────────────── */
  const infoTop = 116;
  label("Billed to", M, infoTop, 260);
  doc.font("Helvetica-Bold").fontSize(11.5).fillColor(INK).text(school?.name || "—", M, infoTop + 13, { width: 260 });
  let by = doc.y + 2;
  if (school?.address) {
    doc.font("Helvetica").fontSize(9).fillColor(SUBTLE).text(school.address, M, by, { width: 260 });
    by = doc.y;
  }
  const schoolContact = [school?.email, school?.phone].filter(Boolean).join("  ·  ");
  if (schoolContact) doc.font("Helvetica").fontSize(9).fillColor(SUBTLE).text(schoolContact, M, by + 1, { width: 260 });

  const metaX = 300;
  const metaValX = 408;
  label("Invoice details", metaX, infoTop, RIGHT - metaX);
  const metaRows = [
    ["Issue date", fmtDate(invoice.createdAt)],
    ["Due date", fmtDate(invoice.dueDate)],
    ["Billing period", `${fmtDate(invoice.billingPeriodStart)} – ${fmtDate(invoice.billingPeriodEnd)}`],
  ];
  let my = infoTop + 15;
  metaRows.forEach(([k, v]) => {
    doc.font("Helvetica").fontSize(9).fillColor(SUBTLE).text(k, metaX, my, { width: metaValX - metaX - 6 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(INK).text(v, metaValX, my, { width: RIGHT - metaValX, align: "right" });
    my = doc.y + 6;
  });

  // status pill (under the meta block)
  const pillY = my + 2;
  const pillW = 96;
  const pillX = RIGHT - pillW;
  doc.roundedRect(pillX, pillY, pillW, 20, 10).fill(st.bg);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(st.fg)
    .text(st.text, pillX, pillY + 6, { width: pillW, align: "center", characterSpacing: 1 });

  const tableTop = Math.max(doc.y, pillY + 20, 210) + 24;

  /* ── Line items ─────────────────────────────────────────────── */
  const COL = { desc: M + 12, period: 300, qty: 400, amount: RIGHT - 12 };
  doc.rect(M, tableTop, RIGHT - M, 24).fill(BAND);
  label("Description", COL.desc, tableTop + 8, 240);
  label("Period", COL.period, tableTop + 8, 90);
  label("Qty", COL.qty, tableTop + 8, 40, "right");
  label("Amount", 440, tableTop + 8, RIGHT - 440 - 12, "right");

  const rowY = tableTop + 34;
  doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(`${planName} — subscription`, COL.desc, rowY, { width: 240 });
  doc.font("Helvetica").fontSize(8.5).fillColor(FAINT)
    .text("Recurring platform subscription for the billing period.", COL.desc, doc.y + 1, { width: 240 });
  const rowBottom = doc.y + 6;

  doc.font("Helvetica").fontSize(9).fillColor(SUBTLE)
    .text(`${fmtDate(invoice.billingPeriodStart)}\n${fmtDate(invoice.billingPeriodEnd)}`, COL.period, rowY, { width: 95 });
  doc.font("Helvetica").fontSize(10).fillColor(INK).text("1", 360, rowY, { width: 40, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(INK).text(money(invoice.planPrice), 440, rowY, { width: RIGHT - 440 - 12, align: "right" });

  rule(rowBottom);

  /* ── Totals ─────────────────────────────────────────────────── */
  const totX = 310;
  const totLabelW = 96;
  const totValX = totX + totLabelW;
  const totValW = RIGHT - totValX;
  let ty = rowBottom + 16;
  const totalRow = (k, v, opts = {}) => {
    const size = opts.big ? 12 : 9.5;
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(size)
      .fillColor(opts.color || (opts.bold ? INK : SUBTLE))
      .text(k, totX, ty, { width: totLabelW, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(size).fillColor(opts.color || INK)
      .text(v, totValX, ty, { width: totValW, align: "right", lineBreak: false });
    ty += opts.big ? 24 : 16;
  };

  totalRow("Subtotal", money(invoice.planPrice));
  if (Number(invoice.discount) > 0) totalRow("Discount", "– " + money(invoice.discount), { color: "#15803D" });
  if (Number(invoice.taxGst) > 0) totalRow("GST", money(invoice.taxGst));

  doc.moveTo(totX, ty + 2).lineTo(RIGHT, ty + 2).lineWidth(1).strokeColor(RULE).stroke();
  ty += 12;
  const paidLike = status === "paid";
  totalRow(paidLike ? "Amount paid" : "Amount due", money(invoice.totalAmount), {
    bold: true, big: true, color: paidLike ? "#15803D" : ACCENT,
  });

  doc.font("Helvetica-Oblique").fontSize(8).fillColor(FAINT)
    .text(amountInWords(invoice.totalAmount), totX, ty + 4, { width: RIGHT - totX, align: "right" });
  ty = doc.y;

  /* ── Payment note ──────────────────────────────────────────── */
  let ny = Math.max(ty + 34, doc.y + 30);
  rule(ny - 14);
  if (paidLike) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor("#15803D")
      .text(`Paid on ${fmtDate(invoice.paidDate)} via online payment. No further action required.`, M, ny, { width: RIGHT - M });
  } else if (status === "cancelled") {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(SUBTLE)
      .text("This invoice has been cancelled.", M, ny, { width: RIGHT - M });
  } else {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(st.fg)
      .text(`Payable by ${fmtDate(invoice.dueDate)}.`, M, ny, { width: RIGHT - M });
    doc.font("Helvetica").fontSize(9).fillColor(SUBTLE)
      .text("Pay online from Billing > My Subscription in your school portal.", M, doc.y + 2, { width: RIGHT - M });
  }

  const terms = [
    "This is a system-generated invoice issued on subscription renewal; no signature is required.",
    config.supportEmail ? `For billing questions, contact ${config.supportEmail}.` : null,
  ].filter(Boolean);
  doc.font("Helvetica").fontSize(8).fillColor(FAINT)
    .text(terms.join("  "), M, doc.y + 14, { width: RIGHT - M });

  /* ── Watermark stamp for paid / overdue ────────────────────── */
  if (paidLike || status === "overdue") {
    doc.save();
    doc.rotate(-20, { origin: [297, 430] });
    doc.font("Helvetica-Bold").fontSize(72).fillColor(paidLike ? "#15803D" : "#B91C1C").fillOpacity(0.08)
      .text(paidLike ? "PAID" : "OVERDUE", 97, 400, { width: 400, align: "center" });
    doc.restore();
    doc.fillOpacity(1);
  }

  /* ── Footer ────────────────────────────────────────────────── */
  doc.font("Helvetica").fontSize(8).fillColor(FAINT).text(
    `${platformName}  ·  system-generated invoice  ·  ${fmtDate(invoice.createdAt)}`,
    M, doc.page.height - 54,
    { width: RIGHT - M, align: "center", lineBreak: false }
  );

  doc.end();
};

/* ── Indian-numbering amount in words ───────────────────────────── */
const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const twoDigits = (n) => {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
};

const threeDigits = (n) => {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return (h ? ONES[h] + " hundred" + (rest ? " " : "") : "") + (rest ? twoDigits(rest) : "");
};

export const amountInWords = (amount) => {
  const num = Math.round(Number(amount || 0) * 100);
  const rupees = Math.floor(num / 100);
  const paise = num % 100;

  if (rupees === 0 && paise === 0) return "Rupees Zero only";

  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = rupees % 1000;

  const parts = [];
  if (crore) parts.push(threeDigits(crore) + " crore");
  if (lakh) parts.push(threeDigits(lakh) + " lakh");
  if (thousand) parts.push(threeDigits(thousand) + " thousand");
  if (hundred) parts.push(threeDigits(hundred));

  let words = parts.join(" ").trim() || "zero";
  words = "Rupees " + words.charAt(0).toUpperCase() + words.slice(1);
  if (paise) words += " and " + twoDigits(paise) + " paise";
  return words + " only";
};
