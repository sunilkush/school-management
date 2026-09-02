import { ClassSubject } from "../models/SchoolClassSubject.model.js";
import { TimeSlot } from "../models/TimeSlot.model.js";
import { Timetable } from "../models/Timetable.model.js";

/**
 * Builds a clash-free weekly timetable from the per-class subject plan.
 *
 * Inputs already exist in the system: SchoolClassSubject carries `periodPerWeek` and the
 * `teacherId` who teaches that subject to that class/section, and TimeSlot defines the day's
 * shape. Nothing new has to be configured.
 *
 * The hard constraint is that a teacher cannot be in two rooms at once — and that is a GLOBAL
 * property, not a per-class one. So generation holds one busy-map across every section it is
 * asked to build AND every section it is not (their existing rows are loaded and treated as
 * fixed), otherwise generating 6A would happily double-book a teacher already committed to 6B.
 *
 * Placement is greedy: at each slot, take the subject with the most periods still owed whose
 * teacher is free. Greedy can paint itself into a corner, so unfilled slots and unmet demand are
 * REPORTED rather than hidden — a partial timetable a human can finish beats a silent lie.
 */

const DEFAULT_WORKING_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const keyOf = (teacherId, day, slotId) => `${teacherId}|${day}|${slotId}`;

export const generateTimetable = async ({
  schoolId,
  academicYearId,
  targets = [],
  workingDays = DEFAULT_WORKING_DAYS,
  avoidSameSubjectTwiceADay = true,
}) => {
  if (!targets.length) return { entries: [], unmet: [], filledSlots: 0, totalSlots: 0 };

  const days = workingDays.filter((d) => DEFAULT_WORKING_DAYS.includes(d));

  // Only genuinely teachable slots — breaks, lunch and assembly are part of the day's shape but
  // nothing is scheduled into them.
  const slots = await TimeSlot.find({ schoolId, academicYearId, isActive: true, type: "period" })
    .sort({ order: 1 })
    .lean();
  if (!slots.length) return { entries: [], unmet: [], filledSlots: 0, totalSlots: 0, reason: "No period time-slots configured" };

  const targetKeys = new Set(targets.map((t) => `${t.schoolClassId}|${t.sectionId || "null"}`));

  // Existing rows for sections we are NOT regenerating: their teacher bookings are immovable.
  const existing = await Timetable.find({
    schoolId, academicYearId, status: "active",
    teacherId: { $ne: null },
  }).select("teacherId dayOfWeek timeSlotId schoolClassId sectionId").lean();

  const busy = new Set();
  for (const row of existing) {
    const rowKey = `${row.schoolClassId}|${row.sectionId || "null"}`;
    if (targetKeys.has(rowKey)) continue;          // being rebuilt — its bookings are released
    busy.add(keyOf(row.teacherId, row.dayOfWeek, row.timeSlotId));
  }

  const entries = [];
  const unmet = [];
  let filledSlots = 0;

  for (const target of targets) {
    const { schoolClassId, sectionId = null } = target;

    const plan = await ClassSubject.find({
      schoolId,
      academicYearId,
      schoolClassId,
      ...(sectionId ? { sectionId } : {}),
      status: "active",
    })
      .select("subjectId teacherId periodPerWeek")
      .lean();

    // Demand: how many periods each subject still owes, and who teaches it here.
    const demand = plan
      .filter((p) => p.teacherId && p.periodPerWeek > 0)
      .map((p) => ({
        subjectId: p.subjectId,
        teacherId: p.teacherId,
        remaining: p.periodPerWeek,
        requested: p.periodPerWeek,
        placedOnDay: new Set(),
      }));

    for (const day of days) {
      for (const d of demand) d.placedOnDay.delete(day);

      for (const slot of slots) {
        // Most-owed first; a subject already placed today is deprioritised rather than banned, so
        // a tight plan still fills the slot instead of leaving a hole.
        const candidates = demand
          .filter((d) => d.remaining > 0 && !busy.has(keyOf(d.teacherId, day, slot._id)))
          .sort((a, b) => {
            if (avoidSameSubjectTwiceADay) {
              const aToday = a.placedOnDay.has(day) ? 1 : 0;
              const bToday = b.placedOnDay.has(day) ? 1 : 0;
              if (aToday !== bToday) return aToday - bToday;
            }
            return b.remaining - a.remaining;
          });

        const pick = candidates[0];
        if (!pick) continue;                       // nothing legal here — left for a human

        entries.push({
          schoolId,
          academicYearId,
          schoolClassId,
          sectionId,
          dayOfWeek: day,
          timeSlotId: slot._id,
          subjectId: pick.subjectId,
          teacherId: pick.teacherId,
          type: "regular",
          status: "active",
        });

        busy.add(keyOf(pick.teacherId, day, slot._id));
        pick.remaining -= 1;
        pick.placedOnDay.add(day);
        filledSlots += 1;
      }
    }

    for (const d of demand) {
      if (d.remaining > 0) {
        unmet.push({
          schoolClassId,
          sectionId,
          subjectId: d.subjectId,
          teacherId: d.teacherId,
          requested: d.requested,
          placed: d.requested - d.remaining,
          shortfall: d.remaining,
        });
      }
    }
  }

  return {
    entries,
    unmet,
    filledSlots,
    totalSlots: targets.length * days.length * slots.length,
  };
};

/** Replaces the generated sections' rows in one go. Only the targeted sections are touched. */
export const commitGeneratedTimetable = async ({ schoolId, academicYearId, targets, entries, createdBy }) => {
  const conditions = targets.map((t) => ({
    schoolClassId: t.schoolClassId,
    ...(t.sectionId ? { sectionId: t.sectionId } : {}),
  }));

  await Timetable.deleteMany({ schoolId, academicYearId, $or: conditions });
  if (!entries.length) return 0;

  await Timetable.insertMany(entries.map((e) => ({ ...e, createdBy })));
  return entries.length;
};
