/**
 * Code 128 (subset B) encoder — returns bar/space widths, ready to draw as rectangles.
 *
 * Written rather than pulled in as a dependency: the only thing needed here is turning a card
 * number into bar widths, and a barcode is one of those things that looks completely fine when
 * it is wrong. A mistranscribed pattern produces a neat row of bars that simply will not scan,
 * and nobody finds out until a card is in a reader. tests/unit/code128.test.js checks the table
 * against Code 128's own structural rules for exactly that reason.
 */

/**
 * The 107 symbol patterns. Each is six digits: bar, space, bar, space, bar, space — in modules.
 * The last entry (the stop symbol) has a seventh digit, its extra terminating bar.
 */
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312",
  "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222",
  "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131",
  "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321",
  "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121",
  "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321",
  "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224",
  "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114",
  "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112",
  "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113",
  "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412",
  "211214", "211232", "2331112",
];

/** Subset B starts at 104; every character is its ASCII code minus 32. */
const START_B = 104;
const STOP = 106;

export const CODE128 = { PATTERNS, START_B, STOP };

/** Subset B covers ASCII 32–126. Anything else cannot be represented. */
export const isEncodable = (value) =>
  typeof value === "string" &&
  value.length > 0 &&
  [...value].every((ch) => ch.charCodeAt(0) >= 32 && ch.charCodeAt(0) <= 126);

/**
 * Encodes to alternating bar/space widths, starting with a bar.
 *
 * Returns null rather than throwing for anything it cannot represent: a card whose number has an
 * odd character should still print, just without a barcode, instead of failing the whole PDF.
 */
export const encodeCode128B = (value) => {
  if (!isEncodable(value)) return null;

  const codes = [START_B, ...[...value].map((ch) => ch.charCodeAt(0) - 32)];

  // Checksum: the start value plus each data value weighted by its 1-based position, mod 103.
  let checksum = START_B;
  for (let i = 1; i < codes.length; i += 1) checksum += codes[i] * i;
  codes.push(checksum % 103);
  codes.push(STOP);

  const widths = [];
  for (const code of codes) {
    for (const digit of PATTERNS[code]) widths.push(Number(digit));
  }

  return {
    widths,
    // Quiet zones are part of the symbol, not decoration — a scanner needs clear space at both
    // ends to find the edges at all. Ten modules is the specified minimum.
    quietModules: 10,
    totalModules: widths.reduce((sum, w) => sum + w, 0) + 20,
  };
};

/**
 * Draws the barcode into a PDFKit document, fitted to a box.
 *
 * Bars are drawn at whole-module widths derived from the box, so every bar in one symbol keeps
 * the same proportion — a scanner reads the ratios between bars, not their absolute size.
 */
export const drawCode128 = (doc, value, { x, y, width, height, color = "#000000" }) => {
  const encoded = encodeCode128B(value);
  if (!encoded) return false;

  const moduleWidth = width / encoded.totalModules;
  let cursor = x + encoded.quietModules * moduleWidth;
  let isBar = true;

  doc.save();
  encoded.widths.forEach((moduleCount) => {
    const barWidth = moduleCount * moduleWidth;
    if (isBar) doc.rect(cursor, y, barWidth, height).fill(color);
    cursor += barWidth;
    isBar = !isBar;
  });
  doc.restore();

  return true;
};
