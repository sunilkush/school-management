import { Attendance } from "../models/attendance.model.js";
import { Exam } from "../models/Exam.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { ReportCard } from "../models/ReportCard.model.js";
import { getGradeBands, resolveGrade } from "./gradingScale.service.js";

/**
 * Builds consolidated report cards for one class/section from the ExamResult documents of the
 * exams named on a ReportCardTemplate.
 *
 * Weighting rule: a subject's percentage is the weighted mean over the components the student
 * ACTUALLY has a result for, normalised by those components' weights — not by the template's
 * full weight total. A pupil who missed the half-yearly is therefore scored on the exams they
 * sat, rather than being silently pushed toward zero for an absence the card doesn't explain.
 */

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Weighted mean of obtained/total, plus the same weighting applied to the passing marks so the
 *  pass decision is made on a like-for-like basis. */
const weighSubject = (components) => {
  let weightSum = 0;
  let obtainedShare = 0;
  let passingShare = 0;

  for (const c of components) {
    if (!c.totalMarks || c.weightage <= 0) continue;
    weightSum += c.weightage;
    obtainedShare += (c.obtainedMarks / c.totalMarks) * c.weightage;
    passingShare += ((c.passingMarks || 0) / c.totalMarks) * c.weightage;
  }

  if (weightSum === 0) return { percentage: 0, passingPercentage: 0, isPassed: false };

  return {
    percentage: round2((obtainedShare / weightSum) * 100),
    passingPercentage: round2((passingShare / weightSum) * 100),
    isPassed: obtainedShare >= passingShare,
  };
};

/** present / (present + absent + late + halfday + leave), counting anything that put the child
 *  in school as attendance — the same treatment autoCheckout.job.js gives these statuses. */
const attendanceFor = async ({ schoolId, studentIds, from, to }) => {
  const byStudent = new Map(studentIds.map((id) => [String(id), { presentDays: 0, totalDays: 0, percentage: 0 }]));
  if (!from || !to) return byStudent;

  const rows = await Attendance.aggregate([
    {
      $match: {
        schoolId,
        role: "student",
        userId: { $in: studentIds },
        date: { $gte: new Date(from), $lte: new Date(to) },
      },
    },
    { $group: { _id: { userId: "$userId", status: "$status" }, count: { $sum: 1 } } },
  ]);

  for (const row of rows) {
    const key = String(row._id.userId);
    const entry = byStudent.get(key);
    if (!entry) continue;
    entry.totalDays += row.count;
    if (["present", "late", "halfday"].includes(row._id.status)) entry.presentDays += row.count;
  }

  for (const entry of byStudent.values()) {
    entry.percentage = entry.totalDays ? round2((entry.presentDays / entry.totalDays) * 100) : 0;
  }
  return byStudent;
};

/** Dense ranking by percentage — equal percentages share a rank, and the next distinct value
 *  takes the position after them (1, 2, 2, 4), which is how rank lists are read. */
const assignRanks = (cards) => {
  const sorted = [...cards].sort((a, b) => b.totals.percentage - a.totals.percentage);
  let lastPercentage = null;
  let lastRank = 0;
  sorted.forEach((card, index) => {
    if (card.totals.percentage !== lastPercentage) {
      lastRank = index + 1;
      lastPercentage = card.totals.percentage;
    }
    card.rank = lastRank;
  });
};

export const generateReportCards = async ({
  template,
  schoolClassId,
  sectionId = null,
  generatedBy = null,
}) => {
  const schoolId = template.schoolId;
  const examIds = template.exams.map((e) => e.examId);
  if (!examIds.length) {
    return { generated: 0, skippedPublished: 0, cards: [] };
  }

  const weightByExam = new Map(template.exams.map((e) => [String(e.examId), e.weightage]));

  const resultFilter = {
    schoolId,
    examId: { $in: examIds },
    schoolClassId,
    ...(sectionId ? { sectionId } : {}),
  };

  // Exam titles are looked up separately rather than via .populate("examId"). Populate REPLACES
  // the field, and yields null when the referenced Exam no longer exists — which lost the id the
  // weightage is keyed on, so every component silently fell to weight 0 and every card came out
  // as 0%. Keeping the raw ObjectId means a deleted exam only costs us its display name.
  const [results, exams] = await Promise.all([
    ExamResult.find(resultFilter).lean(),
    Exam.find({ _id: { $in: examIds } }).select("title").lean(),
  ]);
  const nameByExam = new Map(exams.map((e) => [String(e._id), e.title]));

  // studentId -> subjectId -> components[]
  const byStudent = new Map();
  for (const result of results) {
    const studentKey = String(result.studentId);
    if (!byStudent.has(studentKey)) byStudent.set(studentKey, { studentId: result.studentId, sectionId: result.sectionId, subjects: new Map() });
    const bucket = byStudent.get(studentKey);

    const examKey = String(result.examId);
    const examName = nameByExam.get(examKey) || "Exam";
    const weightage = weightByExam.get(examKey) ?? 0;

    for (const subject of result.subjects || []) {
      const subjectKey = String(subject.subjectId);
      if (!bucket.subjects.has(subjectKey)) {
        bucket.subjects.set(subjectKey, { subjectId: subject.subjectId, subjectName: subject.subjectName, components: [] });
      }
      bucket.subjects.get(subjectKey).components.push({
        examId: result.examId,
        examName,
        obtainedMarks: subject.obtainedMarks,
        totalMarks: subject.totalMarks,
        passingMarks: subject.passingMarks || 0,
        weightage,
      });
    }
  }

  if (byStudent.size === 0) return { generated: 0, skippedPublished: 0, cards: [] };

  const bands = await getGradeBands(schoolId);
  const studentIds = [...byStudent.values()].map((b) => b.studentId);
  const attendanceByStudent = await attendanceFor({
    schoolId,
    studentIds,
    from: template.attendanceFrom,
    to: template.attendanceTo,
  });

  // Existing cards are read first so a re-generation refreshes the marks without discarding the
  // co-scholastic grades and remarks a class teacher has already entered by hand.
  const existing = await ReportCard.find({ schoolId, templateId: template._id, studentId: { $in: studentIds } }).lean();
  const existingByStudent = new Map(existing.map((c) => [String(c.studentId), c]));

  const drafts = [];
  let skippedPublished = 0;

  for (const bucket of byStudent.values()) {
    const prior = existingByStudent.get(String(bucket.studentId));
    // A published card is a document that has already gone out to a parent; refreshing it
    // underneath them would change history. Un-publish it first to re-generate.
    if (prior?.isPublished) {
      skippedPublished += 1;
      continue;
    }

    const subjects = [];
    let obtainedSum = 0;
    let maximumSum = 0;

    for (const subject of bucket.subjects.values()) {
      const { percentage, isPassed } = weighSubject(subject.components);
      subjects.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        components: subject.components,
        weightedPercentage: percentage,
        grade: resolveGrade(percentage, bands),
        isPassed,
      });
      for (const c of subject.components) {
        obtainedSum += c.obtainedMarks;
        maximumSum += c.totalMarks;
      }
    }

    // Overall percentage is the mean of the subject percentages, so every subject counts equally
    // regardless of how many marks it happened to be out of.
    const overall = subjects.length
      ? round2(subjects.reduce((sum, s) => sum + s.weightedPercentage, 0) / subjects.length)
      : 0;

    const priorCoScholastic = new Map((prior?.coScholastic || []).map((c) => [c.area, c.grade]));

    drafts.push({
      schoolId,
      academicYearId: template.academicYearId,
      templateId: template._id,
      studentId: bucket.studentId,
      schoolClassId,
      sectionId: sectionId || bucket.sectionId || null,
      subjects,
      // Template areas define the shape; any grade already entered for an area is carried over.
      coScholastic: (template.coScholasticAreas || []).map((area) => ({
        area: area.name,
        grade: priorCoScholastic.get(area.name) || "",
      })),
      attendance: attendanceByStudent.get(String(bucket.studentId)) || { presentDays: 0, totalDays: 0, percentage: 0 },
      totals: {
        obtainedMarks: round2(obtainedSum),
        maximumMarks: round2(maximumSum),
        percentage: overall,
        grade: resolveGrade(overall, bands),
        resultStatus: subjects.length && subjects.every((s) => s.isPassed) ? "PASS" : "FAIL",
      },
      classTeacherRemarks: prior?.classTeacherRemarks || "",
      generatedAt: new Date(),
      generatedBy,
      isPublished: false,
    });
  }

  assignRanks(drafts);

  if (drafts.length) {
    await ReportCard.bulkWrite(
      drafts.map((doc) => ({
        updateOne: {
          filter: { schoolId, templateId: template._id, studentId: doc.studentId },
          update: { $set: doc },
          upsert: true,
        },
      }))
    );
  }

  return { generated: drafts.length, skippedPublished, cards: drafts };
};
