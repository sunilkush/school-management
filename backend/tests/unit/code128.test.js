import { CODE128, encodeCode128B, isEncodable } from '../../src/utils/code128.js';

/**
 * A barcode is one of those things that looks completely fine when it is wrong — a mistranscribed
 * pattern draws a neat row of bars that simply will not scan, and nobody finds out until a card is
 * held up to a reader.
 *
 * These check the table against Code 128's own structural rules rather than against itself, so a
 * single typo in the 107 patterns is caught here instead of in a school office.
 */

const { PATTERNS, START_B, STOP } = CODE128;

describe('the Code 128 pattern table', () => {
  it('has all 107 symbols', () => {
    expect(PATTERNS).toHaveLength(107);
  });

  it('gives every symbol except the stop 6 elements totalling 11 modules', () => {
    PATTERNS.slice(0, 106).forEach((pattern, value) => {
      expect(`${value}:${pattern.length}`).toBe(`${value}:6`);
      const modules = [...pattern].reduce((sum, d) => sum + Number(d), 0);
      expect(`${value}:${modules}`).toBe(`${value}:11`);
    });
  });

  it('gives the stop symbol its extra terminating bar', () => {
    // The stop pattern is the one exception: 7 elements, 13 modules.
    expect(PATTERNS[STOP]).toHaveLength(7);
    expect([...PATTERNS[STOP]].reduce((sum, d) => sum + Number(d), 0)).toBe(13);
  });

  it('keeps every symbol an even number of bar modules', () => {
    // Code 128's own parity rule: the three bars of a symbol always total an even width. A single
    // mistyped digit almost always breaks this, which is what makes it worth asserting.
    PATTERNS.slice(0, 106).forEach((pattern, value) => {
      const bars = Number(pattern[0]) + Number(pattern[2]) + Number(pattern[4]);
      expect(`${value}:${bars % 2}`).toBe(`${value}:0`);
    });
  });

  it('has no two symbols sharing a pattern', () => {
    // Duplicates would make a scanner read one value as another, silently.
    expect(new Set(PATTERNS).size).toBe(PATTERNS.length);
  });
});

describe('encoding', () => {
  it('starts with the subset B start symbol and ends with the stop symbol', () => {
    const { widths } = encodeCode128B('A');

    expect(widths.slice(0, 6).join('')).toBe(PATTERNS[START_B]);
    expect(widths.slice(-7).join('')).toBe(PATTERNS[STOP]);
  });

  it('works out the check symbol the way the specification says', () => {
    // "AB": start(104) + 'A'(33)x1 + 'B'(34)x2 = 104 + 33 + 68 = 205; 205 mod 103 = 102.
    const { widths } = encodeCode128B('AB');
    const checkPattern = widths.slice(-13, -7).join('');

    expect(checkPattern).toBe(PATTERNS[102]);
  });

  it('always begins with a bar and alternates from there', () => {
    const { widths } = encodeCode128B('SCH-2026-0001');

    // Start, data, check and stop are all whole symbols, so the count has to line up exactly:
    // 6 elements each for start + 13 data + check, plus the stop symbol's 7.
    expect(widths).toHaveLength((1 + 13 + 1) * 6 + 7);
  });

  it('counts the quiet zones as part of the symbol', () => {
    const encoded = encodeCode128B('X');
    const barModules = encoded.widths.reduce((sum, w) => sum + w, 0);

    // A scanner needs clear space at both ends to find the symbol's edges at all, so the quiet
    // zones are measured with it rather than left to whatever happens to be beside it.
    expect(encoded.quietModules).toBe(10);
    expect(encoded.totalModules).toBe(barModules + 20);
  });

  it('accepts every character subset B covers', () => {
    const printable = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');

    expect(isEncodable(printable)).toBe(true);
    expect(encodeCode128B(printable)).not.toBeNull();
  });

  it('returns nothing for a value it cannot represent, rather than throwing', () => {
    // A card number with an odd character should still print — just without a barcode — instead
    // of failing the whole PDF for every card in the batch.
    expect(encodeCode128B('CARD—2026')).toBeNull();
    expect(encodeCode128B('')).toBeNull();
    expect(encodeCode128B(null)).toBeNull();
  });
});
