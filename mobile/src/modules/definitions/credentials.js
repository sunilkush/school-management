import {
  useGetCertificatesQuery,
  useGetMyCertificatesQuery,
  useRevokeCertificateMutation,
  useGetIdCardsQuery,
  useGetMyIdCardsQuery,
} from '../../store/api/apiSlice';
import { formatDate } from '../../utils/format';

const ISSUING_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal'];

/**
 * Certificates and ID cards — the school's two "documents about a person" registers.
 *
 * Each exists twice in the nav on purpose, because they are genuinely two different screens over
 * the same data: a family sees *their own* documents (`/certificates/my`, `/id-cards/my`, no
 * filters, nothing to act on), while the office sees the whole register and can revoke. Rather
 * than one descriptor that behaves differently depending on who opened it, each gets its own key,
 * so the label in the nav always matches what the screen actually is.
 *
 * **Nothing here issues a document.** Generating a transfer certificate or printing an ID card is
 * a considered, numbered act that the web portal does with a student picker, a template and a
 * print queue behind it. Revoking is offered, because that is the one thing that is genuinely
 * urgent and might need doing away from a desk.
 */

const certificateFields = (row) => [
  { label: 'Certificate number', value: row.certificateNumber },
  { label: 'Type', value: row.certificateType },
  { label: 'Student', value: row.studentName },
  { label: 'Class', value: [row.className, row.sectionName].filter(Boolean).join(' ') },
  { label: 'Issued', value: row.issueDate ? formatDate(row.issueDate) : null },
  { label: 'Father', value: row.fatherName },
  { label: 'Mother', value: row.motherName },
  { label: 'Date of birth', value: row.dateOfBirth ? formatDate(row.dateOfBirth) : null },
  { label: 'Revoked', value: row.status === 'Revoked' ? row.revokeReason || 'Yes' : null },
];

const certificateBadge = (row) => ({
  label: row.status === 'Revoked' ? 'revoked' : 'issued',
  tone: row.status === 'Revoked' ? 'overdue' : 'active',
});

/** The office's register: every certificate the school has issued. */
export const certificatesModule = {
  key: 'Certificates',
  title: 'Certificates',
  icon: 'certificate-outline',

  servesRole: (ctx) => ctx.is(...ISSUING_ROLES),
  notForRoleLabel: 'The certificate register is kept by the school office. Your own certificates are under “My Certificates”.',

  useList: () => useGetCertificatesQuery({ limit: 50 }),
  selectRows: (data) => data?.certificates ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.studentName, (row) => row.certificateNumber, (row) => row.certificateType],
  searchPlaceholder: 'Search by student or number',

  row: (row) => ({
    title: row.studentName,
    subtitle: row.certificateType,
    meta: [row.certificateNumber, row.issueDate ? formatDate(row.issueDate) : null].filter(Boolean).join(' · '),
    badge: certificateBadge(row),
  }),

  emptyIcon: 'certificate-outline',
  emptyLabel: 'No certificates issued yet',

  detail: {
    title: 'Certificate',
    titleFor: (row) => row.certificateType,
    badgeFor: certificateBadge,
    fields: certificateFields,
    actions: [
      {
        key: 'revoke',
        label: 'Revoke certificate',
        icon: 'cancel',
        tone: 'danger',
        allow: (ctx, row) => ctx.is(...ISSUING_ROLES) && row?.status !== 'Revoked',
        useMutation: useRevokeCertificateMutation,
        title: 'Revoke Certificate',
        submitLabel: 'Revoke',
        // A revoked certificate may already be in someone's hands — the reason is what the office
        // will be asked about later, so it is required rather than optional.
        fields: [
          { name: 'revokeReason', label: 'Why is this being revoked', type: 'textarea', required: true },
        ],
        buildArg: (row, ctx, values) => ({ id: row._id, revokeReason: values.revokeReason.trim() }),
      },
    ],
  },
};

/** A family's own certificates. */
export const myCertificatesModule = {
  key: 'MyCertificates',
  title: 'My Certificates',
  icon: 'certificate',

  useList: () => useGetMyCertificatesQuery(),
  // /certificates/my returns a bare array — no paging, a family has a handful at most.
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.certificateType,
    subtitle: row.studentName,
    meta: [row.certificateNumber, row.issueDate ? formatDate(row.issueDate) : null].filter(Boolean).join(' · '),
    badge: certificateBadge(row),
  }),

  emptyIcon: 'certificate-outline',
  emptyLabel: 'No certificates have been issued to you yet',
  footerNote: 'To request a certificate, contact the school office.',

  detail: {
    title: 'Certificate',
    titleFor: (row) => row.certificateType,
    badgeFor: certificateBadge,
    fields: certificateFields,
  },
};

const idCardFields = (row) => [
  { label: 'Card number', value: row.cardNumber },
  { label: 'Name', value: row.fullName },
  { label: 'Holder', value: row.holderType },
  { label: 'Issued', value: row.issueDate ? formatDate(row.issueDate) : null },
  { label: 'Valid until', value: row.validUntil ? formatDate(row.validUntil) : null },
  { label: 'Blood group', value: row.bloodGroup },
  { label: 'Contact', value: row.contactPhone },
  { label: 'Address', value: row.address },
];

function idCardBadge(row) {
  // An expired card is not the same as a deactivated one, and a holder needs to be told which.
  const expired = row.validUntil && new Date(row.validUntil).getTime() < Date.now();
  if (row.isActive === false) return { label: 'deactivated', tone: 'inactive' };
  if (expired) return { label: 'expired', tone: 'overdue' };
  return { label: 'active', tone: 'active' };
}

/** The office's register of printed ID cards. */
export const idCardsModule = {
  key: 'IDCards',
  title: 'ID Cards',
  icon: 'card-account-details-outline',

  servesRole: (ctx) => ctx.is(...ISSUING_ROLES),
  notForRoleLabel: 'The ID card register is kept by the school office. Your own card is under “My ID Card”.',

  useList: () => useGetIdCardsQuery({ limit: 50 }),
  selectRows: (data) => data?.cards ?? [],
  rowKey: (row) => row._id,

  searchFields: [(row) => row.fullName, (row) => row.cardNumber],
  searchPlaceholder: 'Search by name or card number',

  row: (row) => ({
    title: row.fullName,
    subtitle: row.holderType,
    meta: row.cardNumber,
    badge: idCardBadge(row),
  }),

  emptyIcon: 'card-account-details-outline',
  emptyLabel: 'No ID cards issued yet',

  detail: { title: 'ID Card', titleFor: (row) => row.fullName, badgeFor: idCardBadge, fields: idCardFields },
};

/** A family's own ID card. */
export const myIdCardModule = {
  key: 'MyIdCard',
  title: 'My ID Card',
  icon: 'card-account-details',

  useList: () => useGetMyIdCardsQuery(),
  selectRows: (data) => (Array.isArray(data) ? data : []),
  rowKey: (row) => row._id,

  row: (row) => ({
    title: row.fullName,
    subtitle: row.cardNumber,
    meta: row.validUntil ? `Valid until ${formatDate(row.validUntil)}` : null,
    badge: idCardBadge(row),
  }),

  emptyIcon: 'card-account-details-outline',
  emptyLabel: 'No ID card has been issued to you yet',
  // The card carries a photo and a barcode; this screen lists its details rather than pretending
  // to be the card itself, which only the printed one can be.
  footerNote: 'This is the record of your card, not a replacement for the printed one.',

  detail: { title: 'ID Card', titleFor: (row) => row.fullName, badgeFor: idCardBadge, fields: idCardFields },
};
