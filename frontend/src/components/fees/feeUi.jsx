import React, { useCallback, useState } from "react";
import { message } from "antd";
import { useDispatch } from "react-redux";
import dayjs from "dayjs";
import { createPayment, verifyPayment } from "../../features/paymentSlice";
import { pill } from "../../styles/pageStyles";

/* ── Money & dates ───────────────────────────────────────────────── */

export const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const fmtDate = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "—");

export const getErrorMessage = (err, fallback = "Something went wrong") => {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  return err?.message || err?.payload?.message || err?.data?.message || fallback;
};

/* ── Frequency ───────────────────────────────────────────────────── */

/**
 * Display labels only. Every fee figure — yearly totals, per-frequency totals, amounts due — is
 * calculated by the backend (services/feeSchedule.service.js); screens show what it returns and
 * do no arithmetic on money.
 */
export const FREQUENCIES = {
  monthly: { label: "Monthly", per: "month", color: "var(--accent)", bg: "rgba(var(--accent-rgb), 0.16)" },
  quarterly: { label: "Quarterly", per: "quarter", color: "var(--primary)", bg: "var(--primary-light)" },
  half_yearly: { label: "Half-yearly", per: "half-year", color: "var(--purple)", bg: "rgba(var(--purple-rgb), 0.14)" },
  yearly: { label: "Yearly", per: "year", color: "var(--success)", bg: "var(--success-light)" },
  one_time: { label: "One-time", per: "one time", color: "var(--warning-hover)", bg: "var(--warning-light)" },
};

export const FREQUENCY_ORDER = ["monthly", "quarterly", "half_yearly", "yearly", "one_time"];

export const FREQUENCY_OPTIONS = FREQUENCY_ORDER.map((value) => ({ value, label: FREQUENCIES[value].label }));

export const FrequencyTag = ({ frequency }) => {
  const f = FREQUENCIES[frequency];
  if (!f) return <span style={{ color: "var(--text-muted)" }}>—</span>;
  return <span style={pill(f.color, f.bg)}>{f.label}</span>;
};

/** "₹2,000 / month" */
export const perPeriodLabel = (amount, frequency) => {
  const f = FREQUENCIES[frequency];
  if (!f) return money(amount);
  return frequency === "one_time" ? `${money(amount)} one-time` : `${money(amount)} / ${f.per}`;
};

/* ── Payment status ──────────────────────────────────────────────── */

export const FEE_STATUS = {
  paid: { label: "Paid", color: "var(--success-hover)", bg: "var(--success-light)" },
  partial: { label: "Partial Paid", color: "var(--warning-hover)", bg: "var(--warning-light)" },
  pending: { label: "Unpaid", color: "var(--text-secondary)", bg: "var(--surface-soft)" },
  overdue: { label: "Overdue", color: "var(--danger-hover)", bg: "var(--danger-light)" },
};

/** Overdue wins over partial: a partly paid installment past its due date is still overdue. */
export const FeeStatusTag = ({ status, paidAmount = 0 }) => {
  const key = status === "late" ? "overdue" : status;
  const s = FEE_STATUS[key] || FEE_STATUS.pending;
  return (
    <span style={{ ...pill(s.color, s.bg), whiteSpace: "nowrap" }}>
      {s.label}
      {key === "overdue" && Number(paidAmount) > 0 ? " · part paid" : ""}
    </span>
  );
};

/* ── Payment modes ───────────────────────────────────────────────── */

export const COUNTER_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

export const MODE_LABEL = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
  razorpay: "Online (Razorpay)",
};

/** "Late fine ₹10/day after the due date, max ₹100" — or null when the school has fines off. */
export const lateFineText = (settings) => {
  const lf = settings?.lateFine;
  if (!lf?.enabled || !(lf.amount > 0)) return null;
  const grace = lf.graceDays ? ` after ${lf.graceDays} day${lf.graceDays > 1 ? "s" : ""} of grace` : " after the due date";
  const rate = lf.type === "per_day" ? `${money(lf.amount)} per day` : `${money(lf.amount)} once`;
  const cap = lf.type === "per_day" && lf.maxAmount > 0 ? `, up to ${money(lf.maxAmount)}` : "";
  return `Late fine: ${rate}${grace}${cap}`;
};

/* ── Receipt lines ───────────────────────────────────────────────── */

/**
 * What a payment paid for, one line per installment. Works on a payment straight from
 * createPayment/verify (allocation ids only — labelled from the schedule rows the payer chose
 * from) and on one from the payments list (allocations populated by the server).
 */
export const receiptLines = (payment, scheduleRows = []) => {
  const byId = new Map(scheduleRows.map((r) => [String(r._id), r]));
  return (payment?.allocations || []).map((a) => {
    const inst = a.installmentId && typeof a.installmentId === "object" ? a.installmentId : null;
    const row = byId.get(String(inst?._id || a.installmentId));
    const head = row?.feeHeadName || inst?.studentFeeId?.feeStructureId?.feeHeadId?.name || "Fee";
    const period = row?.installmentName || inst?.installmentName || "";
    return { label: period ? `${head} · ${period}` : head, amount: a.amount };
  });
};

/* ── Online checkout ─────────────────────────────────────────────── */

export const GATEWAY_LABEL = {
  razorpay: "Razorpay",
  cashfree: "Cashfree",
  payu: "PayU",
  phonepe: "PhonePe",
  paytm: "Paytm",
  ccavenue: "CCAvenue",
  easebuzz: "Easebuzz",
};

/** "Online (PayU)", "Cash", … for a payment record. */
export const paymentModeLabel = (payment) =>
  payment?.gateway ? `Online (${GATEWAY_LABEL[payment.gateway] || payment.gateway})` : MODE_LABEL[payment?.paymentMode] || payment?.paymentMode || "—";

const loadScript = (src, globalName) =>
  new Promise((resolve) => {
    if (window[globalName]) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(Boolean(window[globalName]));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const postForm = ({ action, method = "POST", fields = {} }) => {
  const form = document.createElement("form");
  form.method = method;
  form.action = action;
  form.style.display = "none";
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
};

/**
 * What was chosen, kept across the trip to a gateway's own page so the receipt shown on return
 * can name the installments. Display only — the server decides what was paid.
 */
const CHECKOUT_MEMO_KEY = "fee-checkout-rows";

export const rememberCheckoutRows = (paymentId, rows) => {
  try {
    sessionStorage.setItem(
      CHECKOUT_MEMO_KEY,
      JSON.stringify({ paymentId: String(paymentId), rows: rows.map((r) => ({ _id: r._id, feeHeadName: r.feeHeadName, installmentName: r.installmentName })) })
    );
  } catch {
    /* storage unavailable — the receipt just shows generic labels */
  }
};

export const recallCheckoutRows = (paymentId) => {
  try {
    const memo = JSON.parse(sessionStorage.getItem(CHECKOUT_MEMO_KEY) || "null");
    sessionStorage.removeItem(CHECKOUT_MEMO_KEY);
    return memo && memo.paymentId === String(paymentId) ? memo.rows : [];
  } catch {
    return [];
  }
};

/**
 * Pays the chosen installments through whichever gateway the school has active.
 *
 * The server fixes the amount (everything the installments owe today, fines included), ties the
 * checkout to a pending payment, and tells us how this gateway's checkout opens:
 *   razorpay — popup on this page; resolves with the verified result
 *   cashfree — Cashfree's SDK takes the payer to its page
 *   form     — a signed form is posted to the gateway (PayU, Paytm, CCAvenue)
 *   redirect — the payer is sent to the gateway's URL (PhonePe, Easebuzz)
 * For the last three the payer comes back to the fee page, which confirms with the server
 * (see StudentFeeLedger).
 *
 * Resolves with { state, payment } after a popup, { redirecting: true } when leaving the page, or
 * null if nothing happened.
 */
export const useOnlineFeeCheckout = () => {
  const dispatch = useDispatch();
  const [paying, setPaying] = useState(false);

  const payOnline = useCallback(
    async ({ studentId, installmentIds, rows = [], description, prefill }) => {
      setPaying(true);
      let leavingPage = false;
      try {
        const init = await dispatch(createPayment({ studentId, installmentIds, paymentMode: "gateway" })).unwrap();
        const { paymentId, checkout, gatewayLabel } = init?.data || {};
        rememberCheckoutRows(paymentId, rows);

        if (checkout?.type === "razorpay") {
          if (!(await loadScript("https://checkout.razorpay.com/v1/checkout.js", "Razorpay"))) {
            message.error("Could not load the Razorpay payment window. Check your connection and try again.");
            return null;
          }
          const confirm = async () => (await dispatch(verifyPayment({ paymentId })).unwrap())?.data;

          return await new Promise((resolve) => {
            const rz = new window.Razorpay({
              key: checkout.keyId,
              amount: checkout.amount,
              currency: checkout.currency || "INR",
              order_id: checkout.orderId,
              notes: checkout.notes,
              name: "School Fee Payment",
              description: description || "Fee payment",
              prefill,
              // Razorpay checkout runs in its own iframe without our CSS variables — must stay a literal hex.
              theme: { color: "#2563EB" },
              handler: async () => {
                try {
                  resolve(await confirm());
                } catch (err) {
                  message.error(getErrorMessage(err, "Could not confirm the payment. It will update automatically once the gateway confirms it."));
                  resolve(null);
                }
              },
              // Closed without the success handler — ask anyway, in case it went through.
              modal: { ondismiss: () => confirm().then((r) => resolve(r?.state === "paid" ? r : null)).catch(() => resolve(null)) },
            });
            // The popup stays open after a failed attempt so the payer can retry; a later success
            // still lands in `handler` — so only report it here.
            rz.on("payment.failed", (resp) => message.error(resp?.error?.description || "Payment failed — you can try again"));
            rz.open();
          });
        }

        if (checkout?.type === "cashfree") {
          if (!(await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js", "Cashfree"))) {
            message.error("Could not load the Cashfree payment page. Check your connection and try again.");
            return null;
          }
          leavingPage = true;
          window.Cashfree({ mode: checkout.mode }).checkout({ paymentSessionId: checkout.paymentSessionId, redirectTarget: "_self" });
          return { redirecting: true };
        }

        if (checkout?.type === "form") {
          leavingPage = true;
          message.loading(`Taking you to ${gatewayLabel || "the payment page"}…`, 0);
          postForm(checkout);
          return { redirecting: true };
        }

        if (checkout?.type === "redirect" && checkout.url) {
          leavingPage = true;
          message.loading(`Taking you to ${gatewayLabel || "the payment page"}…`, 0);
          window.location.assign(checkout.url);
          return { redirecting: true };
        }

        message.error("This payment gateway is not supported on this screen.");
        return null;
      } catch (err) {
        message.error(getErrorMessage(err, "Online payment failed"));
        return null;
      } finally {
        if (!leavingPage) setPaying(false);
      }
    },
    [dispatch]
  );

  return { payOnline, paying };
};
