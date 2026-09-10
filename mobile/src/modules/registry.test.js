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

describe('attendance descriptor', () => {
  const attendance = MODULE_REGISTRY.Attendance;

  it('counts a half day as half a day present, matching the web report', () => {
    const rows = [
      { status: 'present' }, { status: 'present' }, { status: 'halfday' }, { status: 'absent' },
    ];
    const percent = attendance.summary(rows).find((s) => s.label === 'Attendance');
    // (2 + 0.5) / 4 = 62.5% -> 63
    expect(percent.value).toBe(63);
  });

  it('shows no summary tiles when there is nothing to summarise', () => {
    expect(attendance.summary([])).toEqual([]);
  });

  it('keeps all five statuses distinct instead of flattening them into three tones', () => {
    const colorFor = (status) => attendance.row({ status, date: '2026-09-01' }).badge.color;
    const colors = ['present', 'absent', 'late', 'halfday', 'leave'].map(colorFor);
    expect(new Set(colors).size).toBe(5);
  });
});

describe('fees descriptor', () => {
  const fees = MODULE_REGISTRY.Fees;

  it('identifies a child by Student._id — the OPPOSITE id to homework and attendance', () => {
    const children = [{ _id: 'student-1', userId: 'user-1', name: 'Asha' }];

    // Fees: GET /student-fees/my resolves the child as Student.findOne({ _id })
    expect(fees.scope.selectOptions(children)).toEqual([{ value: 'student-1', label: 'Asha' }]);
    // Homework/attendance: /child/:childId/… resolve as Student.findOne({ userId })
    expect(MODULE_REGISTRY.Assignments.scope.selectOptions(children)[0].value).toBe('user-1');
    expect(MODULE_REGISTRY.Attendance.scope.selectOptions(children)[0].value).toBe('user-1');
  });

  it('totals what is billed, paid and still owed', () => {
    const rows = [
      { totalAmount: 1000, paidAmount: 1000, dueAmount: 0, status: 'paid' },
      { totalAmount: 500, paidAmount: 200, dueAmount: 300, status: 'partial' },
    ];
    const byLabel = Object.fromEntries(fees.summary(rows).map((s) => [s.label, s.value]));
    expect(byLabel['Total billed']).toBe(1500);
    expect(byLabel.Paid).toBe(1200);
    expect(byLabel['Still due']).toBe(300);
  });

  it('treats anything not fully paid as still due', () => {
    expect(fees.filter.apply({ status: 'partial' }, 'due')).toBe(true);
    expect(fees.filter.apply({ status: 'pending' }, 'due')).toBe(true);
    expect(fees.filter.apply({ status: 'paid' }, 'due')).toBe(false);
  });

  it('offers no way to pay — the pay endpoint records cash, it is not a gateway', () => {
    expect(fees.create).toBeUndefined();
    expect(fees.detail.actions).toBeUndefined();
  });
});

describe('role gating', () => {
  it('keeps the family view of fees and attendance away from staff, who mean something else by it', () => {
    for (const key of ['Fees', 'Attendance']) {
      const serves = MODULE_REGISTRY[key].servesRole;
      expect(serves(ctxFor('Student'))).toBe(true);
      expect(serves(ctxFor('Parent'))).toBe(true);
      // Both of these have their own "Fees"/"Attendance" nav entry meaning the school-wide view.
      expect(serves(ctxFor('School Admin'))).toBe(false);
      expect(serves(ctxFor('Teacher'))).toBe(false);
    }
  });

  it('explains itself rather than showing an error, and says which phase covers the real one', () => {
    for (const key of ['Fees', 'Attendance']) {
      expect(MODULE_REGISTRY[key].notForRoleLabel).toBeTruthy();
    }
  });

  it('leaves ungated modules alone', () => {
    expect(MODULE_REGISTRY.Circulars.servesRole).toBeUndefined();
    expect(MODULE_REGISTRY.Notifications.servesRole).toBeUndefined();
  });
});

describe('report cards descriptor', () => {
  const cards = MODULE_REGISTRY.ProgressReport;

  it('uses the child User id, like homework — ReportCard.studentId refs User, not Student', () => {
    const children = [{ _id: 'student-1', userId: 'user-1', name: 'Asha' }];
    expect(cards.scope.selectOptions(children)[0].value).toBe('user-1');
  });

  it('expands each subject into its own row instead of one crammed field', () => {
    const fields = cards.detail.fields({
      subjects: [
        { subjectName: 'Maths', weightedPercentage: 88, grade: 'A' },
        { subjectName: 'Science', weightedPercentage: 31, grade: 'D', isPassed: false },
      ],
      totals: { obtainedMarks: 119, maximumMarks: 200, percentage: 59.5, grade: 'C' },
    });

    const maths = fields.find((f) => f.label === 'Maths');
    expect(maths.value).toBe('88% · Grade A');
    // A failed subject says so rather than looking like any other row.
    expect(fields.find((f) => f.label === 'Science').value).toContain('Not passed');
    expect(fields.find((f) => f.label === 'Overall').value).toBe('119 / 200 · 59.5% · Grade C');
  });

  it('is read-only for families — publishing is exam-team work', () => {
    expect(cards.create).toBeUndefined();
    expect(cards.detail.actions).toBeUndefined();
    expect(cards.servesRole(ctxFor('Teacher'))).toBe(false);
  });
});

describe('messages descriptor', () => {
  const messages = MODULE_REGISTRY.Messages;
  const withUser = (roleName, userId) => ({ ...ctxFor(roleName), user: { _id: userId } });

  it('parents a reply so it stays in the same conversation', () => {
    const reply = messages.detail.actions.find((a) => a.key === 'reply');
    const arg = reply.buildArg(
      { _id: 'm1', subject: 'Fee reminder', senderId: { _id: 'u-sender' } },
      withUser('Parent', 'u-me'),
      { body: '  will pay today  ' }
    );
    expect(arg.parentMessageId).toBe('m1');
    expect(arg.recipientIds).toEqual(['u-sender']);
    expect(arg.body).toBe('will pay today');
  });

  it('does not stack up "Re: Re: Re:" on an ongoing thread', () => {
    const reply = messages.detail.actions.find((a) => a.key === 'reply');
    const subjectFor = (subject) =>
      reply.buildArg({ _id: 'm1', subject, senderId: { _id: 's' } }, withUser('Parent', 'me'), { body: 'x' }).subject;

    expect(subjectFor('Fee reminder')).toBe('Re: Fee reminder');
    expect(subjectFor('Re: Fee reminder')).toBe('Re: Fee reminder');
  });

  it('offers no reply on a message you sent yourself', () => {
    const reply = messages.detail.actions.find((a) => a.key === 'reply');
    expect(reply.allow(withUser('Parent', 'u-me'), { senderId: { _id: 'u-other' } })).toBe(true);
    expect(reply.allow(withUser('Parent', 'u-me'), { senderId: { _id: 'u-me' } })).toBe(false);
    expect(reply.allow(withUser('Parent', 'u-me'), {})).toBe(false);
  });

  it('marks read on open, like notifications and circulars', () => {
    expect(messages.detail.onOpenArg({ _id: 'm1', isRead: false })).toBe('m1');
    expect(messages.detail.onOpenArg({ _id: 'm1', isRead: true })).toBeNull();
  });
});

describe('events descriptor', () => {
  const events = MODULE_REGISTRY.Events;

  it('keeps a multi-day event in "upcoming" while it is still running', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    // Started yesterday, ends tomorrow — still upcoming, not gone.
    expect(events.filter.apply({ startDate: yesterday, endDate: tomorrow }, 'upcoming')).toBe(true);
    // Finished.
    expect(events.filter.apply({ startDate: yesterday, endDate: yesterday }, 'upcoming')).toBe(false);
    // No dates at all cannot be claimed as upcoming.
    expect(events.filter.apply({}, 'upcoming')).toBe(false);
  });

  it('collapses a single-day span instead of printing the same date twice', () => {
    const day = '2026-09-15T10:00:00.000Z';
    expect(events.row({ title: 'x', startDate: day, endDate: day, allDay: true }).meta).not.toContain('–');
  });
});

describe('library descriptor', () => {
  const library = MODULE_REGISTRY.Library;

  it('only shows a fine tile when something is actually owed', () => {
    const labels = (rows) => library.summary(rows).map((t) => t.label);
    expect(labels([{ status: 'Issued', fineAmount: 0 }])).not.toContain('Fine due');
    expect(labels([{ status: 'Overdue', fineAmount: 40 }])).toContain('Fine due');
  });

  it('warns before a book is late, not only after', () => {
    const soon = new Date(Date.now() + 2 * 86400000).toISOString();
    const later = new Date(Date.now() + 20 * 86400000).toISOString();

    expect(library.row({ status: 'Issued', dueDate: soon }).badge.tone).toBe('pending');
    // Plenty of time left — no badge nagging the student.
    expect(library.row({ status: 'Issued', dueDate: later }).badge).toBeNull();
    expect(library.row({ status: 'Overdue', dueDate: soon, fineAmount: 10 }).badge.tone).toBe('overdue');
  });
});

describe('results descriptor', () => {
  const grades = MODULE_REGISTRY.Grades;

  it('reads the wrapped list shape', () => {
    expect(grades.selectRows({ studentId: 's', grades: [{ _id: 'a' }] })).toHaveLength(1);
    expect(grades.selectRows(undefined)).toEqual([]);
  });

  it('averages published results and only flags failures when there are some', () => {
    const labels = (rows) => grades.summary(rows).map((t) => t.label);
    expect(labels([{ percentage: 80, resultStatus: 'PASS' }])).not.toContain('Not passed');
    expect(labels([{ percentage: 30, resultStatus: 'FAIL' }])).toContain('Not passed');

    const avg = grades.summary([{ percentage: 80 }, { percentage: 60 }]).find((t) => t.label === 'Average');
    expect(avg.value).toBe(70);
  });

  it('gives each subject its own row with marks out of the total', () => {
    const fields = grades.detail.fields({
      subjects: [{ subjectName: 'Maths', obtainedMarks: 42, totalMarks: 50, isPassed: true }],
      totalObtainedMarks: 42, totalMaximumMarks: 50, percentage: 84, grade: 'A',
    });
    expect(fields.find((f) => f.label === 'Maths').value).toBe('42 / 50');
    expect(fields.find((f) => f.label === 'Total').value).toBe('42 / 50 · 84% · Grade A');
  });
});

describe('online classes descriptor', () => {
  const classes = MODULE_REGISTRY.OnlineClasses;

  it('offers Join only when the backend says the link is open', () => {
    const join = classes.detail.actions.find((a) => a.key === 'join');
    const ctx = ctxFor('Student');

    expect(join.allow(ctx, { status: 'scheduled', canJoin: true })).toBe(true);
    // The link is not open yet — the backend would 403 this.
    expect(join.allow(ctx, { status: 'scheduled', canJoin: false })).toBe(false);
    expect(join.allow(ctx, { status: 'cancelled', canJoin: true })).toBe(false);
  });

  it('stays on the class after joining, since the passcode may still be needed', () => {
    const join = classes.detail.actions.find((a) => a.key === 'join');
    expect(join.stayOnSuccess).toBe(true);
  });

  it('takes the meeting link from the join RESPONSE, never from the list row', () => {
    const join = classes.detail.actions.find((a) => a.key === 'join');
    // buildArg sends only the id — the link is not something the client supplies or caches.
    expect(join.buildArg({ _id: 'c1', meetingLink: 'https://stale.example' })).toBe('c1');
    expect(typeof join.onSuccess).toBe('function');
  });
});

describe('study materials descriptor', () => {
  const materials = MODULE_REGISTRY.StudyMaterials;

  it('prefers an external link over an uploaded file when both exist', () => {
    const open = materials.detail.actions.find((a) => a.key === 'open');
    expect(open.buildArg({ externalLink: 'https://a', fileUrl: 'https://b' })).toBe('https://a');
    expect(open.buildArg({ fileUrl: 'https://b' })).toBe('https://b');
  });

  it('offers nothing to open when there is neither a link nor a file', () => {
    const open = materials.detail.actions.find((a) => a.key === 'open');
    expect(open.allow(ctxFor('Student'), {})).toBe(false);
    expect(open.allow(ctxFor('Student'), { fileUrl: 'https://b' })).toBe(true);
  });
});

describe('surveys screen wiring', () => {
  it('is bespoke, not a descriptor — the form is built from the survey’s own questions', () => {
    expect(moduleDescriptor('Surveys')).toBeNull();
    expect(screenForModule({ key: 'Surveys' })).not.toBe(ModulePlaceholderScreen);
    // It renders its own stack (list -> respond), so the outer navigator must not add a header.
    expect(isSelfHeadered({ key: 'Surveys' })).toBe(true);
  });

  it('routes the other bespoke Tier A screens too', () => {
    for (const key of ['Timetable', 'MarkAttendance']) {
      expect(screenForModule({ key })).not.toBe(ModulePlaceholderScreen);
    }
  });
});

describe('exams descriptor', () => {
  const exams = MODULE_REGISTRY.Exams;

  it('reads the paginated list shape', () => {
    expect(exams.selectRows({ exams: [{ _id: 'a' }], pagination: {} })).toHaveLength(1);
    expect(exams.selectRows(undefined)).toEqual([]);
  });

  it('does not leave a past exam sitting in "upcoming" forever', () => {
    const longAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const soon = new Date(Date.now() + 3 * 86400000).toISOString();

    expect(exams.filter.apply({ examDate: soon, status: 'published' }, 'upcoming')).toBe(true);
    expect(exams.filter.apply({ examDate: longAgo, status: 'published' }, 'upcoming')).toBe(false);
    // Marked completed by the school — done regardless of date.
    expect(exams.filter.apply({ examDate: soon, status: 'completed' }, 'upcoming')).toBe(false);
    expect(exams.filter.apply({ examDate: longAgo, status: 'completed' }, 'completed')).toBe(true);
  });
});

describe('bespoke Tier B screens', () => {
  it('routes PTM booking and the live bus to real screens, not the placeholder', () => {
    for (const key of ['PTMBooking', 'MyTransport']) {
      expect(moduleDescriptor(key)).toBeNull();
      expect(screenForModule({ key })).not.toBe(ModulePlaceholderScreen);
    }
  });

  it('lets PTM render its own header, since it is a two-screen stack', () => {
    expect(isSelfHeadered({ key: 'PTMBooking' })).toBe(true);
    // The bus screen is a single screen — the outer navigator still owns its header.
    expect(isSelfHeadered({ key: 'MyTransport' })).toBe(false);
  });
});
