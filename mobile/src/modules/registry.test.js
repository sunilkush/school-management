import { MODULE_REGISTRY, moduleDescriptor } from './registry';
import { screenForModule, isSelfHeadered } from '../navigation/screenForModule';
import { ModulePlaceholderScreen } from '../screens/ModulePlaceholderScreen';

const ctxFor = (roleName) => ({
  roleName,
  is: (...names) => names.includes(roleName),
  can: () => false,
});

describe('module registry wiring', () => {
  it('gives every declared module a screen', () => {
    for (const [key, descriptor] of Object.entries(MODULE_REGISTRY)) {
      expect(typeof descriptor.screen).toBe('function');
      expect(screenForModule({ key })).toBe(descriptor.screen);
    }
  });

  it('falls back to the placeholder for a module that has no descriptor yet', () => {
    expect(moduleDescriptor('Hostel')).toBeNull();
    expect(screenForModule({ key: 'Hostel' })).toBe(ModulePlaceholderScreen);
  });

  it('marks modules that became their own stack as self-headered, so no double header renders', () => {
    // All three pilots have a detail view, so all three are stacks.
    expect(isSelfHeadered({ key: 'Leave' })).toBe(true);
    expect(isSelfHeadered({ key: 'Students' })).toBe(true);
    // A module with no descriptor is a bare placeholder and must NOT claim its own header.
    expect(isSelfHeadered({ key: 'Hostel' })).toBe(false);
  });
});

describe('leave descriptor', () => {
  const leave = MODULE_REGISTRY.Leave;

  it('normalises both list shapes the two endpoints return', () => {
    // GET /leave-requests/my responds with a bare array...
    expect(leave.selectRows([{ _id: 'a' }])).toHaveLength(1);
    // ...while GET /leave-requests wraps it.
    expect(leave.selectRows({ requests: [{ _id: 'a' }, { _id: 'b' }], total: 2 })).toHaveLength(2);
    expect(leave.selectRows(undefined)).toEqual([]);
  });

  it('converts the Title Case role name into the snake_case enum the backend requires', () => {
    const payload = leave.create.buildPayload(
      { leaveType: 'sick', startDate: '2026-09-10', endDate: '2026-09-12', reason: '  fever  ' },
      ctxFor('Class Teacher')
    );
    expect(payload.role).toBe('class_teacher');
    expect(payload.reason).toBe('fever');
  });

  it('counts leave days inclusively, so a single-day leave is 1 and not 0', () => {
    const oneDay = leave.create.buildPayload(
      { leaveType: 'casual', startDate: '2026-09-10', endDate: '2026-09-10', reason: 'x' },
      ctxFor('Teacher')
    );
    expect(oneDay.totalDays).toBe(1);

    const threeDays = leave.create.buildPayload(
      { leaveType: 'casual', startDate: '2026-09-10', endDate: '2026-09-12', reason: 'x' },
      ctxFor('Teacher')
    );
    expect(threeDays.totalDays).toBe(3);
  });

  it('rejects an end date before the start date before it reaches the server', () => {
    expect(leave.create.validate({ startDate: '2026-09-12', endDate: '2026-09-10' })).toHaveProperty('endDate');
    expect(leave.create.validate({ startDate: '2026-09-10', endDate: '2026-09-12' })).toEqual({});
    // Nothing to compare yet — the required-field check owns that case, not this one.
    expect(leave.create.validate({ startDate: '', endDate: '' })).toEqual({});
  });

  it('hides the apply form from Super Admin, whose role has no member in the leave enum', () => {
    expect(leave.create.allow(ctxFor('Super Admin'))).toBe(false);
    expect(leave.create.allow(ctxFor('Teacher'))).toBe(true);
  });

  it('offers approve/reject only to the four roles the route allows, and only while pending', () => {
    const approve = leave.detail.actions.find((a) => a.key === 'approve');
    const pending = { status: 'pending' };

    expect(approve.allow(ctxFor('Principal'), pending)).toBe(true);
    expect(approve.allow(ctxFor('Teacher'), pending)).toBe(false);
    expect(approve.allow(ctxFor('Principal'), { status: 'approved' })).toBe(false);
  });

  it('lets an applicant cancel only their own still-pending request', () => {
    const cancel = leave.detail.actions.find((a) => a.key === 'cancel');
    expect(cancel.allow(ctxFor('Teacher'), { status: 'pending' })).toBe(true);
    expect(cancel.allow(ctxFor('Teacher'), { status: 'approved' })).toBe(false);
    // An approver reviewing someone else's request gets approve/reject, not cancel.
    expect(cancel.allow(ctxFor('Principal'), { status: 'pending' })).toBe(false);
  });

  it('collects a rejection reason instead of firing straight away', () => {
    const reject = leave.detail.actions.find((a) => a.key === 'reject');
    expect(reject.fields).toHaveLength(1);
    expect(reject.buildArg({ _id: 'r1' }, ctxFor('Principal'), { rejectionReason: ' too short notice ' })).toEqual({
      id: 'r1',
      rejectionReason: 'too short notice',
    });
  });
});

describe('students descriptor', () => {
  const students = MODULE_REGISTRY.Students;

  it('drills into the Student id, not the enrollment id the row is keyed by', () => {
    const row = { _id: 'enrollment-1', studentId: 'student-1', studentName: 'Asha' };
    expect(students.rowKey(row)).toBe('enrollment-1');
    expect(students.detail.idFor(row)).toBe('student-1');
  });

  it('reads the paginated list shape', () => {
    expect(students.selectRows({ students: [{ _id: 'a' }], pagination: { total: 1 } })).toHaveLength(1);
    expect(students.selectRows(undefined)).toEqual([]);
  });

  it('presents class and section together, skipping whichever is missing', () => {
    expect(students.row({ studentName: 'Asha', className: '5', sectionName: 'B' }).subtitle).toBe('5 · B');
    expect(students.row({ studentName: 'Asha', className: '5' }).subtitle).toBe('5');
  });
});

describe('notifications descriptor', () => {
  const notifications = MODULE_REGISTRY.Notifications;

  it('filters unread and urgent client-side, since the endpoint offers neither', () => {
    const rows = [
      { _id: '1', isRead: false, level: 'normal' },
      { _id: '2', isRead: true, level: 'urgent' },
    ];
    expect(rows.filter((r) => notifications.filter.apply(r, 'unread'))).toHaveLength(1);
    expect(rows.filter((r) => notifications.filter.apply(r, 'urgent'))).toHaveLength(1);
  });

  it('marks a row unread-styled only when it is genuinely unread', () => {
    expect(notifications.row({ title: 't', isRead: false }).unread).toBe(true);
    expect(notifications.row({ title: 't', isRead: true }).unread).toBe(false);
  });

  it('only asks to mark-as-read a notification that is not already read', () => {
    expect(notifications.detail.onOpenArg({ _id: 'n1', isRead: false })).toBe('n1');
    expect(notifications.detail.onOpenArg({ _id: 'n1', isRead: true })).toBeNull();
  });

  it('shows the compose action to exactly the roles the backend lets broadcast', () => {
    expect(notifications.create.allow(ctxFor('Receptionist'))).toBe(true);
    expect(notifications.create.allow(ctxFor('IT Support'))).toBe(true);
    expect(notifications.create.allow(ctxFor('Teacher'))).toBe(false);
    expect(notifications.create.allow(ctxFor('Parent'))).toBe(false);
  });

  it('sends targetRoles as an array, which is what the create endpoint expects', () => {
    const payload = notifications.create.buildPayload({
      title: ' Exam ', message: ' Starts Monday ', level: 'high', targetRoles: 'Student',
    });
    expect(payload.targetRoles).toEqual(['Student']);
    expect(payload.title).toBe('Exam');
  });
});

describe('circulars descriptor', () => {
  const circulars = MODULE_REGISTRY.Circulars;

  it('keeps a circular bold while it still wants something from the reader', () => {
    // Never opened.
    expect(circulars.row({ title: 'a', viewedAt: null }).unread).toBe(true);
    // Opened, but the acknowledgement is still outstanding — still asking something of you.
    expect(circulars.row({ title: 'a', viewedAt: '2026-09-01', needsAcknowledgement: true }).unread).toBe(true);
    // Read and settled.
    expect(circulars.row({ title: 'a', viewedAt: '2026-09-01', needsAcknowledgement: false }).unread).toBe(false);
  });

  it('offers acknowledgement only where the backend would accept one', () => {
    const ack = circulars.detail.actions.find((a) => a.key === 'acknowledge');
    const ctx = ctxFor('Parent');

    expect(ack.allow(ctx, { requiresAcknowledgement: true, acknowledgedAt: null })).toBe(true);
    // The backend 400s on a circular that does not ask for one...
    expect(ack.allow(ctx, { requiresAcknowledgement: false })).toBe(false);
    // ...and on one already acknowledged.
    expect(ack.allow(ctx, { requiresAcknowledgement: true, acknowledgedAt: '2026-09-01' })).toBe(false);
  });

  it('shows the wording being agreed to only while it is still unagreed', () => {
    const labelOf = (record) =>
      circulars.detail.fields(record).find((f) => f.label === 'You are being asked to confirm')?.value;

    expect(labelOf({ requiresAcknowledgement: true, acknowledgementText: 'I have read this' })).toBe('I have read this');
    expect(labelOf({ requiresAcknowledgement: true, acknowledgementText: 'x', acknowledgedAt: '2026-09-01' })).toBeFalsy();
  });

  it('sends an empty note rather than undefined when the reader adds none', () => {
    const ack = circulars.detail.actions.find((a) => a.key === 'acknowledge');
    expect(ack.buildArg({ _id: 'c1' }, ctxFor('Student'), {})).toEqual({ id: 'c1', note: '' });
  });
});

describe('homework descriptor', () => {
  const homework = MODULE_REGISTRY.Assignments;

  it('scopes a Parent to one child, and nobody else', () => {
    expect(homework.scope.activeFor(ctxFor('Parent'))).toBe(true);
    expect(homework.scope.activeFor(ctxFor('Student'))).toBe(false);
    expect(homework.scope.activeFor(ctxFor('Teacher'))).toBe(false);
  });

  it('identifies a child by userId — the Student id 403s on the /child routes', () => {
    const options = homework.scope.selectOptions([
      { _id: 'student-1', userId: 'user-1', name: 'Asha' },
    ]);
    expect(options).toEqual([{ value: 'user-1', label: 'Asha' }]);
  });

  it('reads both list shapes: teacher gets a bare array, student/child get { homework }', () => {
    expect(homework.selectRows([{ _id: 'a' }])).toHaveLength(1);
    expect(homework.selectRows({ enrollmentId: 'e1', homework: [{ _id: 'a' }, { _id: 'b' }] })).toHaveLength(2);
    expect(homework.selectRows(undefined)).toEqual([]);
  });

  it('badges a teacher by submission count and a student by their own status', () => {
    const teacher = ctxFor('Teacher');
    expect(homework.row({ title: 'x', submissionCount: 3 }, teacher).badge).toEqual({
      label: '3 submitted',
      tone: 'inactive',
    });

    const student = ctxFor('Student');
    expect(homework.row({ title: 'x', submission: { submittedAt: '2026-09-01' } }, student).badge.tone).toBe('active');
    // Past its due date and still not handed in.
    expect(homework.row({ title: 'x', dueDate: '2020-01-01' }, student).badge.tone).toBe('overdue');
    expect(homework.row({ title: 'x', dueDate: '2999-01-01' }, student).badge.tone).toBe('pending');
  });

  it('lets only a Student submit, and only what is not already submitted', () => {
    const submit = homework.detail.actions.find((a) => a.key === 'submit');
    expect(submit.allow(ctxFor('Student'), { submission: null })).toBe(true);
    expect(submit.allow(ctxFor('Student'), { submission: { submittedAt: 'x' } })).toBe(false);
    // The backend's submit route is Student-only — a parent cannot hand work in for a child.
    expect(submit.allow(ctxFor('Parent'), { submission: null })).toBe(false);
    expect(submit.allow(ctxFor('Teacher'), { submission: null })).toBe(false);
  });
});
