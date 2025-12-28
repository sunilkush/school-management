import { FeeInstallment } from "../models/feeInstallment.model.js";

export const generateInstallments = async ({
  studentFee,
}) => {
  const {
    _id: studentFeeId,
    schoolId,
    academicYearId,
    studentId,
    totalAmount,
    frequency,
    startDate,
  } = studentFee;

  let installments = [];

  if (frequency === "monthly") {
    const monthlyAmount = totalAmount / 12;

    for (let i = 0; i < 12; i++) {
      installments.push({
        schoolId,
        academicYearId,
        studentId,
        studentFeeId,
        installmentName: `Month ${i + 1}`,
        amount: monthlyAmount,
        dueDate: new Date(
          new Date(startDate).setMonth(
            new Date(startDate).getMonth() + i
          )
        ),
      });
    }
  }

  if (frequency === "quarterly") {
    const quarterlyAmount = totalAmount / 4;

    for (let i = 0; i < 4; i++) {
      installments.push({
        schoolId,
        academicYearId,
        studentId,
        studentFeeId,
        installmentName: `Q${i + 1}`,
        amount: quarterlyAmount,
        dueDate: new Date(
          new Date(startDate).setMonth(
            new Date(startDate).getMonth() + i * 3
          )
        ),
      });
    }
  }

  if (frequency === "yearly") {
    installments.push({
      schoolId,
      academicYearId,
      studentId,
      studentFeeId,
      installmentName: "Annual",
      amount: totalAmount,
      dueDate: startDate,
    });
  }

  await FeeInstallment.insertMany(installments);
};
