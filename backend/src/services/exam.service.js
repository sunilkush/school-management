import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Exam } from "../models/Exam.model.js";
import { ExamClass } from "../models/ExamClass.model.js";
import { Marks } from "../models/Marks.model.js";
import { ExamResult } from "../models/ExamResult.model.js";
import { Student } from "../models/student.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

const OBJECT_ID = mongoose.Types.ObjectId;

const getGradeFromPercentage = (percentage) => {
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 50) return "C";
  return "Fail";
};

const resolveScope = async ({ user, studentId }) => {
  if (user?.roleId?.name === "Student") {
    return { studentId: user._id };
  }

  if (user?.roleId?.name === "Parent") {
    const query = { $or: [{ fatherId: user._id }, { motherId: user._id }, { guardianId: user._id }] };
    if (studentId) query.userId = new OBJECT_ID(studentId);

    const child = await Student.findOne(query).select("userId").lean();
    if (!child) throw new ApiError(404, "Child not found for this parent");
    return { studentId: child.userId };
  }

  if (!studentId) throw new ApiError(400, "studentId is required");
  return { studentId: new OBJECT_ID(studentId) };
};

export const createExamService = async ({ body, user }) => {
  const payload = {
    ...body,
    title: body.name || body.title,
    createdBy: user._id,
    schoolId: user.roleId?.name === "Super Admin" ? body.schoolId : user.schoolId,
  };

  if (!payload.title || !payload.schoolClassId || !payload.subjectId || !payload.examDate) {
    throw new ApiError(400, "name/title, schoolClassId, subjectId and examDate are required");
  }

  if (!payload.totalMarks || payload.passingMarks === undefined) {
    throw new ApiError(400, "totalMarks and passingMarks are required");
  }

  const exam = await Exam.create(payload);
  return exam;
};

export const getExamsService = async ({ query, user }) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const filters = {};
  if (user.roleId?.name !== "Super Admin") filters.schoolId = user.schoolId;
  if (query.schoolId && user.roleId?.name === "Super Admin") filters.schoolId = query.schoolId;
  if (query.academicYearId) filters.academicYearId = query.academicYearId;
  if (query.schoolClassId) filters.schoolClassId = query.schoolClassId;
  if (query.sectionId) filters.sectionId = query.sectionId;
  if (query.subjectId) filters.subjectId = query.subjectId;
  if (query.status) filters.status = query.status;

  if (query.search) {
    filters.title = { $regex: query.search.trim(), $options: "i" };
  }

  if (user.roleId?.name === "Student") {
    const enrollment = await StudentEnrollment.findOne({ studentId: user._id, status: "Active" })
      .sort({ createdAt: -1 })
      .select("schoolClassId sectionId")
      .lean();

    if (enrollment) {
      filters.schoolClassId = enrollment.schoolClassId;
      filters.sectionId = enrollment.sectionId;
    }
  }

  const sortField = ["examDate", "totalMarks", "createdAt"].includes(query.sortBy)
    ? query.sortBy
    : "examDate";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  const [total, exams] = await Promise.all([
    Exam.countDocuments(filters),
    Exam.find(filters)
      .sort({ [sortField]: sortOrder, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("schoolClassId", "name")
      .populate("sectionId", "name")
      .populate("subjectId", "name")
      .lean(),
  ]);

  return {
    exams,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const assignExamToClassService = async ({ body, user }) => {
  const exam = await Exam.findById(body.examId).select("schoolId totalMarks passingMarks").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  if (user.roleId?.name !== "Super Admin" && `${exam.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Forbidden for this school exam");
  }

  const assignment = await ExamClass.findOneAndUpdate(
    { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    {
      $set: {
        schoolId: exam.schoolId,
        totalMarks: body.totalMarks ?? exam.totalMarks,
        passingMarks: body.passingMarks ?? exam.passingMarks,
      },
      $setOnInsert: { examId: body.examId, schoolClassId: body.schoolClassId, sectionId: body.sectionId || null },
    },
    { new: true, upsert: true }
  ).lean();

  return assignment;
};

export const enterMarksBulkService = async ({ body, user }) => {
  const { examId, marks = [] } = body;
  if (!examId || !Array.isArray(marks) || !marks.length) {
    throw new ApiError(400, "examId and non-empty marks array are required");
  }

  const exam = await Exam.findById(examId).select("schoolId academicYearId subjectId").lean();
  if (!exam) throw new ApiError(404, "Exam not found");

  const bulkOps = marks.map((entry) => ({
    updateOne: {
      filter: { examId, studentId: entry.studentId, subjectId: entry.subjectId || exam.subjectId },
      update: {
        $set: {
          schoolId: exam.schoolId,
          academicYearId: exam.academicYearId,
          schoolClassId: entry.schoolClassId,
          sectionId: entry.sectionId || null,
          totalMarks: Number(entry.totalMarks),
          passingMarks: Number(entry.passingMarks),
          obtainedMarks: Number(entry.obtainedMarks),
          updatedBy: user._id,
        },
        $setOnInsert: {
          examId,
          studentId: entry.studentId,
          subjectId: entry.subjectId || exam.subjectId,
          enteredBy: user._id,
        },
      },
      upsert: true,
    },
  }));

  const result = await Marks.bulkWrite(bulkOps, { ordered: false });
  return result;
};

export const updateMarksService = async ({ markId, body, user }) => {
  const mark = await Marks.findById(markId);
  if (!mark) throw new ApiError(404, "Marks not found");
  if (mark.isFinalSubmitted) throw new ApiError(400, "Final marks already submitted");

  if (user.roleId?.name !== "Super Admin" && `${mark.schoolId}` !== `${user.schoolId}`) {
    throw new ApiError(403, "Not allowed");
  }

  if (body.obtainedMarks !== undefined) mark.obtainedMarks = Number(body.obtainedMarks);
  if (body.totalMarks !== undefined) mark.totalMarks = Number(body.totalMarks);
  if (body.passingMarks !== undefined) mark.passingMarks = Number(body.passingMarks);
  mark.updatedBy = user._id;
  await mark.save();
  return mark.toObject();
};

export const submitFinalMarksService = async ({ body, user }) => {
  const filter = {
    examId: body.examId,
    schoolClassId: body.schoolClassId,
    sectionId: body.sectionId || null,
    schoolId: user.schoolId,
  };

  const update = await Marks.updateMany(filter, { $set: { isFinalSubmitted: true, updatedBy: user._id } });
  return update;
};

const studentResultPipeline = ({ match }) => [
  { $match: match },
  {
    $lookup: {
      from: "subjects",
      localField: "subjectId",
      foreignField: "_id",
      as: "subject",
    },
  },
  { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: { examId: "$examId", studentId: "$studentId", schoolClassId: "$schoolClassId", sectionId: "$sectionId" },
      schoolId: { $first: "$schoolId" },
      academicYearId: { $first: "$academicYearId" },
      subjects: {
        $push: {
          subjectId: "$subjectId",
          subjectName: "$subject.name",
          obtainedMarks: "$obtainedMarks",
          totalMarks: "$totalMarks",
          passingMarks: "$passingMarks",
          isPassed: { $gte: ["$obtainedMarks", "$passingMarks"] },
        },
      },
      totalObtainedMarks: { $sum: "$obtainedMarks" },
      totalMaximumMarks: { $sum: "$totalMarks" },
      allPassed: { $min: { $gte: ["$obtainedMarks", "$passingMarks"] } },
    },
  },
  {
    $addFields: {
      percentage: {
        $cond: [
          { $gt: ["$totalMaximumMarks", 0] },
          { $round: [{ $multiply: [{ $divide: ["$totalObtainedMarks", "$totalMaximumMarks"] }, 100] }, 2] },
          0,
        ],
      },
    },
  },
];

export const publishResultService = async ({ body, user }) => {
  const baseMatch = {
    examId: new OBJECT_ID(body.examId),
    schoolClassId: new OBJECT_ID(body.schoolClassId),
    schoolId: new OBJECT_ID(user.schoolId),
    isFinalSubmitted: true,
  };

  if (body.sectionId) baseMatch.sectionId = new OBJECT_ID(body.sectionId);

  const aggregated = await Marks.aggregate(studentResultPipeline({ match: baseMatch }));

  if (!aggregated.length) throw new ApiError(404, "No finalized marks found");

  const sorted = [...aggregated].sort((a, b) => b.totalObtainedMarks - a.totalObtainedMarks);
  const rankMap = new Map(sorted.map((item, idx) => [`${item._id.studentId}`, idx + 1]));

  const ops = aggregated.map((row) => {
    const percentage = row.percentage || 0;
    const grade = getGradeFromPercentage(percentage);
    const resultStatus = row.allPassed ? "PASS" : "FAIL";

    return {
      updateOne: {
        filter: {
          schoolId: row.schoolId,
          examId: row._id.examId,
          studentId: row._id.studentId,
        },
        update: {
          $set: {
            academicYearId: row.academicYearId,
            schoolClassId: row._id.schoolClassId,
            sectionId: row._id.sectionId,
            subjects: row.subjects,
            totalObtainedMarks: row.totalObtainedMarks,
            totalMaximumMarks: row.totalMaximumMarks,
            percentage,
            grade,
            resultStatus,
            rank: rankMap.get(`${row._id.studentId}`) || null,
            isPublished: body.publish !== false,
            publishedAt: body.publish === false ? null : new Date(),
            publishedBy: body.publish === false ? null : user._id,
          },
          $setOnInsert: {
            schoolId: row.schoolId,
            examId: row._id.examId,
            studentId: row._id.studentId,
          },
        },
        upsert: true,
      },
    };
  });

  await ExamResult.bulkWrite(ops, { ordered: false });

  return {
    processed: aggregated.length,
    isPublished: body.publish !== false,
  };
};

export const getStudentResultService = async ({ query, user, studentId }) => {
  const scope = await resolveScope({ user, studentId });
  const filters = { studentId: scope.studentId };

  if (query.examId) filters.examId = query.examId;
  if (user.roleId?.name === "Student" || user.roleId?.name === "Parent") {
    filters.isPublished = true;
  }

  const data = await ExamResult.find(filters)
    .sort({ createdAt: -1 })
    .populate("examId", "title examDate")
    .populate("schoolClassId", "name")
    .lean();

  return data;
};

export const getClassResultSummaryService = async ({ query, user }) => {
  const match = {
    schoolId: new OBJECT_ID(user.schoolId),
    examId: new OBJECT_ID(query.examId),
    schoolClassId: new OBJECT_ID(query.schoolClassId),
    isPublished: true,
  };

  if (query.sectionId) match.sectionId = new OBJECT_ID(query.sectionId);

  const [summary] = await ExamResult.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$examId",
        students: { $sum: 1 },
        passCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "PASS"] }, 1, 0] } },
        failCount: { $sum: { $cond: [{ $eq: ["$resultStatus", "FAIL"] }, 1, 0] } },
        averagePercentage: { $avg: "$percentage" },
        topper: {
          $top: {
            output: {
              studentId: "$studentId",
              totalObtainedMarks: "$totalObtainedMarks",
              percentage: "$percentage",
            },
            sortBy: { totalObtainedMarks: -1 },
          },
        },
      },
    },
    {
      $addFields: {
        passPercentage: {
          $cond: [
            { $gt: ["$students", 0] },
            { $round: [{ $multiply: [{ $divide: ["$passCount", "$students"] }, 100] }, 2] },
            0,
          ],
        },
      },
    },
  ]);

  return summary || { students: 0, passCount: 0, failCount: 0, averagePercentage: 0, passPercentage: 0 };
};
