import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { SchoolClass } from "../models/schoolClass.model.js";
import { Section } from "../models/section.model.js";
import { Subject } from "../models/subject.model.js";
import { Substitution } from "../models/Substitution.model.js";
import { Teacher } from "../models/teacherAssignment.model.js";
import { TimeSlot } from "../models/TimeSlot.model.js";
import { Timetable } from "../models/Timetable.model.js";
import { User } from "../models/user.model.js";
import { Role } from "../models/Roles.model.js";

// Roles whose people take classes, and so can cover one.
const TEACHING_ROLES = ["Teacher", "Class Teacher", "Sports Teacher", "Subject Coordinator"];

/**
 * Works out who is missing on a given date, which periods that leaves uncovered, and who is
 * genuinely free to take each one.
 *
 * The scheduling question is asked against the recurring Timetable (by weekday) but answered for
 * a specific DATE, because availability depends on both: a teacher is free at a slot if the
 * weekly schedule leaves them free AND they haven't already picked up a cover on that date AND
 * they aren't themselves away.
 */

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** UTC midnight, so a date is one comparable value regardless of the caller's clock. */
export const normaliseDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const weekdayOf = (date) => DAYS[new Date(date).getUTCDay()];

/** Teachers with an approved leave covering this date. */
export const absentTeacherIdsOn = async ({ schoolId, date }) => {
  const leaves = await LeaveRequest.find({
    schoolId,
    status: "approved",
    startDate: { $lte: date },
    endDate: { $gte: date },
  })
    .select("userId _id")
    .lean();

  return leaves.map((l) => ({ teacherId: l.userId, leaveRequestId: l._id }));
};

/**
 * The teaching periods a given teacher holds on that weekday.
 *
 * Deliberately NOT populated. Populate REPLACES the field and yields null when the referenced
 * document is missing — which would lose the very subjectId the same-subject ranking below is
 * keyed on, silently degrading every suggestion the moment a subject is deleted. Raw ids are
 * kept and display names are resolved separately by decorate().
 */
const periodsForTeacher = ({ schoolId, academicYearId, teacherId, dayOfWeek }) =>
  Timetable.find({
    schoolId,
    academicYearId,
    teacherId,
    dayOfWeek,
    status: "active",
    type: { $in: ["regular", "activity"] },
  })
    .select("schoolClassId sectionId timeSlotId subjectId")
    .lean();

/** Batch-resolves display names for a set of rows, leaving the ids untouched. */
const buildNameMaps = async (rows) => {
  const ids = (field) => [...new Set(rows.map((r) => r[field]).filter(Boolean).map(String))];

  const [slots, subjects, classes, sections] = await Promise.all([
    TimeSlot.find({ _id: { $in: ids("timeSlotId") } }).select("name order").lean(),
    Subject.find({ _id: { $in: ids("subjectId") } }).select("name").lean(),
    SchoolClass.find({ _id: { $in: ids("schoolClassId") } }).select("name").lean(),
    Section.find({ _id: { $in: ids("sectionId") } }).select("name").lean(),
  ]);

  const toMap = (docs) => new Map(docs.map((d) => [String(d._id), d]));
  return {
    slots: toMap(slots),
    subjects: toMap(subjects),
    classes: toMap(classes),
    sections: toMap(sections),
  };
};

/**
 * Candidate substitutes for one period, best first.
 *
 * Ranked by: teaches this subject > fewest periods already that weekday > fewest covers already
 * taken that date. The load counts matter because otherwise the same handful of lightly-loaded
 * teachers absorb every cover in the school.
 */
export const suggestSubstitutes = async ({
  schoolId,
  academicYearId,
  date,
  dayOfWeek,
  timeSlotId,
  subjectId,
  excludeTeacherIds = [],
}) => {
  const excluded = new Set(excludeTeacherIds.map(String));

  // The candidate pool is every teacher of the school: the staff in a teaching role, plus anyone
  // on this year's sections or timetable. It used to be read only from the Teacher assignment
  // collection, which nothing but the seed script writes, so a teacher added through the app was
  // never offered (and could not be assigned: "That teacher is not free for this period"), and a
  // school that was not seeded had no substitutes at all.
  const roleIds = await Role.find({ name: { $in: TEACHING_ROLES } }).distinct("_id");
  const [staff, sections, timetableRows, assignments] = await Promise.all([
    User.find({ schoolId, roleId: { $in: roleIds }, isActive: { $ne: false } }).select("_id").lean(),
    Section.find({ schoolId, academicYearId }).select("classTeacherId subjects").lean(),
    Timetable.find({ schoolId, academicYearId, status: "active", teacherId: { $ne: null } }).select("teacherId subjectId").lean(),
    Teacher.find({ schoolId, academicYearId, status: "active" }).select("teacherId subjectId").lean(),
  ]);

  const subjectsOf = new Map();
  const note = (teacherId, subjectId) => {
    if (!teacherId) return;
    const key = String(teacherId);
    if (excluded.has(key)) return;
    if (!subjectsOf.has(key)) subjectsOf.set(key, new Set());
    if (subjectId) subjectsOf.get(key).add(String(subjectId));
  };
  staff.forEach((u) => note(u._id));
  for (const sec of sections) {
    note(sec.classTeacherId);
    (sec.subjects || []).forEach((x) => note(x.teacherId, x.subjectId));
  }
  timetableRows.forEach((r) => note(r.teacherId, r.subjectId));
  assignments.forEach((a) => note(a.teacherId, a.subjectId));
  if (subjectsOf.size === 0) return [];

  // Only people who still have an active account in this school.
  const people = await User.find({ _id: { $in: [...subjectsOf.keys()] }, schoolId, isActive: { $ne: false } })
    .select("name email")
    .lean();
  const pool = new Map(people.map((u) => [String(u._id), { teacher: u, subjectIds: subjectsOf.get(String(u._id)) }]));
  if (pool.size === 0) return [];

  const teacherIds = [...pool.keys()];

  const [busyRows, dayLoadRows, coversOnDate] = await Promise.all([
    // Already teaching at this exact slot on this weekday.
    Timetable.find({
      schoolId, academicYearId, dayOfWeek, timeSlotId, status: "active",
      teacherId: { $in: teacherIds },
    }).select("teacherId").lean(),
    // Total periods that weekday, for load balancing.
    Timetable.find({
      schoolId, academicYearId, dayOfWeek, status: "active",
      type: { $in: ["regular", "activity"] },
      teacherId: { $in: teacherIds },
    }).select("teacherId").lean(),
    // Covers already accepted on this date — both to exclude a clash at this slot and to spread
    // the load.
    Substitution.find({
      schoolId, date, status: { $ne: "cancelled" },
      substituteTeacherId: { $in: teacherIds },
    }).select("substituteTeacherId timeSlotId").lean(),
  ]);

  const busyAtSlot = new Set(busyRows.map((r) => String(r.teacherId)));
  for (const c of coversOnDate) {
    if (String(c.timeSlotId) === String(timeSlotId)) busyAtSlot.add(String(c.substituteTeacherId));
  }

  const dayLoad = new Map();
  for (const r of dayLoadRows) {
    const key = String(r.teacherId);
    dayLoad.set(key, (dayLoad.get(key) || 0) + 1);
  }

  const coverLoad = new Map();
  for (const c of coversOnDate) {
    const key = String(c.substituteTeacherId);
    coverLoad.set(key, (coverLoad.get(key) || 0) + 1);
  }

  const candidates = [];
  for (const [key, entry] of pool) {
    if (busyAtSlot.has(key)) continue;
    candidates.push({
      teacherId: entry.teacher._id,
      name: entry.teacher.name,
      email: entry.teacher.email,
      teachesSubject: subjectId ? entry.subjectIds.has(String(subjectId)) : false,
      periodsThatDay: dayLoad.get(key) || 0,
      coversThatDate: coverLoad.get(key) || 0,
    });
  }

  candidates.sort((a, b) => {
    if (a.teachesSubject !== b.teachesSubject) return a.teachesSubject ? -1 : 1;
    if (a.coversThatDate !== b.coversThatDate) return a.coversThatDate - b.coversThatDate;
    return a.periodsThatDay - b.periodsThatDay;
  });

  return candidates;
};

/**
 * The whole day's picture: every uncovered period left by every absent teacher, each with ranked
 * candidates, plus whatever has already been assigned.
 */
export const buildSubstitutionPlan = async ({ schoolId, academicYearId, date, extraAbsentTeacherIds = [] }) => {
  const dayOfWeek = weekdayOf(date);

  const onLeave = await absentTeacherIdsOn({ schoolId, date });
  const leaveByTeacher = new Map(onLeave.map((l) => [String(l.teacherId), l.leaveRequestId]));

  const absentIds = [
    ...new Set([...onLeave.map((l) => String(l.teacherId)), ...extraAbsentTeacherIds.map(String)]),
  ];
  if (!absentIds.length) return { date, dayOfWeek, absentTeachers: [], periods: [] };

  const existing = await Substitution.find({ schoolId, date, status: { $ne: "cancelled" } })
    .populate("substituteTeacherId", "name email")
    .lean();
  const existingByTimetable = new Map(existing.map((s) => [String(s.timetableId), s]));

  const periods = [];
  const absentTeachers = [];

  const rowsByTeacher = [];
  for (const absentId of absentIds) {
    const rows = await periodsForTeacher({ schoolId, academicYearId, teacherId: absentId, dayOfWeek });
    if (!rows.length) continue;
    absentTeachers.push({ teacherId: absentId, periods: rows.length, onLeave: leaveByTeacher.has(absentId) });
    rowsByTeacher.push({ absentId, rows });
  }

  const names = await buildNameMaps(rowsByTeacher.flatMap((r) => r.rows));

  for (const { absentId, rows } of rowsByTeacher) {
    for (const row of rows) {
      const already = existingByTimetable.get(String(row._id));
      periods.push({
        timetableId: row._id,
        schoolClassId: row.schoolClassId,
        className: names.classes.get(String(row.schoolClassId))?.name,
        sectionId: row.sectionId || null,
        sectionName: names.sections.get(String(row.sectionId))?.name,
        timeSlotId: row.timeSlotId,
        slotName: names.slots.get(String(row.timeSlotId))?.name,
        slotOrder: names.slots.get(String(row.timeSlotId))?.order ?? 0,
        subjectId: row.subjectId || null,
        subjectName: names.subjects.get(String(row.subjectId))?.name,
        absentTeacherId: absentId,
        leaveRequestId: leaveByTeacher.get(absentId) || null,
        assigned: already
          ? {
              substitutionId: already._id,
              substituteTeacherId: already.substituteTeacherId?._id || null,
              substituteName: already.substituteTeacherId?.name || null,
              status: already.status,
            }
          : null,
        // Only worth computing for periods still needing someone.
        candidates: already
          ? []
          : await suggestSubstitutes({
              schoolId,
              academicYearId,
              date,
              dayOfWeek,
              timeSlotId: row.timeSlotId,
              subjectId: row.subjectId,
              excludeTeacherIds: absentIds,
            }),
      });
    }
  }

  periods.sort((a, b) => a.slotOrder - b.slotOrder);
  return { date, dayOfWeek, absentTeachers, periods };
};
