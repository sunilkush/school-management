import { Circular } from "../models/Circular.model.js";
import { CircularAcknowledgement } from "../models/CircularAcknowledgement.model.js";
import { Role } from "../models/Roles.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { User } from "../models/user.model.js";

/**
 * Working out who a circular is for, and who has still not acknowledged it.
 */

/**
 * Expands an audience into actual people.
 *
 * How the two halves combine is the part worth knowing:
 *
 *   classes/sections alone  → the students in them AND their parents. A school circular addressed
 *                             to "Class 10" almost always means the families, not just the children.
 *   roles alone             → everyone holding those roles.
 *   both together           → the class audience, narrowed to those roles. "Parents of Class 10"
 *                             is the common case and cannot be said any other way.
 *   nothing at all          → everyone with an active account.
 *
 * Named user ids are always added on top, so a circular can go to a group plus two extra people.
 */
export const resolveRecipients = async ({ schoolId, audience = {}, academicYearId = null }) => {
  const { roles = [], schoolClassIds = [], sectionIds = [], userIds = [] } = audience;

  const roleIds = roles.length
    ? (await Role.find({ schoolId, name: { $in: roles } }).select("_id").lean()).map((r) => r._id)
    : [];

  const ids = new Set();
  const hasClassScope = schoolClassIds.length > 0 || sectionIds.length > 0;

  if (hasClassScope) {
    const enrollments = await StudentEnrollment.find({
      schoolId,
      status: "Active",
      ...(academicYearId ? { academicYearId } : {}),
      ...(schoolClassIds.length ? { schoolClassId: { $in: schoolClassIds } } : {}),
      ...(sectionIds.length ? { sectionId: { $in: sectionIds } } : {}),
    })
      .select("studentId")
      .lean();

    const students = await Student.find({ _id: { $in: enrollments.map((e) => e.studentId) } })
      .select("userId fatherId motherId guardianId")
      .lean();

    students.forEach((s) => {
      [s.userId, s.fatherId, s.motherId, s.guardianId].forEach((id) => { if (id) ids.add(String(id)); });
    });

    // Narrow to the named roles when both were given.
    if (roleIds.length) {
      const allowed = await User.find({ schoolId, _id: { $in: [...ids] }, roleId: { $in: roleIds } })
        .select("_id")
        .lean();
      const keep = new Set(allowed.map((u) => String(u._id)));
      [...ids].forEach((id) => { if (!keep.has(id)) ids.delete(id); });
    }
  } else if (roles.length) {
    // Keyed off `roles`, not `roleIds`. Naming a role that has no users — or misspelling one —
    // used to fall through to "everybody", which turns a notice meant for the hostel warden into
    // a school-wide broadcast. An audience that was specified and matched nobody must stay empty
    // so the publish step refuses it.
    const users = roleIds.length
      ? await User.find({ schoolId, roleId: { $in: roleIds }, isActive: true }).select("_id").lean()
      : [];
    users.forEach((u) => ids.add(String(u._id)));
  } else if (!userIds.length) {
    const users = await User.find({ schoolId, isActive: true }).select("_id").lean();
    users.forEach((u) => ids.add(String(u._id)));
  }

  userIds.forEach((id) => ids.add(String(id)));

  return [...ids];
};

/**
 * The next circular number for the school, per academic year.
 *
 * Sequential and quoted out loud — "as per circular 14" — so it has to read the way a school
 * writes it rather than being an id.
 */
export const nextCircularNumber = async ({ schoolId, academicYearId, yearLabel }) => {
  const label = yearLabel || String(new Date().getFullYear());
  const prefix = `CIR/${label}/`;

  const last = await Circular.findOne({
    schoolId,
    ...(academicYearId ? { academicYearId } : {}),
    circularNumber: new RegExp(`^${prefix.replace(/\//g, "\\/")}`),
  })
    .sort({ circularNumber: -1 })
    .select("circularNumber")
    .lean();

  const lastSeq = last ? parseInt(String(last.circularNumber).slice(prefix.length), 10) : 0;
  return `${prefix}${String((Number.isNaN(lastSeq) ? 0 : lastSeq) + 1).padStart(3, "0")}`;
};

/**
 * Where a circular stands: how many were told, how many opened it, how many actually agreed.
 *
 * Opened and acknowledged are reported separately on purpose. A school that reads "180 opened" as
 * "180 agreed" has drawn the wrong conclusion from its own data, and the two numbers being next to
 * each other is what stops that.
 */
export const acknowledgementStatus = async ({ schoolId, circularId }) => {
  const circular = await Circular.findOne({ _id: circularId, schoolId })
    .select("recipients recipientCount requiresAcknowledgement acknowledgementDeadline status")
    .lean();
  if (!circular) return null;

  const rows = await CircularAcknowledgement.find({ circularId })
    .select("userId viewedAt acknowledgedAt")
    .lean();

  const viewed = rows.filter((r) => r.viewedAt).length;
  const acknowledged = rows.filter((r) => r.acknowledgedAt).length;
  const total = circular.recipientCount || circular.recipients?.length || 0;

  return {
    total,
    viewed,
    acknowledged,
    pending: Math.max(0, total - acknowledged),
    requiresAcknowledgement: circular.requiresAcknowledgement,
    deadline: circular.acknowledgementDeadline,
    isOverdue: Boolean(
      circular.requiresAcknowledgement &&
      circular.acknowledgementDeadline &&
      new Date(circular.acknowledgementDeadline) < new Date() &&
      acknowledged < total
    ),
    percentAcknowledged: total ? Math.round((acknowledged / total) * 100) : 0,
  };
};

/**
 * Who has not acknowledged yet — the list somebody has to act on.
 *
 * Worked out from the snapshotted recipients, so it cannot drift as people join or leave the
 * school after the circular went out.
 */
export const pendingAcknowledgements = async ({ schoolId, circularId, limit = 500 }) => {
  const circular = await Circular.findOne({ _id: circularId, schoolId }).select("recipients").lean();
  if (!circular) return [];

  const done = await CircularAcknowledgement.find({ circularId, acknowledgedAt: { $ne: null } })
    .select("userId")
    .lean();
  const acknowledged = new Set(done.map((d) => String(d.userId)));

  const outstanding = (circular.recipients || []).filter((id) => !acknowledged.has(String(id)));

  const users = await User.find({ _id: { $in: outstanding.slice(0, limit) } })
    .populate("roleId", "name")
    .select("name email roleId")
    .lean();

  return users.map((u) => ({
    userId: u._id,
    name: u.name,
    email: u.email,
    role: u.roleId?.name || "",
  }));
};
