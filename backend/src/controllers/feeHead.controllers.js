import { FeeHead } from "../models/feeHead.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ================= CREATE ================= */
export const createFeeHead = asyncHandler(async (req, res) => {
  const { schoolId, name, type, isEditable } = req.body;
  
  // School Admin apna hi school use karega
  const finalSchoolId =
    req.user.role === "School Admin" ? req.user.schoolId : schoolId;

  if (!finalSchoolId) {
    throw new ApiError(400, "School ID is required");
  }

  const exists = await FeeHead.findOne({
    schoolId: finalSchoolId,
    name: name.trim(),
  });

  if (exists) {
    throw new ApiError(409, "Fee head already exists");
  }

  const feeHead = await FeeHead.create({
    schoolId: finalSchoolId,
    name: name.trim(),
    type,
    isEditable,
    createdBy: req.user._id, // optional but recommended
  });

  res
    .status(201)
    .json(new ApiResponse(201, feeHead, "FeeHead created successfully"));
});


/* ================= GET ================= */
export const getFeeHeads = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.schoolId) filter.schoolId = req.query.schoolId;

  const data = await FeeHead.find(filter).sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(200, data, "FeeHeads fetched"));
});

/* ================= UPDATE ================= */
export const updateFeeHead = asyncHandler(async (req, res) => {
  const feeHead = await FeeHead.findById(req.params.id);
  if (!feeHead) throw new ApiError(404, "FeeHead not found");

  Object.assign(feeHead, req.body);
  await feeHead.save();

  res.status(200).json(new ApiResponse(200, feeHead, "Updated"));
});

/* ================= DELETE ================= */
export const deleteFeeHead = asyncHandler(async (req, res) => {
  await FeeHead.findByIdAndDelete(req.params.id);
  res.status(200).json(new ApiResponse(200, null, "Deleted"));
});
