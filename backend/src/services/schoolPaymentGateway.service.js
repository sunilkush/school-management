import mongoose from "mongoose";
import { SchoolPaymentGateway } from "../models/SchoolPaymentGateway.model.js";
import { School } from "../models/school.model.js";
import { ApiError } from "../utils/ApiError.js";
import { GATEWAY_CATALOG, gatewayLabel } from "./paymentGateways/providers.js";
import { decryptCredentials, encryptCredentials } from "./paymentGateways/credentialCrypto.js";
import { getAdapter } from "./paymentGateways/index.js";

/**
 * A school's online payment gateways: saving credentials, testing them, and switching which one
 * is active. Exactly one can be active at a time — activating one deactivates the rest in the
 * same transaction, and a partial unique index on the model backs that up.
 */

const requiredFields = (provider) => GATEWAY_CATALOG[provider].fields.filter((f) => f.required).map((f) => f.key);

const assertProvider = (provider) => {
  if (!GATEWAY_CATALOG[provider]) throw new ApiError(400, `Unsupported payment gateway: ${provider}`);
};

/**
 * Schools configured Razorpay before gateways were selectable, with the keys in plain text on the
 * School document. The first time such a school's gateways are touched, those keys move into an
 * encrypted gateway record (active if Razorpay was enabled) and are removed from the School.
 */
export const migrateLegacyRazorpay = async (schoolId) => {
  if (await SchoolPaymentGateway.exists({ schoolId })) return;

  const school = await School.findById(schoolId).select("+razorpay.keyId +razorpay.keySecret +razorpay.webhookSecret razorpay.isEnabled").lean();
  const legacy = school?.razorpay;
  if (!legacy?.keyId || !legacy?.keySecret) return;

  const values = { keyId: legacy.keyId, keySecret: legacy.keySecret, webhookSecret: legacy.webhookSecret || "" };
  try {
    await SchoolPaymentGateway.create({
      schoolId,
      provider: "razorpay",
      mode: String(legacy.keyId).startsWith("rzp_live_") ? "live" : "test",
      credentials: encryptCredentials(values),
      publicValues: { keyId: legacy.keyId },
      filledFields: Object.keys(values).filter((k) => values[k]),
      isActive: Boolean(legacy.isEnabled),
      activatedAt: legacy.isEnabled ? new Date() : null,
    });
  } catch (err) {
    if (err?.code !== 11000) throw err; // another request migrated it first
  }
  await School.updateOne(
    { _id: schoolId },
    { $unset: { "razorpay.keySecret": "", "razorpay.webhookSecret": "" }, $set: { "razorpay.isEnabled": false } }
  );
};

const withCredentials = (record) => ({
  provider: record.provider,
  mode: record.mode,
  record,
  creds: decryptCredentials(record.credentials),
});

/** The school's active gateway with decrypted credentials, or null when online payment is not set up. */
export const getActiveGateway = async (schoolId) => {
  await migrateLegacyRazorpay(schoolId);
  const record = await SchoolPaymentGateway.findOne({ schoolId, isActive: true }).select("+credentials");
  return record ? withCredentials(record) : null;
};

/**
 * A specific gateway of the school, active or not. Settling a checkout uses the gateway it was
 * started on, even if the school has switched since — that money is in that account.
 */
export const getGatewayForSettlement = async (schoolId, provider) => {
  await migrateLegacyRazorpay(schoolId);
  const record = await SchoolPaymentGateway.findOne({ schoolId, provider }).select("+credentials");
  if (!record) throw new ApiError(404, `${gatewayLabel(provider)} is not configured for this school`);
  return withCredentials(record);
};

/** What the settings screen shows: every supported gateway, and the school's saved state of each — never secrets. */
export const listSchoolGateways = async (schoolId) => {
  await migrateLegacyRazorpay(schoolId);
  const records = await SchoolPaymentGateway.find({ schoolId }).lean();
  const byProvider = new Map(records.map((r) => [r.provider, r]));

  return Object.entries(GATEWAY_CATALOG).map(([provider, meta]) => {
    const r = byProvider.get(provider);
    return {
      provider,
      label: meta.label,
      checkout: meta.checkout,
      usesMode: meta.usesMode,
      docsUrl: meta.docsUrl,
      fields: meta.fields,
      configured: Boolean(r),
      complete: Boolean(r) && requiredFields(provider).every((k) => r.filledFields?.includes(k)),
      isActive: Boolean(r?.isActive),
      mode: r?.mode || "test",
      publicValues: r?.publicValues || {},
      filledFields: r?.filledFields || [],
      lastTest: r?.lastTest || null,
      activatedAt: r?.activatedAt || null,
      updatedAt: r?.updatedAt || null,
    };
  });
};

/**
 * Saves a gateway's credentials. Secret fields left blank keep their saved value, so the form
 * never has to show a secret to let someone change the mode or a public field.
 */
export const saveGatewayCredentials = async ({ schoolId, provider, mode, values = {}, userId }) => {
  assertProvider(provider);
  await migrateLegacyRazorpay(schoolId);

  const meta = GATEWAY_CATALOG[provider];
  const existing = await SchoolPaymentGateway.findOne({ schoolId, provider }).select("+credentials");
  const current = existing ? decryptCredentials(existing.credentials) : {};

  const next = { ...current };
  for (const field of meta.fields) {
    const given = values[field.key];
    if (given === undefined || given === null) continue;
    const trimmed = String(given).trim();
    if (field.secret && trimmed === "") continue; // blank secret = keep
    next[field.key] = trimmed;
  }

  const filledFields = meta.fields.map((f) => f.key).filter((k) => next[k]);
  const publicValues = Object.fromEntries(meta.fields.filter((f) => !f.secret).map((f) => [f.key, next[f.key] || ""]));

  // Changing keys on the active gateway is fine, but it must stay usable.
  if (existing?.isActive && !requiredFields(provider).every((k) => filledFields.includes(k))) {
    throw new ApiError(400, `${meta.label} is active — all required fields must stay filled in`);
  }

  const nextMode = mode === "live" ? "live" : "test";
  const unchanged = existing && JSON.stringify(current) === JSON.stringify(next) && existing.mode === nextMode;

  const doc = await SchoolPaymentGateway.findOneAndUpdate(
    { schoolId, provider },
    {
      $set: { mode: nextMode, credentials: encryptCredentials(next), publicValues, filledFields, updatedBy: userId || null },
      $setOnInsert: { schoolId, provider, isActive: false },
      // Changed credentials or mode have not been tested yet.
      ...(unchanged ? {} : { $unset: { lastTest: "" } }),
    },
    { new: true, upsert: true }
  ).lean();

  return doc;
};

export const testGateway = async ({ schoolId, provider }) => {
  assertProvider(provider);
  const record = await SchoolPaymentGateway.findOne({ schoolId, provider }).select("+credentials");
  if (!record) throw new ApiError(404, `Save ${gatewayLabel(provider)} credentials first`);

  const missing = requiredFields(provider).filter((k) => !record.filledFields.includes(k));
  if (missing.length) throw new ApiError(400, `Fill in: ${missing.join(", ")}`);

  const { creds, mode } = withCredentials(record);
  let result;
  try {
    result = await getAdapter(provider).testCredentials({ creds, mode });
  } catch (err) {
    result = { ok: false, message: err.message };
  }

  record.lastTest = { ok: Boolean(result.ok), message: String(result.message || "").slice(0, 300), at: new Date() };
  await record.save();
  return record.lastTest;
};

/** Makes this gateway the school's only active one. */
export const activateGateway = async ({ schoolId, provider, userId }) => {
  assertProvider(provider);
  const record = await SchoolPaymentGateway.findOne({ schoolId, provider });
  if (!record) throw new ApiError(404, `Save ${gatewayLabel(provider)} credentials first`);

  const missing = requiredFields(provider).filter((k) => !record.filledFields.includes(k));
  if (missing.length) throw new ApiError(400, `${gatewayLabel(provider)} is missing: ${missing.join(", ")}`);

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Deactivate first: the partial unique index would reject a second active record.
      await SchoolPaymentGateway.updateMany(
        { schoolId, provider: { $ne: provider }, isActive: true },
        { $set: { isActive: false, updatedBy: userId || null } },
        { session }
      );
      await SchoolPaymentGateway.updateOne(
        { _id: record._id },
        { $set: { isActive: true, activatedAt: new Date(), updatedBy: userId || null } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return listSchoolGateways(schoolId);
};

/** Turns online payment off for the school (the gateway's credentials stay saved). */
export const deactivateGateway = async ({ schoolId, provider, userId }) => {
  assertProvider(provider);
  await SchoolPaymentGateway.updateOne({ schoolId, provider }, { $set: { isActive: false, updatedBy: userId || null } });
  return listSchoolGateways(schoolId);
};
