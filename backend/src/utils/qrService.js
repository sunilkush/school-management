import QRCode from "qrcode";

/**
 * Generates a QR code as a PNG buffer, suitable for embedding directly into a pdfkit document
 * via doc.image(). Pure local computation (no network call, no missing-config failure mode), so
 * unlike the Twilio/SMTP services this has no lazy-init/skip path — it just works.
 */
export const generateQrBuffer = (text, size = 180) =>
  QRCode.toBuffer(text, { type: "png", margin: 1, width: size });
