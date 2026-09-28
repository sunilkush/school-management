/**
 * CSV cells and files the way spreadsheets expect them. Mirrors frontend/src/utils/exportFormat.js.
 *
 * - Every cell is quoted, with inner quotes doubled, so commas and quotes cannot break a row.
 * - Text starting with = + - @ (or tab / CR) gets a leading quote: Excel and Sheets otherwise run it
 *   as a formula when the file is opened. Names, remarks and emails in these exports are typed by
 *   users, so this is the difference between a report and a way to attack whoever opens it.
 *   Plain numbers, including negatives, are left as numbers.
 * - Files start with a UTF-8 BOM so Excel reads Hindi (and any non-ASCII) text correctly.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER = /^[+-]?\d+(\.\d+)?$/;

export const csvCell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text) && !PLAIN_NUMBER.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const toCsv = (rows) => "﻿" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
