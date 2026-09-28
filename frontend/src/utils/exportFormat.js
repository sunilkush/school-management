/**
 * Shared helpers for the app's CSV downloads and print windows.
 *
 * CSV: every export used to build its own lines. Some did not quote at all (a comma in a remark
 * shifted every column after it), most quoted without doubling inner quotes (a " in a value broke
 * the line), several wrote "undefined" for empty cells, none marked the file as UTF-8 (Excel showed
 * Hindi names as garbage), and none guarded against formula injection (a value starting with = + -
 * or @ is run as a formula when the file is opened in Excel).
 *
 * HTML: print windows opened with window.open() + document.write() run in the app's own origin, so
 * text written into them unescaped runs as markup there.
 */

// A leading = + - @ (or tab / carriage return) makes Excel / Sheets treat the cell as a formula.
// Prefixing a quote keeps it text. Plain numbers are left alone so they stay numbers.
const FORMULA_START = /^[=+\-@\t\r]/;

export const csvCell = (value) => {
  if (value === null || value === undefined) return '""';
  let text = String(value);
  if (FORMULA_START.test(text) && !/^[+-]?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

/** rows: array of arrays (the first is usually the header). */
export const toCsv = (rows) => rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

/** Downloads rows as a UTF-8 CSV that Excel opens correctly (BOM included). */
export const downloadCsv = (filename, rows) => {
  const blob = new Blob(["﻿" + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes text for writing into an HTML string (print windows). */
export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
