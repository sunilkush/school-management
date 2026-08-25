import { FeeHead } from "../models/feeHead.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { resolveSchoolId } from "../utils/resolveSchoolId.js";

/* ================= CREATE ================= */
export const createFeeHead = asyncHandler(async (req, res) => {
    const { name, type, isEditable } = req.body;
      if (!name?.trim()) {
        throw new ApiError(400, "Fee head name is required");
    }
    // Previously read `req.Role?.name` (no such property — auth middleware sets `req.userRole`)
    // which was always undefined, so the "School Admin locks to own school" branch below never
    // actually triggered and every role fell through to trusting req.body.schoolId outright.
    const currentRole = req.userRole?.name;
    const finalSchoolId =
         currentRole === "Super Admin" ? (req.body.schoolId || resolveSchoolId(req.user)) : resolveSchoolId(req.user);

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
  const currentRole = req.userRole?.name || req.user?.role;
  const filter = {};
  // Non-Super-Admin is always locked to their own school — leaving this unscoped when
  // req.query.schoolId is omitted let School Admin/Accountant list every school's fee heads.
  if (currentRole === "Super Admin") {
    if (req.query.schoolId) filter.schoolId = req.query.schoolId;
  } else {
    filter.schoolId = req.user.schoolId;
  }

  const feeHeads = await FeeHead.find(filter)
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, feeHeads, "Fee heads fetched successfully")
  );
});



/* ================= GET BY SCHOOL ================= */
export const getFeeHeadsBySchool = asyncHandler(async (req, res) => {
    // Previously let req.query.schoolId win over the caller's own school for every role,
    // including non-Super-Admin — a School Admin/Accountant could list another school's fee
    // heads just by passing its schoolId as a query param.
    const currentRole = req.userRole?.name;
    const schoolId = currentRole === "Super Admin" ? (req.query.schoolId || resolveSchoolId(req.user)) : resolveSchoolId(req.user);
    if (!schoolId) {
        throw new ApiError(400, "schoolId is required");
    }
   
    const feeHeads = await FeeHead.find({ schoolId }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, feeHeads, "Fee heads fetched"));
});

/* ================= UPDATE ================= */
export const updateFeeHead = asyncHandler(async (req, res) => {
    const currentRole = req.userRole?.name || req.user?.role;
    // Non-Super-Admin was previously able to update ANY school's fee head by ID — findById had no
    // schoolId scoping at all despite School Admin/Accountant both being allowed to call this route.
    const query = currentRole === "Super Admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, schoolId: req.user.schoolId };
    const feeHead = await FeeHead.findOne(query);
    if (!feeHead) throw new ApiError(404, "FeeHead not found");

    // schoolId must not be attacker-settable via the body — Object.assign would otherwise let a
    // caller reassign their own fee head into another school's namespace.
    const { schoolId, _id, ...updates } = req.body;
    Object.assign(feeHead, updates);
    await feeHead.save();

    res.status(200).json(new ApiResponse(200, feeHead, "Updated"));
});

/* ================= DELETE ================= */
export const deleteFeeHead = asyncHandler(async (req, res) => {
    const currentRole = req.userRole?.name || req.user?.role;
    const query = currentRole === "Super Admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, schoolId: req.user.schoolId };
    const feeHead = await FeeHead.findOneAndDelete(query);
    if (!feeHead) throw new ApiError(404, "FeeHead not found");
    res.status(200).json(new ApiResponse(200, null, "Deleted"));
});

