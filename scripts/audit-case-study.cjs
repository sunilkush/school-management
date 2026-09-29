/**
  *   node scripts/audit-case-study.cjs
 *
 * Measures the finished PDF's layout, since nothing on this machine can render it.
 *
 * Every text run carries a position (Tm), a font and a size. Pulling those out and measuring each
 * string with the same metrics PDFKit used gives a real bounding box for every run — enough to
 * answer what a visual check would: is anything clipped at the right margin, has anything fallen
 * off the page, is anything printed on top of anything else.
 *
 * ── Three things the first version of this got wrong ──────────────────────────────────────────
 *
 * They are worth naming, because each produced confident false alarms:
 *
 *   FONT      Measuring every run with Helvetica-Bold "to be conservative" over-estimates regular
 *             body text by about 5%, which on a 480pt line is 25pt — reported as an overflow that
 *             does not exist. The font is now read from the page's resource dictionary.
 *
 *   BASELINE  PDFKit's Tm sets the BASELINE, not the top of the glyph box. Treating it as the top
 *             makes every line appear to overlap the one below it. The box now runs from
 *             baseline − ascent to baseline + descent.
 *
 *   FOOTER    It sits below the text margin on purpose, so counting it made every page "103%
 *             filled". It is excluded from the fill figure and allowed its own band.
 */

const fs = require("fs");
const zlib = require("zlib");
const PDFDocument = require("../backend/node_modules/pdfkit");

const FILE = require("path").join(__dirname, "..", "EduManage-Case-Study.pdf");
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 56;
const FOOTER_TOP = PAGE_H - 46; // anything below this is the footer band

const raw = fs.readFileSync(FILE);
const latin = raw.toString("latin1");

/* ── which /Fn is which typeface ── */
const fontOf = {};
for (const m of latin.matchAll(/\/(F\d+)\s+\d+\s+0\s+R/g)) fontOf[m[1]] = null;
{
  // Objects look like: << /Type /Font /BaseFont /Helvetica-Bold … >>
  const objs = [...latin.matchAll(/(\d+)\s+0\s+obj([\s\S]*?)endobj/g)];
  const byNum = new Map(objs.map((o) => [o[1], o[2]]));
  for (const m of latin.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
    const body = byNum.get(m[2]) || "";
    const base = body.match(/\/BaseFont\s*\/([A-Za-z-]+)/);
    if (base) fontOf[m[1]] = base[1];
  }
}

const streams = [];
for (let i = 0; (i = latin.indexOf("stream", i)) !== -1; i += 6) {
  if (latin.startsWith("endstream", i - 3)) continue;
  let start = i + 6;
  if (latin[start] === "\r") start += 1;
  if (latin[start] === "\n") start += 1;
  const end = latin.indexOf("endstream", start);
  if (end > start) streams.push(raw.subarray(start, end));
}

const hex = (h) => Buffer.from(h.replace(/[^0-9a-fA-F]/g, ""), "hex").toString("latin1");

const meter = new PDFDocument({ size: "A4" });
const widthOf = (text, font, size) => {
  meter.font(font || "Helvetica").fontSize(size);
  return meter.widthOfString(text);
};

const pages = [];
for (const s of streams) {
  let body;
  try {
    body = zlib.inflateSync(s).toString("latin1");
  } catch {
    continue;
  }
  if (!body.includes("BT")) continue;

  const runs = [];
  let size = 10;
  let font = "Helvetica";
  let x = 0;
  let yUp = 0;

  for (const line of body.split("\n")) {
    let m;
    if ((m = line.match(/\/(F\d+)\s+([\d.]+)\s+Tf/))) {
      font = fontOf[m[1]] || "Helvetica";
      size = parseFloat(m[2]);
    }
    if ((m = line.match(/1 0 0 1 ([\d.-]+) ([\d.-]+) Tm/))) {
      x = parseFloat(m[1]);
      yUp = parseFloat(m[2]);
    }
    if (line.includes("TJ") || line.includes("Tj")) {
      let text = "";
      for (const h of line.matchAll(/<([0-9a-fA-F\s]*)>/g)) text += hex(h[1]);
      if (!text.trim()) continue;
      const baseline = PAGE_H - yUp; // distance from the top of the page
      runs.push({
        text,
        font,
        size,
        x,
        w: widthOf(text, font, size),
        // Helvetica: ascent ≈ 0.718 em, descent ≈ 0.207 em.
        top: baseline - size * 0.718,
        bottom: baseline + size * 0.207,
      });
    }
  }
  if (runs.length) pages.push(runs);
}

let bad = 0;
const fail = (msg) => {
  bad += 1;
  console.log("  FAIL  " + msg);
};

console.log(`Fonts: ${Object.entries(fontOf).map(([k, v]) => `${k}=${v}`).join("  ")}`);
console.log(`Measured ${pages.length} pages, ${pages.reduce((n, p) => n + p.length, 0)} text runs\n`);

pages.forEach((runs, i) => {
  console.log(`── page ${i + 1} · ${runs.length} runs ──`);

  const over = runs.filter((r) => r.x + r.w > PAGE_W - M + 1);
  if (over.length) {
    over.slice(0, 4).forEach((r) =>
      fail(`past the right margin by ${(r.x + r.w - (PAGE_W - M)).toFixed(1)}pt: "${r.text.slice(0, 50)}"`)
    );
  } else console.log("  PASS  nothing clipped at the right margin");

  const above = runs.filter((r) => r.top < M - 3);
  const below = runs.filter((r) => r.bottom > PAGE_H - 24);
  [...above, ...below].slice(0, 3).forEach((r) =>
    fail(`outside the page: "${r.text.slice(0, 40)}" (top ${r.top.toFixed(0)}, bottom ${r.bottom.toFixed(0)})`)
  );
  if (!above.length && !below.length) console.log("  PASS  everything inside the page");

  const sorted = [...runs].sort((a, b) => a.top - b.top);
  let overlaps = 0;
  for (let a = 0; a < sorted.length; a += 1) {
    for (let b = a + 1; b < sorted.length; b += 1) {
      const A = sorted[a];
      const B = sorted[b];
      if (B.top >= A.bottom - 0.5) break;
      if (A.x < B.x + B.w - 1 && B.x < A.x + A.w - 1) {
        overlaps += 1;
        if (overlaps <= 3) fail(`overlapping text: "${A.text.slice(0, 26)}" / "${B.text.slice(0, 26)}"`);
      }
    }
  }
  if (!overlaps) console.log("  PASS  no text printed over other text");
  else if (overlaps > 3) console.log(`        …and ${overlaps - 3} more`);

  const bodyRuns = runs.filter((r) => r.top < FOOTER_TOP);
  const lowest = Math.max(...bodyRuns.map((r) => r.bottom));
  const fill = Math.round(((lowest - M) / (PAGE_H - M - 46 - M)) * 100);
  console.log(`  ${fill >= 50 ? "PASS" : "NOTE"}  ${fill}% of the text area used (lowest body text at y=${Math.round(lowest)})`);

  console.log();
});

console.log(bad ? `${bad} layout problem(s)` : "Layout measures clean — margins, page bounds and overlap all check out.");
process.exit(bad ? 1 : 0);
