import mongoose from "mongoose";
import { GATEWAY_PROVIDERS } from "../services/paymentGateways/providers.js";

/**
 * One online payment gateway a school has configured for collecting fees — Razorpay, Cashfree,
 * PayU, PhonePe, Paytm, CCAvenue or Easebuzz. Money goes straight into that school's own merchant
 * account; the platform never holds it.
 *
 * A school may keep several configured (switching back does not mean re-entering keys) but only
 * one is ever active: parents can only pay through the active one, and the partial unique index
 * below makes a second active record impossible at the database level, not just in the UI.
 */
const schoolPaymentGatewaySchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true, index: true },

    provider: { type: String, enum: GATEWAY_PROVIDERS, required: true },

    // "test" talks to the gateway's sandbox, "live" to production. Razorpay ignores this — its
    // keys themselves are test or live.
    mode: { type: String, enum: ["test", "live"], default: "test" },

    // The merchant credentials, AES-256-GCM encrypted (services/paymentGateways/credentialCrypto.js).
    // Never selected by default and never returned to a client; the API reports only which
    // fields are filled in.
    credentials: { type: String, default: null, select: false },

    // Non-secret fields shown back in the settings form (Razorpay Key ID, Paytm MID, …).
    publicValues: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Which credential fields have a value, so the form can say "saved" without reading secrets.
    filledFields: { type: [String], default: [] },

    isActive: { type: Boolean, default: false },

    lastTest: {
      ok: { type: Boolean },
      message: { type: String },
      at: { type: Date },
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    activatedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false }
);

schoolPaymentGatewaySchema.index({ schoolId: 1, provider: 1 }, { unique: true });

// At most one active gateway per school.
schoolPaymentGatewaySchema.index(
  { schoolId: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: "one_active_gateway_per_school" }
);

export const SchoolPaymentGateway = mongoose.model("SchoolPaymentGateway", schoolPaymentGatewaySchema);
