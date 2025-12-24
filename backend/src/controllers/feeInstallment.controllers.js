import { FeeInstallment } from "../models/feeInstallment.model.js";
import { StudentFee } from "../models/studentFee.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* =====================================================
   ✅ AUTO GENERATE INSTALLMENTS
===================================================== */
export const generateInstallments = asyncHandler(async (req, res) => {
  const { studentFeeId, startDate } = req.body;

  const studentFee = await StudentFee.findById(studentFeeId)
    .populate("feeStructureId");

  if (!studentFee) {
    throw new ApiError(404, "Student fee not found");
  }

  const { frequency, amount } = studentFee.feeStructureId;

  let installments = [];
  const baseDate = new Date(startDate);

  if (frequency === "monthly") {
    for (let i = 0; i < 12; i++) {
      installments.push({
        studentFeeId,
        installmentName: baseDate.toLocaleString("default", {
          month: "short",
        }),
        amount,
        dueDate: new Date(baseDate),
      });
      baseDate.setMonth(baseDate.getMonth() + 1);
    }
  }

  if (frequency === "quarterly") {
    for (let i = 1; i <= 4; i++) {
      installments.push({
        studentFeeId,
        installmentName: `Q${i}`,
        amount,
        dueDate: new Date(baseDate),
      });
      baseDate.setMonth(baseDate.getMonth() + 3);
    }
  }

  if (frequency === "yearly") {
    installments.push({
      studentFeeId,
      installmentName: "Yearly",
      amount,
      dueDate: baseDate,
    });
  }

  await FeeInstallment.insertMany(installments);

  return res.status(201).json(
    new ApiResponse(
      201,
      installments,
      "Installments generated successfully"
    )
  );
});
