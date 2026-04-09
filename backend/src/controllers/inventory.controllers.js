import { Inventory } from "../models/Inventory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;
const resolveAcademicYearId = (req) => req.body?.academicYearId || null;

export const getInventoryItems = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const { itemType } = req.query;

  const filter = schoolId ? { schoolId } : {};
  if (itemType) filter.itemType = itemType;

  const items = await Inventory.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, items, "Inventory items fetched successfully"));
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const {
    itemType,
    name,
    category,
    quantity,
    unit,
    allocated,
    location,
    minThreshold,
  } = req.body;

  if (!itemType || !name) throw new ApiError(400, "itemType and name are required");

  const item = await Inventory.create({
    schoolId,
    academicYearId: resolveAcademicYearId(req),
    itemType,
    name,
    category: category || "General",
    quantity: Number(quantity) || 0,
    unit: unit || "pcs",
    allocated: Number(allocated) || 0,
    location: location || "",
    minThreshold: Number(minThreshold) || 10,
  });

  return res.status(201).json(new ApiResponse(201, item, "Inventory item created successfully"));
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updates = {};
  [
    "itemType",
    "name",
    "category",
    "quantity",
    "unit",
    "allocated",
    "location",
    "minThreshold",
  ].forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const item = await Inventory.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!item) throw new ApiError(404, "Inventory item not found");

  return res.status(200).json(new ApiResponse(200, item, "Inventory item updated successfully"));
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await Inventory.findByIdAndDelete(id);

  if (!item) throw new ApiError(404, "Inventory item not found");

  return res.status(200).json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});
