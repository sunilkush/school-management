import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Button, message, Descriptions } from "antd";
import { CreditCardOutlined, DownloadOutlined, CrownOutlined } from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles";
import apiClient from "../../../api/httpClient";
import {
  fetchMySubscription,
  fetchMyInvoices,
  createMyPaymentIntent,
  verifyMyPayment,
} from "../../../features/schoolBillingSlice";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

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
  const { subscription, invoices, loading, paying } = useSelector((s) => s.schoolBilling || {});

  const refresh = () => {
    dispatch(fetchMySubscription());
    dispatch(fetchMyInvoices());
  };

  useEffect(() => { refresh(); }, [dispatch]);

  const handlePay = async (invoice) => {
    const loaded = await loadRazorpay();
    if (!loaded) { message.error("Razorpay SDK failed to load"); return; }

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
            await dispatch(verifyMyPayment({
              invoiceId: invoice._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            message.success("Payment successful — invoice marked paid");
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

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("my-sub-invoices-tbl")}</style>
      <PageHeader title="My Subscription" subtitle="View your school's plan and pay subscription invoices" icon={<CrownOutlined />} />

      {subscription && (
        <div style={{ ...sectionPanel, marginTop: 16 }}>
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

      <div style={sectionPanel}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
          <RupeeIcon style={{ marginRight: 6 }} />
          Invoices
        </div>
        <Table
          className="my-sub-invoices-tbl"
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
