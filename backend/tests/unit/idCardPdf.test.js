import { exportIdCardsPdf } from '../../src/utils/exportService.js';

/**
 * A card is printed once and then carried around for a year, so the failures that matter are the
 * ones that still produce a file: a missing field, a name that wraps, a card number a barcode
 * cannot represent. These render the awkward cases rather than the tidy one.
 *
 * What this does NOT check is whether the result looks right — that needs eyes on the PDF.
 */

const school = {
  name: 'Green Valley High School',
  phone: '(123) 456-7890',
  email: 'info@greenvalley.example',
  address: '123 Elm Street, Springfield',
  logo: '',
};

const baseCard = {
  _id: 'c1',
  holderType: 'Student',
  cardNumber: 'SCH-2025-000123',
  fullName: 'Aarav Sharma',
  photoUrl: '',
  className: 'Class 10',
  sectionName: 'A',
  rollNumber: '24',
  dateOfBirth: new Date('2010-01-12'),
  bloodGroup: 'O+',
  issueDate: new Date('2025-06-01'),
  validUntil: new Date('2026-03-31'),
};

const pageCount = (buffer) => (buffer.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

const render = (cards) => exportIdCardsPdf(cards, school);

describe('ID card PDF', () => {
  it('produces a front and a back for one card', async () => {
    const buffer = await render([baseCard]);

    expect(buffer.toString('latin1').startsWith('%PDF-')).toBe(true);
    expect(pageCount(buffer)).toBe(2);
  }, 20000);

  it('keeps each batch of cards to one front page and one back page', async () => {
    const cards = Array.from({ length: 5 }, (_, i) => ({
      ...baseCard, _id: `c${i}`, cardNumber: `SCH-2025-00${i}`,
    }));

    const buffer = await render(cards);

    // Four cards to a page, so five cards is two batches: front, back, front, back.
    expect(pageCount(buffer)).toBe(4);
  }, 30000);

  it('renders a card with almost nothing filled in', async () => {
    const bare = {
      _id: 'c2', holderType: 'Student', cardNumber: 'SCH-1', fullName: 'A',
      issueDate: new Date('2025-06-01'),
    };

    const buffer = await render([bare]);

    // Empty rows are dropped rather than printed as dashes, and the card still has to come out.
    expect(pageCount(buffer)).toBe(2);
    expect(buffer.length).toBeGreaterThan(1000);
  }, 20000);

  it('renders a very long name without failing', async () => {
    const longName = {
      ...baseCard,
      fullName: 'Venkatanarasimharajuvaripeta Subrahmanyam Chandrasekhar Rao',
    };

    const buffer = await render([longName]);

    expect(pageCount(buffer)).toBe(2);
  }, 20000);

  it('still renders when the card number cannot be encoded as a barcode', async () => {
    // An em dash is outside Code 128 subset B. The barcode is skipped; the card is not.
    const odd = { ...baseCard, cardNumber: 'SCH—2025—1' };

    const buffer = await render([odd]);

    expect(pageCount(buffer)).toBe(2);
  }, 20000);

  it('renders a staff card, which uses different rows', async () => {
    const staff = {
      _id: 'c3', holderType: 'Employee', cardNumber: 'EMP-2025-0007',
      fullName: 'Priya Nair', designation: 'Senior Teacher', department: 'Mathematics',
      employeeCode: 'T-0007', issueDate: new Date('2025-06-01'),
    };

    const buffer = await render([staff]);

    expect(pageCount(buffer)).toBe(2);
  }, 20000);

  it('does not fall over on a school with no contact details', async () => {
    const buffer = await exportIdCardsPdf([baseCard], { name: 'A School' });

    expect(pageCount(buffer)).toBe(2);
  }, 20000);
});
