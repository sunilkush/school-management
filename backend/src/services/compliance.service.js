import { School } from "../models/school.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

/**
 * UDISE+ / APAAR / PEN / RTE compliance.
 *
 * Worth being plain about the boundary: there is no public UDISE+ API. A school files its return
 * on the government portal itself, and nothing here submits anything anywhere. What takes a
 * school days is not the submitting — it is discovering, one rejected row at a time, which of
 * eight hundred children is missing a category or a date of birth. That is what this produces.
 */

/* ── Identifier formats ──────────────────────────────────────────── */

const DIGITS_ONLY = /^\d+$/;

/** Each of these is a fixed-width numeric id issued by a government system. A typo caught here
 *  is a row that does not get rejected at filing time, months later. */
export const IDENTIFIER_RULES = {
  pen: { length: 11, label: "PEN" },
  apaarId: { length: 12, label: "APAAR ID" },
  udiseCode: { length: 11, label: "UDISE code" },
  aadhaarLast4: { length: 4, label: "Aadhaar last 4 digits" },
};

export const validateIdentifier = (kind, value) => {
  const rule = IDENTIFIER_RULES[kind];
  if (!rule) return null;
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null; // Empty is "not captured yet", which is a state, not an error.
  if (!DIGITS_ONLY.test(trimmed)) return `${rule.label} must contain digits only`;
  if (trimmed.length !== rule.length) return `${rule.label} must be exactly ${rule.length} digits`;
  return null;
};

/* ── What a complete record needs ────────────────────────────────── */

/**
 * The fields a UDISE+ student return will not accept as blank.
 *
 * Kept as data rather than as an if-chain so the readiness report, the per-student status and the
 * export all decide "complete" the same way — three separate opinions about completeness is how
 * a report ends up disagreeing with the screen next to it.
 */
export const REQUIRED_FIELDS = [
  { key: "dateOfBirth", label: "Date of birth", get: (s) => s.dateOfBirth },
  { key: "gender", label: "Gender", get: (s) => s.gender },
  { key: "socialCategory", label: "Social category", get: (s) => s.compliance?.socialCategory },
  { key: "motherTongue", label: "Mother tongue", get: (s) => s.compliance?.motherTongue },
  { key: "aadhaar", label: "Aadhaar on file", get: (s) => (s.compliance?.aadhaarOnFile ? "yes" : "") },
  { key: "pen", label: "PEN", get: (s) => s.compliance?.pen },
];

export const missingFieldsFor = (student) =>
  REQUIRED_FIELDS.filter((field) => {
    const value = field.get(student);
    return value === undefined || value === null || value === "";
  }).map((field) => ({ key: field.key, label: field.label }));

/**
 * APAAR is reported separately from the required list on purpose. An APAAR id cannot be created
 * without a parent's consent, so a child without one is not a data-entry gap the office can close
 * — it is a conversation with a parent, and lumping it in with missing dates of birth would make
 * a completable list look permanently unfinishable.
 */
export const apaarStatusFor = (student) => {
  const c = student.compliance || {};
  if (c.apaarId) return "issued";
  if (c.apaarConsent?.given) return "consented";
  return "no_consent";
};

/* ── Reports ─────────────────────────────────────────────────────── */

const activeStudentsWithClass = async ({ schoolId, academicYearId = null }) => {
  const students = await Student.find({ schoolId, status: "active" })
    .populate("userId", "name email")
    .lean();

  const enrollments = await StudentEnrollment.find({
    schoolId,
    status: "Active",
    ...(academicYearId ? { academicYearId } : {}),
  })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .select("studentId schoolClassId sectionId registrationNumber rollNumber")
    .lean();

  // Populate replaces the field, so the ids are read from the raw enrollment before any of that
  // matters — a class deleted mid-year must not silently drop a child from the return.
  const byStudent = new Map(enrollments.map((e) => [String(e.studentId), e]));

  return students.map((student) => ({
    ...student,
    enrollment: byStudent.get(String(student._id)) || null,
  }));
};

/**
 * Which children are not ready to be filed, and what each one is missing.
 *
 * Grouped by field as well as listed per student: "212 children have no mother tongue" is a job
 * somebody can do in an afternoon, while 212 separate rows is a job nobody starts.
 */
export const readinessReport = async ({ schoolId, academicYearId = null }) => {
  const school = await School.findById(schoolId).select("compliance name").lean();
  const students = await activeStudentsWithClass({ schoolId, academicYearId });

  const byField = new Map(REQUIRED_FIELDS.map((f) => [f.key, { key: f.key, label: f.label, count: 0 }]));
  const incomplete = [];

  for (const student of students) {
    const missing = missingFieldsFor(student);
    if (!missing.length) continue;
    missing.forEach((m) => { byField.get(m.key).count += 1; });
    incomplete.push({
      studentId: student._id,
      name: student.userId?.name || "Unnamed",
      className: student.enrollment?.schoolClassId?.name || null,
      sectionName: student.enrollment?.sectionId?.name || null,
      registrationNumber: student.enrollment?.registrationNumber || null,
      missing,
    });
  }

  const apaar = students.reduce(
    (acc, s) => { acc[apaarStatusFor(s)] += 1; return acc; },
    { issued: 0, consented: 0, no_consent: 0 }
  );

  return {
    schoolName: school?.name || "",
    udiseCode: school?.compliance?.udiseCode || "",
    // Said outright rather than left to be assumed from a green tick.
    schoolIdentifiersComplete: Boolean(school?.compliance?.udiseCode),
    totalStudents: students.length,
    readyStudents: students.length - incomplete.length,
    incompleteStudents: incomplete.length,
    missingByField: [...byField.values()].filter((f) => f.count > 0).sort((a, b) => b.count - a.count),
    students: incomplete.slice(0, 500),
    apaar,
  };
};

/**
 * Where the school stands against its RTE obligation, per class.
 *
 * Reported per class rather than as one school-wide number because the Act's reservation applies
 * at the entry class — a school can look compliant overall while having admitted nobody in the
 * class where it was actually required.
 */
export const rteReport = async ({ schoolId, academicYearId = null }) => {
  const school = await School.findById(schoolId).select("compliance").lean();
  const quotaPercent = school?.compliance?.rteQuotaPercent ?? 25;

  const students = await activeStudentsWithClass({ schoolId, academicYearId });

  const byClass = new Map();
  for (const student of students) {
    const className = student.enrollment?.schoolClassId?.name || "Not enrolled";
    if (!byClass.has(className)) byClass.set(className, { className, total: 0, rte: 0, categories: {} });
    const row = byClass.get(className);
    row.total += 1;
    if (student.compliance?.rteAdmission) {
      row.rte += 1;
      const category = student.compliance.rteCategory || "Other";
      row.categories[category] = (row.categories[category] || 0) + 1;
    }
  }

  const classes = [...byClass.values()]
    .map((row) => ({
      ...row,
      quotaSeats: Math.ceil((row.total * quotaPercent) / 100),
      // Only meaningful for the entry class; shown per class so the office can see where it sits
      // rather than being told a single number that hides the one class that matters.
      meetsQuota: row.rte >= Math.ceil((row.total * quotaPercent) / 100),
    }))
    .sort((a, b) => a.className.localeCompare(b.className));

  const totalRte = classes.reduce((s, c) => s + c.rte, 0);
  const total = classes.reduce((s, c) => s + c.total, 0);

  return {
    quotaPercent,
    totalStudents: total,
    rteStudents: totalRte,
    rtePercent: total ? Math.round((totalRte / total) * 1000) / 10 : 0,
    classes,
  };
};

/**
 * The rows the office types into the portal, in the order they are asked for.
 *
 * Everything a UDISE+ student row needs and nothing else — including the blanks, because a blank
 * that is visible in the sheet gets filled in, and one that is quietly omitted does not.
 */
export const exportRows = async ({ schoolId, academicYearId = null }) => {
  const students = await activeStudentsWithClass({ schoolId, academicYearId });

  return students.map((student) => {
    const c = student.compliance || {};
    return {
      name: student.userId?.name || "",
      registrationNumber: student.enrollment?.registrationNumber || "",
      className: student.enrollment?.schoolClassId?.name || "",
      section: student.enrollment?.sectionId?.name || "",
      rollNumber: student.enrollment?.rollNumber || "",
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().slice(0, 10) : "",
      gender: student.gender || "",
      motherTongue: c.motherTongue || "",
      socialCategory: c.socialCategory || "",
      minorityGroup: c.minorityGroup || "",
      pen: c.pen || "",
      apaarId: c.apaarId || "",
      apaarConsent: c.apaarConsent?.given ? "Yes" : "No",
      aadhaarOnFile: c.aadhaarOnFile ? "Yes" : "No",
      aadhaarLast4: c.aadhaarLast4 || "",
      cwsn: c.cwsn ? "Yes" : "No",
      cwsnType: c.cwsnType || "",
      bplCard: c.bplCard ? "Yes" : "No",
      rteAdmission: c.rteAdmission ? "Yes" : "No",
      rteCategory: c.rteCategory || "",
      fatherName: student.fatherInfo?.name || "",
      motherName: student.motherInfo?.name || "",
    };
  });
};
