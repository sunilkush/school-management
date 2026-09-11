import {
  useGetAdmissionInquiriesQuery,
  useCreateAdmissionInquiryMutation,
  useUpdateAdmissionInquiryMutation,
} from '../../store/api/apiSlice';
import { formatDate, timeAgo } from '../../utils/format';

// admissionInquiry.routes.js INQUIRY_MANAGE.
const INQUIRY_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Vice Principal', 'Receptionist', 'Counselor'];

// The model's status enum, in the order an application actually moves through.
const PIPELINE = ['new', 'contacted', 'visit_scheduled', 'docs_submitted', 'approved', 'enrolled'];

const STATUS_TONES = {
  new: 'pending',
  contacted: 'partial',
  visit_scheduled: 'partial',
  docs_submitted: 'partial',
  approved: 'active',
  enrolled: 'active',
  rejected: 'overdue',
  waitlist: 'inactive',
};

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  visit_scheduled: 'Visit scheduled',
  docs_submitted: 'Docs submitted',
  approved: 'Approved',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  waitlist: 'Waitlist',
};

/**
 * Admission enquiries — the pipeline from a first phone call to an enrolled student.
 *
 * Well suited to a phone precisely because that is where enquiries arrive: a parent calls or walks
 * in, and reception logs them on the spot. So this one is read-write — logging a new enquiry and
 * moving one along the pipeline are both here.
 *
 * The *public* application portal (a family applying online and tracking their own application) is
 * a different, unauthenticated flow on the web and is not this screen.
 */
export const admissionsModule = {
  key: 'AdmissionInquiries',
  title: 'Admissions',
  icon: 'account-plus-outline',
  // Receptionist's sidebar calls the same feature 'Enquiries'.
  aliases: ['Enquiries'],

  servesRole: (ctx) => ctx.is(...INQUIRY_ROLES),
  notForRoleLabel: 'Admission enquiries are handled by reception and the school office.',

  useList: (ctx, { filter }) => useGetAdmissionInquiriesQuery({ status: filter ?? undefined, limit: 100 }),
  selectRows: (data) => data?.inquiries ?? [],
  rowKey: (row) => row._id,

  searchFields: [
    (row) => row.studentName,
    (row) => row.parentName,
    (row) => row.parentPhone,
    (row) => row.applicationNumber,
  ],
  searchPlaceholder: 'Search by student, parent or phone',

  filter: {
    server: true,
    allLabel: 'All',
    options: [
      { value: 'new', label: 'New' },
      { value: 'contacted', label: 'Contacted' },
      { value: 'approved', label: 'Approved' },
    ],
  },

  summary: (rows) => {
    if (rows.length === 0) return [];
    const fresh = rows.filter((row) => row.status === 'new').length;
    // A follow-up whose date has passed is the thing that quietly gets dropped, so it is counted.
    const overdue = rows.filter(
      (row) =>
        row.followUpDate &&
        new Date(row.followUpDate).getTime() < Date.now() &&
        !['enrolled', 'rejected'].includes(row.status)
    ).length;
    return [
      { label: 'New', value: fresh, icon: 'bell-ring-outline', color: fresh > 0 ? '#F59E0B' : '#94A3B8' },
      {
        label: 'Follow-up overdue',
        value: overdue,
        icon: 'clock-alert-outline',
        color: overdue > 0 ? '#EF4444' : '#94A3B8',
      },
    ];
  },

  row: (row) => ({
    title: row.studentName,
    subtitle: [`Class ${row.applyingClass}`, row.parentName].filter(Boolean).join(' · '),
    meta: [row.parentPhone, row.createdAt ? timeAgo(row.createdAt) : null].filter(Boolean).join(' · '),
    unread: row.status === 'new',
    badge: { label: STATUS_LABELS[row.status] ?? row.status, tone: STATUS_TONES[row.status] },
  }),

  emptyIcon: 'account-plus-outline',
  emptyLabel: 'No admission enquiries yet',

  detail: {
    title: 'Enquiry',
    titleFor: (row) => row.studentName,
    badgeFor: (row) => ({ label: STATUS_LABELS[row.status] ?? row.status, tone: STATUS_TONES[row.status] }),
    fields: (row) => [
      { label: 'Application number', value: row.applicationNumber },
      { label: 'Applying for class', value: row.applyingClass },
      { label: 'Academic year', value: row.academicYear },
      { label: 'Date of birth', value: row.dateOfBirth ? formatDate(row.dateOfBirth) : null },
      { label: 'Parent', value: [row.parentName, row.relationship].filter(Boolean).join(' · ') },
      { label: 'Phone', value: row.parentPhone },
      { label: 'Email', value: row.parentEmail },
      { label: 'Address', value: row.address },
      { label: 'Previous school', value: [row.previousSchool, row.previousClass].filter(Boolean).join(' · ') },
      { label: 'Source', value: row.source },
      { label: 'Follow up on', value: row.followUpDate ? formatDate(row.followUpDate) : null },
      { label: 'Submitted', value: row.submittedAt ? formatDate(row.submittedAt) : null },
    ],
    actions: [
      {
        key: 'advance',
        label: 'Update status',
        icon: 'arrow-right',
        tone: 'primary',
        // Nothing left to move once a family is enrolled or has been turned down.
        allow: (ctx, row) => ctx.is(...INQUIRY_ROLES) && !['enrolled', 'rejected'].includes(row?.status),
        useMutation: useUpdateAdmissionInquiryMutation,
        title: 'Update Enquiry',
        submitLabel: 'Save',
        fields: [
          {
            name: 'status',
            label: 'Move to',
            type: 'select',
            required: true,
            options: [
              ...PIPELINE.map((value) => ({ value, label: STATUS_LABELS[value] })),
              { value: 'waitlist', label: 'Waitlist' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
          { name: 'notes', label: 'Notes', type: 'textarea' },
        ],
        buildArg: (row, ctx, values) => ({
          id: row._id,
          status: values.status,
          ...(values.notes?.trim() ? { notes: values.notes.trim() } : {}),
        }),
      },
    ],
  },

  create: {
    title: 'New Enquiry',
    label: 'Log enquiry',
    submitLabel: 'Save Enquiry',
    allow: (ctx) => ctx.is(...INQUIRY_ROLES),
    intro: 'For a parent who has just called or walked in.',
    useMutation: useCreateAdmissionInquiryMutation,
    fields: [
      { name: 'studentName', label: 'Student name', required: true },
      { name: 'applyingClass', label: 'Applying for class', required: true },
      { name: 'parentName', label: 'Parent name', required: true },
      { name: 'parentPhone', label: 'Parent phone', type: 'number', required: true },
      { name: 'parentEmail', label: 'Parent email' },
      {
        name: 'relationship',
        label: 'Relationship',
        type: 'select',
        initial: 'father',
        options: [
          { value: 'father', label: 'Father' },
          { value: 'mother', label: 'Mother' },
          { value: 'guardian', label: 'Guardian' },
        ],
      },
      {
        name: 'source',
        label: 'How did they reach us',
        type: 'select',
        initial: 'walk-in',
        options: [
          { value: 'walk-in', label: 'Walk-in' },
          { value: 'phone', label: 'Phone' },
          { value: 'website', label: 'Website' },
          { value: 'referral', label: 'Referral' },
          { value: 'social_media', label: 'Social media' },
          { value: 'other', label: 'Other' },
        ],
      },
      { name: 'followUpDate', label: 'Follow up on', type: 'date' },
      { name: 'previousSchool', label: 'Previous school' },
    ],
    buildPayload: (values) => ({
      studentName: values.studentName.trim(),
      applyingClass: values.applyingClass.trim(),
      parentName: values.parentName.trim(),
      parentPhone: String(values.parentPhone).trim(),
      parentEmail: values.parentEmail?.trim() || undefined,
      relationship: values.relationship,
      source: values.source,
      followUpDate: values.followUpDate || undefined,
      previousSchool: values.previousSchool?.trim() || undefined,
    }),
  },
};
