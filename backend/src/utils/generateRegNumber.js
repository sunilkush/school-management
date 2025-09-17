// utils/registration.js (ES module)
export function generateNextRegNumber(lastRegNumber, options = {}) {
  const {
    prefix = "REG",
    year = new Date().getFullYear(),
    digits = 4,
  } = options;

  const yearStr = String(year);
  const escapedPrefix = String(prefix).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let nextNumber = 1;

  if (lastRegNumber && typeof lastRegNumber === "string") {
    // try exact match for prefix + year + number (safe because prefix is escaped)
    const regex = new RegExp(`^${escapedPrefix}${yearStr}(\\d+)$`);
    const match = lastRegNumber.match(regex);
    console.log(match)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    } else {
      // If lastRegNumber exists but doesn't match this year's pattern,
      // we intentionally start from 1 for the new year/format (safer).
      nextNumber = 1;
    }
  }

  const padded = String(nextNumber).padStart(digits, "0");
  return `${prefix}${yearStr}${padded}`;
}
