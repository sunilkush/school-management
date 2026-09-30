import { AcademicYear } from "../models/AcademicYear.model.js";
import { Attendance } from "../models/attendance.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { Section } from "../models/section.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

const LOW_ATTENDANCE = 75;
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);

/**
 * GET /report/teacher/overview?month=YYYY-MM
 *
 * A teacher's own classes this academic year — the sections they are class teacher of or teach a
 * subject in — with the month's student attendance, the students below 75%, and exam results.
 * This page used to list only "Report" documents the teacher had generated, which nothing in a
 * teacher's screens ever creates, so it was always empty.
 */
export const getTeacherOverview = asyncHandler(async (req, res) => {
  const schoolId = req.user.school?._id || req.user.schoolId;
  if (!schoolId) throw new ApiError(400, "School context is required");
  const me = req.user._id;

  const monthStr = /^\d{4}-\d{2}$/.test(String(req.query.month || "")) ? req.query.month : null;
  const now = new Date(Date.now() + 330 * 60000);
  const [y, m] = monthStr ? monthStr.split("-").map(Number) : [now.getUTCFullYear(), now.getUTCMonth() + 1];
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const month = `${y}-${String(m).padStart(2, "0")}`;

  const year = await AcademicYear.findOne({ schoolId, isActive: true }).select("_id name").lean();
  if (!year) {
    return sendSuccess(res, { message: "No active academic year", data: { month, academicYear: null, sections: [], lowAttendance: [], exams: [] } });
  }

  const sections = await Section.find({
    schoolId,
    academicYearId: year._id,
    $or: [{ classTeacherId: me }, { "subjects.teacherId": me }],
  })
    .populate("schoolClassId", "name")
    .populate("subjects.subjectId", "name")
    .lean();
  const sectionIds = sections.map((s) => s._id);

  const enrollments = await StudentEnrollment.find({ sectionId: { $in: sectionIds }, academicYearId: year._id, status: "Active" })
    .select("sectionId rollNumber studentId")
    .populate({ path: "studentId", select: "userId", populate: { path: "userId", select: "name" } })
    .lean();
  const studentsBySection = new Map(sectionIds.map((id) => [String(id), []]));
  for (const e of enrollments) {
    const user = e.studentId?.userId;
    if (!user) continue;
    studentsBySection.get(String(e.sectionId))?.push({ userId: String(user._id), name: user.name, rollNumber: e.rollNumber });
  }
  const allStudentIds = enrollments.map((e) => e.studentId?.userId?._id).filter(Boolean);

  const [attendance, results] = await Promise.all([
    Attendance.find({ schoolId, role: "student", userId: { $in: allStudentIds }, date: { $gte: from, $lt: to } })
      .select("userId date status")
      .lean(),
    ExamResult.find({ schoolId, academicYearId: year._id, sectionId: { $in: sectionIds } })
      .select("examId sectionId percentage resultStatus subjects")
      .populate("examId", "title examDate")
      .lean(),
  ]);

  const byStudent = new Map();
  for (const a of attendance) {
    const k = String(a.userId);
    if (!byStudent.has(k)) byStudent.set(k, { present: 0, late: 0, halfday: 0, absent: 0, leave: 0, days: 0, dates: new Set() });
    const s = byStudent.get(k);
    s[a.status] = (s[a.status] || 0) + 1;
    s.days += 1;
    s.dates.add(new Date(a.date).toISOString().slice(0, 10));
  }
  const attended = (s) => s.present + s.late + s.halfday * 0.5;

  const lowAttendance = [];
  const sectionRows = sections.map((sec) => {
    const students = studentsBySection.get(String(sec._id)) || [];
    const totals = { present: 0, late: 0, halfday: 0, absent: 0, leave: 0, days: 0 };
    const markedDates = new Set();
    for (const st of students) {
      const s = byStudent.get(st.userId);
      if (!s) continue;
      for (const k of Object.keys(totals)) totals[k] += s[k] || 0;
      s.dates.forEach((d) => markedDates.add(d));
      const p = pct(attended(s), s.days);
      if (s.days >= 3 && p !== null && p < LOW_ATTENDANCE) {
        lowAttendance.push({
          name: st.name, rollNumber: st.rollNumber, className: sec.schoolClassId?.name || "", sectionName: sec.name,
          attendancePct: p, absent: s.absent, days: s.days,
        });
      }
    }
    const mySubjects = (sec.subjects || [])
      .filter((x) => String(x.teacherId) === String(me))
      .map((x) => x.subjectId?.name)
      .filter(Boolean);
    return {
      sectionId: sec._id,
      className: sec.schoolClassId?.name || "",
      sectionName: sec.name,
      isClassTeacher: String(sec.classTeacherId) === String(me),
      mySubjects,
      students: students.length,
      markedDays: markedDates.size,
      attendancePct: pct(attended(totals), totals.days),
      ...totals,
    };
  });
  lowAttendance.sort((a, b) => a.attendancePct - b.attendancePct);

  // Exams: per exam and section, the class average, pass rate, and the average in the subjects
  // this teacher teaches there.
  const mySubjectIds = new Map(
    sections.map((sec) => [String(sec._id), new Set((sec.subjects || []).filter((x) => String(x.teacherId) === String(me)).map((x) => String(x.subjectId?._id || x.subjectId)))])
  );
  const secById = new Map(sections.map((s) => [String(s._id), s]));
  const examGroups = new Map();
  for (const r of results) {
    const key = `${r.examId?._id}|${r.sectionId}`;
    if (!examGroups.has(key)) {
      const sec = secById.get(String(r.sectionId));
      examGroups.set(key, {
        examName: r.examId?.title || "Exam",
        examDate: r.examId?.examDate || null,
        className: sec?.schoolClassId?.name || "",
        sectionName: sec?.name || "",
        students: 0, pctSum: 0, passed: 0, subj: new Map(),
      });
    }
    const g = examGroups.get(key);
    g.students += 1;
    g.pctSum += Number(r.percentage || 0);
    if (r.resultStatus === "PASS") g.passed += 1;
    const mine = mySubjectIds.get(String(r.sectionId)) || new Set();
    for (const s of r.subjects || []) {
      if (!mine.has(String(s.subjectId))) continue;
      const k = s.subjectName || String(s.subjectId);
      if (!g.subj.has(k)) g.subj.set(k, { sum: 0, n: 0 });
      const x = g.subj.get(k);
      x.sum += s.totalMarks ? (s.obtainedMarks / s.totalMarks) * 100 : 0;
      x.n += 1;
    }
  }
  const exams = [...examGroups.values()]
    .map((g) => ({
      examName: g.examName, examDate: g.examDate, className: g.className, sectionName: g.sectionName,
      students: g.students,
      avgPct: Math.round((g.pctSum / g.students) * 10) / 10,
      passPct: pct(g.passed, g.students),
      mySubjects: [...g.subj.entries()].map(([name, x]) => ({ name, avgPct: Math.round((x.sum / x.n) * 10) / 10 })),
    }))
    .sort((a, b) => new Date(b.examDate || 0) - new Date(a.examDate || 0));

  return sendSuccess(res, {
    message: "Teacher overview fetched",
    data: { month, academicYear: year.name, sections: sectionRows, lowAttendance: lowAttendance.slice(0, 50), exams },
  });
});
