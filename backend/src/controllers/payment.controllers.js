import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createPayment = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentId,
      installmentId,
      amountPaid,
      paymentMode,
      transactionId,
      receiptNo,
    } = req.body;

    /* ================= BASIC VALIDATION ================= */
    if (!studentId || !installmentId || !amountPaid || !paymentMode) {
      throw new ApiError(400, "Required fields missing");
    }

    if (!mongoose.Types.ObjectId.isValid(installmentId)) {
      throw new ApiError(400, "Invalid installment ID");
    }

    if (amountPaid <= 0) {
      throw new ApiError(400, "Amount must be greater than 0");
    }

    /* ================= FIND INSTALLMENT ================= */
    const installment = await FeeInstallment.findById(installmentId)
      .session(session);

    if (!installment) {
      throw new ApiError(404, "Installment not found");
    }

    /* ================= STUDENT SAFETY CHECK ================= */
    if (String(installment.studentId) !== String(studentId)) {
      throw new ApiError(403, "Student mismatch for installment");
    }

    /* ================= AMOUNT CALCULATION ================= */
    installment.paidAmount = installment.paidAmount || 0;

    const remainingAmount =
      installment.amount - installment.paidAmount;

    if (amountPaid > remainingAmount) {
      throw new ApiError(
        400,
        "Amount exceeds installment due"
      );
    }

    /* ================= CREATE PAYMENT ================= */
    const [payment] = await Payment.create(
      [
        {
          studentId,
          installmentId,
          amountPaid,
          paymentMode,
          transactionId: transactionId || null,
          receiptNo:
            receiptNo ||
            `RCPT-${Date.now()}-${Math.floor(
              Math.random() * 1000
            )}`,
        },
      ],
      { session }
    );

    /* ================= UPDATE INSTALLMENT ================= */
    installment.paidAmount += amountPaid;

    if (installment.paidAmount === installment.amount) {
      installment.status = "paid";
    } else {
      installment.status = "partial";
    }

    await installment.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json(
      new ApiResponse(
        201,
        payment,
        "Payment created successfully"
      )
    );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});


/* =====================================================
   ✅ GET PAYMENTS
   Role:
   - School Admin → All school payments
   - Student      → Own payments
   - Parent       → Child payments
===================================================== */
export const getPayments = asyncHandler(async (req, res) => {
  const {
    studentId,
    status = "paid",
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = req.query;

  const match = { status };

  /* 🔐 ROLE BASED FILTER */
  if (req.user.role.name === "Student") {
    // find studentId from userId
    const student = await Student.findOne({ userId: req.user._id });
    if (!student) throw new ApiError(404, "Student record not found");
    studentId = student._id;
  }

  if (req.user.role.name === "Parent") {
    if (!studentId) {
      throw new ApiError(400, "studentId is required for parent");
    }
    match.studentId = new mongoose.Types.ObjectId(studentId);
  }

  if (req.user.role.name === "School Admin") {
    match.schoolId = new mongoose.Types.ObjectId(req.user.school._id);
  }

  /* 📅 DATE FILTER */
  if (startDate || endDate) {
    match.paymentDate = {};
    if (startDate) match.paymentDate.$gte = new Date(startDate);
    if (endDate) match.paymentDate.$lte = new Date(endDate);
  }

  /* 🔎 AGGREGATION */
  const payments = await StudentFee.aggregate([
    { $match: match },
    // Student
    {
      $lookup: {
        from: "students",
        localField: "studentId",
        foreignField: "_id",
        as: "student",
      },
    },
    { $unwind: "$student" },

    // User
    {
      $lookup: {
        from: "users",
        localField: "student.userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },

    // Fee
    {
      $lookup: {
        from: "fees",
        localField: "feeId",
        foreignField: "_id",
        as: "fee",
      },
    },
    { $unwind: "$fee" },

    // Academic Year
    {
      $lookup: {
        from: "academicyears",
        localField: "fee.academicYearId",
        foreignField: "_id",
        as: "academicYear",
      },
    },
    { $unwind: "$academicYear" },

    { $sort: { paymentDate: -1 } },

    {
      $project: {
        _id: 1,
        transactionId: 1,
        paymentMethod: 1,
        paidAmount: 1,
        paymentDate: 1,

        student: {
          _id: "$student._id",
          registrationNumber: "$student.registrationNumber",
        },

        user: {
          name: "$user.name",
          email: "$user.email",
        },

        fee: {
          feeName: "$fee.feeName",
          amount: "$fee.amount",
        },

        academicYear: {
          name: "$academicYear.name",
        },
      },
    },

    /* 📄 Pagination */
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) },
  ]);

  return res.status(200).json(
    new ApiResponse(200, payments, "Payments fetched successfully")
  );
});

export const paymentSummary = asyncHandler(async (req, res) => {
  const summary = await StudentFee.aggregate([
    { $match: { status: "paid" } },
    {
      $group: {
        _id: "$paymentMethod",
        totalAmount: { $sum: "$paidAmount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return res.json(new ApiResponse(200, summary));
});

