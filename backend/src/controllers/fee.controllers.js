import mongoose from "mongoose";
import { Fees } from "../models/fees.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";

/* =====================================================
   ✅ CREATE FEES RECORD
===================================================== */
export const createFees = asyncHandler(async (req, res) => {

  const {
    studentId,
    amount,
    paymentMethod,
    transactionId,
    status,
    dueDate,
  } = req.body;

  if (!studentId || !amount || !paymentMethod || !transactionId || !dueDate) {
    throw new ApiError(400, "All fields are required");
  }

  // ✅ Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(studentId)) {
    throw new ApiError(400, "Invalid studentId");
  }

  const id = new mongoose.Types.ObjectId(studentId);

  // ✅ Fetch active enrollment
  const enrollment = await StudentEnrollment.findOne({
    _id: id,
    status: "Active",
  });

  console.log(enrollment);

  if (!enrollment) {
    throw new ApiError(404, "Active enrollment not found for this student");
  }

  // ✅ Create Fees record
  const newFees = await Fees.create({
    studentId: enrollment.studentId,
    academicYearId: enrollment.academicYearId,
    schoolId: enrollment.schoolId,
    classId: enrollment.classId,
    sectionId: enrollment.sectionId,
    amount,
    paymentMethod,
    transactionId,
    status: status || "pending",
    dueDate,
  });

  return res.status(201).json(
    new ApiResponse(201, newFees, "Fees record created")
  );
});


/* =====================================================
   ✅ GET ALL FEES (ADMIN DASHBOARD)
===================================================== */
export const getAllFees = asyncHandler(async (req, res) => {

  const {
    page = 1,
    limit = 10,
    search,
    status,
    paymentMethod,
    academicYearId,
    studentId,
    schoolId,
  } = req.query
  console.log("Get All Fees Query:", req.query);
  const filter = {
    schoolId: new mongoose.Types.ObjectId(schoolId)
  }

  if (status) filter.status = status
  if (paymentMethod) filter.paymentMethod = paymentMethod

   if (studentId && mongoose.isValidObjectId(studentId))
    filter.studentId = new mongoose.Types.ObjectId(studentId)
 
  if (academicYearId && mongoose.isValidObjectId(academicYearId))
    filter.academicYearId = new mongoose.Types.ObjectId(academicYearId)


  const pipeline = [

    { $match: filter },

    {
      $lookup: {
        from: "users",
        localField: "studentId",
        foreignField: "_id",
        as: "student"
      }
    },
    { $unwind: "$student" },

    ...(search ? [{
      $match: {
        $or: [
          { "student.name": { $regex: search, $options: "i" } },
          { transactionId: { $regex: search, $options: "i" } }
        ]
      }
    }] : []),

    { $sort: { createdAt: -1 } },

    { $skip: (page - 1) * limit },

    { $limit: +limit }
  ]

  const data = await Fees.aggregate(pipeline)

  const total = await Fees.countDocuments(filter)

  return res.json(
    new ApiResponse(200, {
      data,
      total,
      page: +page,
      limit: +limit,
    })
  )
})



/* =====================================================
   ✅ STUDENT FEES HISTORY
===================================================== */
export const getStudentFees = asyncHandler(async (req, res) => {

  const { studentId } = req.params

  if (!mongoose.isValidObjectId(studentId)) {
    throw new ApiError(400, "Invalid student ID")
  }

  const data = await Fees
    .find({
      schoolId: req.user.schoolId,
      studentId
    })
    .populate("academicYearId", "name")
    .sort({ dueDate: 1 })

  return res.json(new ApiResponse(200, data))
})



/* =====================================================
   ✅ UPDATE FEES
===================================================== */
export const updateFees = asyncHandler(async (req, res) => {

  const updated = await Fees.findOneAndUpdate(
    {
      _id: req.params.id,
      schoolId: req.user.schoolId
    },
    req.body,
    { new: true }
  )

  if (!updated) {
    throw new ApiError(404, "Fees record not found")
  }

  return res.json(
    new ApiResponse(200, updated, "Fees updated successfully")
  )
})



/* =====================================================
   ✅ DELETE FEES
===================================================== */
export const deleteFees = asyncHandler(async (req, res) => {

  const deleted = await Fees.findOneAndDelete({
    _id: req.params.id,
    schoolId: req.user.schoolId
  })

  if (!deleted) {
    throw new ApiError(404, "Fees record not found")
  }

  return res.json(
    new ApiResponse(200, null, "Fees deleted successfully")
  )
})



/* =====================================================
   ✅ FEES SUMMARY (DASHBOARD)
===================================================== */
export const getFeesSummary = asyncHandler(async (req, res) => {

  const summary = await Fees.aggregate([

    { $match: { schoolId: new mongoose.Types.ObjectId(req.user.schoolId) } },

    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        totalCount: { $sum: 1 },
      }
    }

  ])

  return res.json(new ApiResponse(200, summary))
})
