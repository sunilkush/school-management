import mongoose from "mongoose";
import { Vendor } from "../models/Vendor.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

const ensureSchool = (schoolId) => {
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId))
    throw new ApiError(400, "Valid schoolId is required");
  return schoolId;
};

export const getVendors = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { isActive, category, search } = req.query;

  const filter = { schoolId };
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (category) filter.category = category;
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safeSearch, $options: "i" } },
      { contactPerson: { $regex: safeSearch, $options: "i" } },
      { email: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const vendors = await Vendor.find(filter).sort({ createdAt: -1 }).lean();
  return res.status(200).json(new ApiResponse(200, vendors, "Vendors fetched"));
});

export const createVendor = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { name, contactPerson, phone, email, address, gstNumber, category, bankAccount, ifscCode } = req.body;

  if (!name) throw new ApiError(400, "Vendor name is required");

  const vendor = await Vendor.create({
    schoolId,
    name, contactPerson, phone, email, address,
    gstNumber, category: category || "General",
    bankAccount, ifscCode,
    createdBy: req.user._id,
  });

  return res.status(201).json(new ApiResponse(201, vendor, "Vendor created"));
});

export const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(400, "Invalid vendor id");

  const vendor = await Vendor.findOneAndUpdate(
    { _id: id, schoolId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return res.status(200).json(new ApiResponse(200, vendor, "Vendor updated"));
});

export const toggleVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const vendor = await Vendor.findOne({ _id: id, schoolId });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  vendor.isActive = !vendor.isActive;
  await vendor.save();

  return res.status(200).json(new ApiResponse(200, vendor, `Vendor ${vendor.isActive ? "activated" : "deactivated"}`));
});

export const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const vendor = await Vendor.findOneAndDelete({ _id: id, schoolId });
  if (!vendor) throw new ApiError(404, "Vendor not found");

  return res.status(200).json(new ApiResponse(200, null, "Vendor deleted"));
});
