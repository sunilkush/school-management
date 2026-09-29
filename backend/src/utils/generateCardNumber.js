const HOLDER_PREFIXES = {
  Student: "SID",
  Employee: "EID",
};

export const getCardPrefix = (holderType) => HOLDER_PREFIXES[holderType] || "ID";

/**
 * A card number in the "PREFIX/YEAR/NNNN" house format, from a number an atomic counter handed
 * out. It used to be derived by parsing the last card number and adding one, which gave the same
 * number to cards issued at the same moment; the callers now allocate first and format here.
 */
export function formatCardNumber(seq, { prefix, year = new Date().getFullYear(), digits = 4 } = {}) {
  return `${prefix}/${year}/${String(seq).padStart(digits, "0")}`;
}
