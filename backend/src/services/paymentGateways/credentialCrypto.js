import crypto from "crypto";

/**
 * Gateway merchant credentials are stored encrypted (AES-256-GCM). A leaked database dump must
 * not hand anyone every school's gateway keys.
 *
 * The key comes from PAYMENT_CREDENTIALS_KEY. Changing that variable makes every stored
 * credential unreadable — schools would have to re-enter their keys — so set it once and keep it.
 */
const resolveKey = () => {
  const configured = process.env.PAYMENT_CREDENTIALS_KEY;
  if (configured) return crypto.createHash("sha256").update(configured).digest();

  if (process.env.NODE_ENV === "production") {
    throw new Error("PAYMENT_CREDENTIALS_KEY is not set — payment gateway credentials cannot be stored or read");
  }
  // Development only: a stable key so local setups work without extra configuration.
  return crypto.createHash("sha256").update("school-management:dev-only:payment-credentials").digest();
};

export const encryptCredentials = (values) => {
  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(values || {}), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${data.toString("base64")}`;
};

export const decryptCredentials = (stored) => {
  if (!stored) return {};
  const [version, iv, tag, data] = String(stored).split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unrecognised credential format");

  const decipher = crypto.createDecipheriv("aes-256-gcm", resolveKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plain = Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
  return JSON.parse(plain);
};
