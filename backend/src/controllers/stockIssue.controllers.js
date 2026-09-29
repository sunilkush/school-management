import mongoose from "mongoose";
import { StockIssue } from "../models/StockIssue.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

const ensureSchool = (schoolId) => {
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId))
    throw new ApiError(400, "Valid schoolId is required");
  return schoolId;
};

export const getStockIssues = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { status, itemId, from, to } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (itemId) filter.inventoryItemId = itemId;
  if (from || to) {
    filter.issueDate = {};
    if (from) filter.issueDate.$gte = new Date(from);
    if (to)   filter.issueDate.$lte = new Date(to);
  }

  const issues = await StockIssue.find(filter)
    .populate("inventoryItemId", "name unit")
    .populate("issuedBy", "name")
    .sort({ issueDate: -1 })
    .lean();

  // auto-mark overdue
  const now = new Date();
  const result = issues.map((i) => ({
    ...i,
    isOverdue:
      i.status === "issued" &&
      i.expectedReturnDate &&
      new Date(i.expectedReturnDate) < now,
  }));

  return res.status(200).json(new ApiResponse(200, result, "Stock issues fetched"));
});

export const createStockIssue = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const {
    inventoryItemId, quantity, issuedTo, issuedToUserId,
    department, purpose, issueDate, expectedReturnDate,
  } = req.body;

  if (!inventoryItemId || !quantity || !issuedTo)
    throw new ApiError(400, "inventoryItemId, quantity and issuedTo are required");

  const item = await Inventory.findOne({ _id: inventoryItemId, schoolId });
  if (!item) throw new ApiError(404, "Inventory item not found");

  const qty = Number(quantity);
  const available = (item.quantity || 0) - (item.allocated || 0);
  if (qty > available)
    throw new ApiError(400, `Only ${available} ${item.unit} available in stock`);

  // Checking what was left and taking it were separate steps, so two people issuing the last
  // few units both passed the check and both worked out the new allocation from the same
  // figure: one of the two issues was not counted, and the store went on showing stock that
  // had already gone out. The check is part of the same statement now.
  const claimed = await Inventory.findOneAndUpdate(
    {
      _id: inventoryItemId,
      schoolId,
      $expr: { $gte: [{ $subtract: ["$quantity", { $ifNull: ["$allocated", 0] }] }, qty] },
    },
    { $inc: { allocated: qty } },
    { new: true }
  );
  if (!claimed) {
    const left = Math.max(0, (item.quantity || 0) - (item.allocated || 0));
    throw new ApiError(400, `Only ${left} ${item.unit} available in stock`);
  }

  let issue;
  try {
    issue = await StockIssue.create({
      schoolId,
      inventoryItemId,
      itemName: item.name,
      unit: item.unit,
      quantity: qty,
      issuedTo,
      issuedToUserId: issuedToUserId || null,
      department,
      purpose,
      issueDate: issueDate || new Date(),
      expectedReturnDate: expectedReturnDate || null,
      issuedBy: req.user._id,
      status: "issued",
    });
  } catch (error) {
    // The stock was taken a moment ago; if no record of the issue survives, give it back.
    await Inventory.updateOne({ _id: inventoryItemId, schoolId }, { $inc: { allocated: -qty } });
    throw error;
  }

  return res.status(201).json(new ApiResponse(201, issue, "Stock issued successfully"));
});

export const processReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { returnedQuantity, condition, notes } = req.body;

  const issue = await StockIssue.findOne({ _id: id, schoolId });
  if (!issue) throw new ApiError(404, "Issue record not found");
  if (issue.status === "returned") throw new ApiError(400, "Already fully returned");

  const maxReturn = issue.quantity - (issue.returnedQuantity || 0);
  const qty = Number(returnedQuantity || maxReturn);
  if (qty <= 0 || qty > maxReturn) throw new ApiError(400, `Return qty must be 1–${maxReturn}`);

  // Working out how much was still outstanding and recording the return were separate steps,
  // so two returns sent together were both measured against the same figure and both went
  // through — more could come back than ever went out. How much is left is checked as part of
  // the same statement now.
  const returned = await StockIssue.findOneAndUpdate(
    {
      _id: id,
      schoolId,
      status: { $ne: "returned" },
      $expr: { $lte: [qty, { $subtract: ["$quantity", { $ifNull: ["$returnedQuantity", 0] }] }] },
    },
    [
      {
        $set: {
          returnedQuantity: { $add: [{ $ifNull: ["$returnedQuantity", 0] }, qty] },
          returnDate: new Date(),
          status: {
            $cond: [
              { $gte: [{ $add: [{ $ifNull: ["$returnedQuantity", 0] }, qty] }, "$quantity"] },
              "returned",
              "partial",
            ],
          },
        },
      },
    ],
    { new: true }
  );
  if (!returned) throw new ApiError(409, "This return was just recorded by someone else — refresh to see it");

  // Restore stock. One statement, and it still cannot take either figure below zero.
  await Inventory.updateOne(
    { _id: issue.inventoryItemId, schoolId },
    [
      {
        $set: {
          allocated: { $max: [0, { $subtract: [{ $ifNull: ["$allocated", 0] }, qty] }] },
          ...(condition === "disposed"
            ? { quantity: { $max: [0, { $subtract: [{ $ifNull: ["$quantity", 0] }, qty] }] } }
            : {}),
        },
      },
    ]
  );

  return res.status(200).json(new ApiResponse(200, returned, "Return processed"));
});

export const deleteStockIssue = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const issue = await StockIssue.findOne({ _id: id, schoolId });
  if (!issue) throw new ApiError(404, "Issue record not found");

  // Restore allocated qty if not yet returned
  if (issue.status !== "returned") {
    const unreturnedQty = issue.quantity - (issue.returnedQuantity || 0);
    await Inventory.findByIdAndUpdate(issue.inventoryItemId, {
      $inc: { allocated: -unreturnedQty },
    });
  }

  await issue.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Issue record deleted"));
});
