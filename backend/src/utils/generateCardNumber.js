const HOLDER_PREFIXES = {
  Student: "SID",
  Employee: "EID",
};

export const getCardPrefix = (holderType) => HOLDER_PREFIXES[holderType] || "ID";

export function generateNextCardNumber(
  lastCardNumber,
  { prefix, year = new Date().getFullYear(), digits = 4 } = {}
) {
  const yearStr = String(year);
  let nextNumber = 1;

  if (lastCardNumber && typeof lastCardNumber === "string") {
    const regex = new RegExp(`^${prefix}/${yearStr}/(\\d+)$`);
    const match = lastCardNumber.match(regex);
    if (match) nextNumber = parseInt(match[1], 10) + 1;
  }

  return `${prefix}/${yearStr}/${String(nextNumber).padStart(digits, "0")}`;
}
