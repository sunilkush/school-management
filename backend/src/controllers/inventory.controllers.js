import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;
const resolveAcademicYearId = (req) => req.body?.academicYearId || null;

const parseNumericField = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const validateInventoryPayload = ({ quantity, allocated, minThreshold }) => {
  if (quantity < 0 || allocated < 0 || minThreshold < 0) {
    throw new ApiError(400, "quantity, allocated, and minThreshold must be non-negative");
  }

  if (allocated > quantity) {
    throw new ApiError(400, "allocated cannot be greater than quantity");
  }
};

const ensureSchoolScope = (schoolId) => {
  if (!schoolId) {
    throw new ApiError(400, "schoolId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    throw new ApiError(400, "invalid schoolId");
  }

  return schoolId;
};

export const getInventoryItems = asyncHandler(async (req, res) => {
  const schoolId = ensureSchoolScope(resolveSchoolId(req));
  const { itemType } = req.query;

  const filter = { schoolId };
  if (itemType) filter.itemType = itemType;

  const items = await Inventory.find(filter).sort({ createdAt: -1 }).lean();
  const enrichedItems = items.map((item) => ({
    ...item,
    available: Math.max((item.quantity || 0) - (item.allocated || 0), 0),
    lowStock: (item.quantity || 0) <= (item.minThreshold || 0),
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, enrichedItems, "Inventory items fetched successfully"));
});

export const createInventoryItem = asyncHandler(async (req, res) => {
  const schoolId = ensureSchoolScope(resolveSchoolId(req));

  const {
    itemType, name, category, unit, location,
    serialNumber, purchaseDate, purchasePrice, warrantyExpiry, condition, vendorId, assignedTo,
  } = req.body;

  if (!itemType || !name) throw new ApiError(400, "itemType and name are required");

  const quantity = parseNumericField(req.body.quantity, 0);
  const allocated = parseNumericField(req.body.allocated, 0);
  const minThreshold = parseNumericField(req.body.minThreshold, 10);
  const parsedPurchasePrice = parseNumericField(purchasePrice, 0);

  validateInventoryPayload({ quantity, allocated, minThreshold });

  const item = await Inventory.create({
    schoolId,
    academicYearId: resolveAcademicYearId(req),
    itemType,
    name,
    category: category || "General",
    quantity,
    unit: unit || "pcs",
    allocated,
    location: location || "",
    minThreshold,
    serialNumber: serialNumber || "",
    purchaseDate: purchaseDate || null,
    purchasePrice: parsedPurchasePrice,
    warrantyExpiry: warrantyExpiry || null,
    condition: condition || "good",
    vendorId: vendorId || null,
    assignedTo: assignedTo || "",
  });

  return res.status(201).json(new ApiResponse(201, item, "Inventory item created successfully"));
});

export const updateInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchoolScope(resolveSchoolId(req));

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid inventory item id");
  }

  const item = await Inventory.findOne({ _id: id, schoolId });
  if (!item) throw new ApiError(404, "Inventory item not found");

  const nextQuantity = parseNumericField(req.body.quantity, item.quantity);
  const nextAllocated = parseNumericField(req.body.allocated, item.allocated);
  const nextMinThreshold = parseNumericField(req.body.minThreshold, item.minThreshold);

  validateInventoryPayload({
    quantity: nextQuantity,
    allocated: nextAllocated,
    minThreshold: nextMinThreshold,
  });

  [
    "itemType", "name", "category", "unit", "location",
    "serialNumber", "purchaseDate", "purchasePrice", "warrantyExpiry", "condition", "vendorId", "assignedTo",
  ].forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });

  item.quantity = nextQuantity;
  item.allocated = nextAllocated;
  item.minThreshold = nextMinThreshold;

  await item.save();

  return res.status(200).json(new ApiResponse(200, item, "Inventory item updated successfully"));
});

export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchoolScope(resolveSchoolId(req));

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid inventory item id");
  }

  const item = await Inventory.findOneAndDelete({ _id: id, schoolId });

  if (!item) throw new ApiError(404, "Inventory item not found");

  return res.status(200).json(new ApiResponse(200, null, "Inventory item deleted successfully"));
});
