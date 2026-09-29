const TYPE_PREFIXES = {
  "Transfer Certificate": "TC",
  "Bonafide Certificate": "BC",
  "Character Certificate": "CC",
  "Study Certificate": "SC",
};

export const getCertificatePrefix = (certificateType) => TYPE_PREFIXES[certificateType] || "CERT";

/**
 * A certificate number in the "PREFIX/YEAR/NNNN" house format, from a number an atomic counter
 * handed out — see formatCardNumber for why it is no longer derived from the last one issued.
 */
export function formatCertificateNumber(seq, { prefix, year = new Date().getFullYear(), digits = 4 } = {}) {
  return `${prefix}/${year}/${String(seq).padStart(digits, "0")}`;
}
