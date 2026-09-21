import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Table, Tag, Button, message, Descriptions } from "antd";
import { CreditCardOutlined, DownloadOutlined, CrownOutlined, FileAddOutlined } from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import PageHeader from "../../../components/layout/PageHeader";
import apiClient from "../../../api/httpClient";
import {
  fetchMySubscription,
  fetchMyInvoices,
  createMyPaymentIntent,
  verifyMyPayment,
} from "../../../features/schoolBillingSlice";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const day = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const sameMoment = (a, b) => a && b && Math.abs(new Date(a) - new Date(b)) < 60 * 1000;
const OPEN = ["draft", "unpaid", "overdue"];
/** A plan this close to its end can ask for its renewal invoice (the server allows the same). */
const RENEWAL_WINDOW_DAYS = 30;

const STATUS_COLOR = {
  active: "success", trial: "processing", expired: "error", cancelled: "default", suspended: "warning",
  paid: "success", unpaid: "warning", overdue: "error", draft: "default",
};

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const MySubscription = () => {
  const dispatch = useDispatch();
  const { subscription, invoices = [], loading, paying } = useSelector((s) => s.schoolBilling || {});
  const [asking, setAsking] = useState(false);
  const [reopenedUntil, setReopenedUntil] = useState(null);

  const refresh = () => {
    dispatch(fetchMySubscription());
    dispatch(fetchMyInvoices());
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [dispatch]);

  const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
  const expired = Boolean(subscription && (subscription.status === "expired" || (endDate && endDate <= new Date())));
  const blockedByAdmin = ["suspended", "cancelled"].includes(subscription?.status);
  const daysLeft = endDate ? Math.ceil((endDate - Date.now()) / 86400000) : null;

  // The unpaid invoice that renews the plan: one billing the period after it ends, or one made the
  // old way (billing the period that is ending).
  const renewal = subscription && invoices.find((i) => OPEN.includes(i.status) && (
    i.period === "next" ? sameMoment(i.billingPeriodStart, subscription.endDate)
      : !i.period && sameMoment(i.billingPeriodEnd, subscription.endDate)
  ));

  const askForRenewal = async () => {
    setAsking(true);
    try {
      await apiClient.post("/school-billing/renewal-invoice");
      message.success("Renewal invoice ready — pay it below");
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.message || "Could not make the renewal invoice");
    } finally {
      setAsking(false);
    }
  };

  const handlePay = async (invoice) => {
    const loaded = await loadRazorpay();
    if (!loaded) { message.error("Razorpay SDK failed to load"); return; }
    const wasExpired = expired;

    try {
      const order = await dispatch(createMyPaymentIntent(invoice._id)).unwrap();
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Subscription Payment",
        description: `Invoice ${order.invoiceNumber}`,
        handler: async (response) => {
          try {
            const result = await dispatch(verifyMyPayment({
              invoiceId: invoice._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            const until = result?.subscription?.endDate;
            message.success(until ? `Payment received — your plan now runs until ${day(until)}` : "Payment successful — invoice marked paid");
            if (wasExpired && until && new Date(until) > new Date()) setReopenedUntil(until);
            refresh();
          } catch (err) {
            message.error(typeof err === "string" ? err : "Payment verification failed");
          }
        },
        theme: { color: "#2563EB" }, // Razorpay checkout runs in its own iframe/window — literal hex, not a CSS var
      };
      new window.Razorpay(options).open();
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to start payment");
    }
  };

  const handleDownload = (invoice) => {
    apiClient
      .get(`/school-billing/invoices/${invoice._id}/pdf`, { responseType: "blob" })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${invoice.invoiceNumber}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => message.error("Failed to download invoice"));
  };

  const columns = [
    { title: "Invoice No", dataIndex: "invoiceNumber" },
    { title: "Billing Period", render: (_, r) => `${new Date(r.billingPeriodStart).toLocaleDateString("en-IN")} – ${new Date(r.billingPeriodEnd).toLocaleDateString("en-IN")}` },
    { title: "Amount", dataIndex: "totalAmount", render: money },
    { title: "Due Date", dataIndex: "dueDate", render: (v) => new Date(v).toLocaleDateString("en-IN") },
    { title: "Status", dataIndex: "status", render: (v) => <Tag color={STATUS_COLOR[v] || "default"}>{String(v).toUpperCase()}</Tag> },
    {
      title: "Action",
      render: (_, r) =>
        r.status === "paid" ? (
          <Button size="small" icon={<DownloadOutlined />} onClick={() => handleDownload(r)}>Invoice</Button>
        ) : (
          <Button size="small" type="primary" icon={<CreditCardOutlined />} loading={paying} onClick={() => handlePay(r)}>Pay Now</Button>
        ),
    },
  ];

  const renewalAction = renewal ? (
    <Button type="primary" icon={<CreditCardOutlined />} loading={paying} onClick={() => handlePay(renewal)}>
      Pay {money(renewal.totalAmount)}
    </Button>
  ) : (
    <Button type="primary" icon={<FileAddOutlined />} loading={asking} onClick={askForRenewal}>
      Get the renewal invoice
    </Button>
  );

  return (
    <div className="page-wrapper">
      <PageHeader title="My Subscription" subtitle="View your school's plan and pay subscription invoices" icon={<CrownOutlined />} />

      {reopenedUntil ? (
        <Alert
          type="success" showIcon style={{ marginTop: 16 }}
          message={`Your school is open again — the plan runs until ${day(reopenedUntil)}`}
          action={<Button type="primary" onClick={() => window.location.assign("/dashboard/schooladmin")}>Open the dashboard</Button>}
        />
      ) : blockedByAdmin ? (
        <Alert
          type="warning" showIcon style={{ marginTop: 16 }}
          message={`Your school's subscription is ${subscription.status}`}
          description="Please contact the administrator to reopen it."
        />
      ) : expired ? (
        <Alert
          type="error" showIcon style={{ marginTop: 16 }}
          message={`Your plan ended on ${day(subscription.endDate)}`}
          description="Everything except this page is closed for your school until the renewal is paid. Paying renews the plan straight away."
          action={renewalAction}
        />
      ) : subscription && daysLeft != null && daysLeft <= RENEWAL_WINDOW_DAYS ? (
        <Alert
          type="info" showIcon style={{ marginTop: 16 }}
          message={`Your plan ends on ${day(subscription.endDate)} — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`}
          description="Pay the renewal before then to keep the school open without a break."
          action={renewalAction}
        />
      ) : null}

      {subscription && (
        <div className="section-panel" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Current Plan</div>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Plan">{subscription.planId?.name || "—"}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={STATUS_COLOR[subscription.status] || "default"}>{String(subscription.status || "—").toUpperCase()}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Price">{money(subscription.snapshot?.price)}</Descriptions.Item>
            <Descriptions.Item label="Valid Until">{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString("en-IN") : "—"}</Descriptions.Item>
          </Descriptions>
        </div>
      )}

      <div className="section-panel">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          <RupeeIcon style={{ marginRight: 6 }} />
          Invoices
        </div>
        <Table
          className="my-sub-invoices-tbl data-table"
          rowKey="_id"
          columns={columns}
          dataSource={invoices}
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 700 }}
        />
      </div>
    </div>
  );
};

export default MySubscription;
