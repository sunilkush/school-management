// utils/registration.js (ES module)
export function generateNextRegNumber(
  lastRegNumber,
  { prefix = "REG", year = new Date().getFullYear(), digits = 3 } = {}
) {
  const yearStr = String(year);
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  let nextNumber = 1;

  if (lastRegNumber && typeof lastRegNumber === "string") {
    // Match only if prefix+year part is same
    const regex = new RegExp(`^${escapedPrefix}${yearStr}(\\d+)$`);
    const match = lastRegNumber.match(regex);

    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    } else {
      // Different academic year → reset to 1
      nextNumber = 1;
    }
  }

  const padded = String(nextNumber).padStart(digits, "0");
  return `${prefix}${yearStr}${padded}`;
}
