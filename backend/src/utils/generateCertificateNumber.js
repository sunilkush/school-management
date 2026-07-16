const TYPE_PREFIXES = {
  "Transfer Certificate": "TC",
  "Bonafide Certificate": "BC",
  "Character Certificate": "CC",
  "Study Certificate": "SC",
};

export const getCertificatePrefix = (certificateType) => TYPE_PREFIXES[certificateType] || "CERT";

export function generateNextCertificateNumber(
  lastCertificateNumber,
  { prefix, year = new Date().getFullYear(), digits = 4 } = {}
) {
  const yearStr = String(year);
  let nextNumber = 1;

  if (lastCertificateNumber && typeof lastCertificateNumber === "string") {
    const regex = new RegExp(`^${prefix}/${yearStr}/(\\d+)$`);
    const match = lastCertificateNumber.match(regex);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `${prefix}/${yearStr}/${String(nextNumber).padStart(digits, "0")}`;
}
