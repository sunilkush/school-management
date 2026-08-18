import { useState } from "react";
import { Button, message } from "antd";
import { CreditCardOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { createRazorpayOrder, verifyRazorpayPayment } from "../features/superAdminBillingSlice";

/**
 * Usage:
 *   <RazorpayButton invoiceId={invoice._id} invoiceNumber={invoice.invoiceNumber} amount={invoice.totalAmount} onSuccess={() => refetch()} />
 */
const RazorpayButton = ({ invoiceId, invoiceNumber, amount, onSuccess }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Step 1: Create Razorpay order on backend
      const orderRes = await dispatch(createRazorpayOrder({ invoiceId })).unwrap();

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderRes.keyId,
        amount: orderRes.amount,
        currency: orderRes.currency || "INR",
        name: "EduManage",
        description: `Invoice ${orderRes.invoiceNumber || invoiceNumber}`,
        order_id: orderRes.orderId,
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            await dispatch(verifyRazorpayPayment({
              invoiceId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })).unwrap();
            message.success("Payment successful! Invoice marked as paid.");
            onSuccess?.();
          } catch {
            message.error("Payment verification failed. Contact support.");
          }
        },
        prefill: {
          name: orderRes.schoolName || "",
        },
        theme: { color: "#2563EB" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      if (!window.Razorpay) {
        // Dynamically load Razorpay script if not already loaded
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
          document.body.appendChild(script);
        });
      }

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp) => {
        message.error(`Payment failed: ${resp.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      message.error(typeof err === "string" ? err : "Could not initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      icon={<CreditCardOutlined />}
      loading={loading}
      onClick={handlePay}
      style={{
        background: "linear-gradient(135deg, var(--primary), var(--info))",
        border: "none",
        borderRadius: 8,
        fontWeight: 600,
      }}
    >
      Pay ₹{amount?.toLocaleString("en-IN")} via Razorpay
    </Button>
  );
};

export default RazorpayButton;
