import mongoose from "mongoose";
import { Payment } from "../models/payment.model.js";
import { FeeInstallment } from "../models/feeInstallment.model.js";
import { Student } from "../models/student.model.js";

/**
 * Main report switch
 */
export const generateFeeReport = async (filters) => {
  const { type } = filters;

  switch (type) {
    case "daily":
      return dailyCollection(filters);

    case "monthly":
      return monthWiseCollection(filters);

    case "class":
      return classWiseCollection(filters);

    case "pending":
      return pendingFeeReport(filters);

    default:
      throw new Error("Invalid report type");
  }
};
