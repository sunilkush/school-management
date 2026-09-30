import mongoose from "mongoose";
import { PurchaseOrder } from "../models/PurchaseOrder.model.js";
import { Inventory } from "../models/Inventory.model.js";
import { Vendor } from "../models/Vendor.model.js";
import { assertAllInSchool, assertInSchool } from "../utils/schoolScope.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

const ensureSchool = (schoolId) => {
  if (!schoolId || !mongoose.Types.ObjectId.isValid(schoolId))
    throw new ApiError(400, "Valid schoolId is required");
  return schoolId;
};

const calcTotals = (items = [], taxRate = 0) => {
  const subtotal = items.reduce((s, i) => s + (i.totalPrice || i.quantity * i.unitPrice || 0), 0);
  const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  return { subtotal, taxAmount, totalAmount: subtotal + taxAmount };
};

export const getPurchaseOrders = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { status, vendorId, from, to } = req.query;

  const filter = { schoolId };
  if (status) filter.status = status;
  if (vendorId) filter.vendorId = vendorId;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }

  const orders = await PurchaseOrder.find(filter)
    .populate("vendorId", "name phone")
    .populate("orderedBy", "name")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, orders, "Purchase orders fetched"));
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const order = await PurchaseOrder.findOne({ _id: id, schoolId })
    .populate("vendorId", "name phone email address gstNumber")
    .populate("orderedBy", "name")
    .populate("approvedBy", "name")
    .lean();

  if (!order) throw new ApiError(404, "Purchase order not found");
  return res.status(200).json(new ApiResponse(200, order, "Purchase order fetched"));
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { vendorId, items = [], taxRate = 0, expectedDate, notes } = req.body;

  if (!vendorId) throw new ApiError(400, "vendorId is required");
  if (!items.length) throw new ApiError(400, "At least one item is required");
  // The order is shown with the vendor's phone, email, address and GST number.
  await assertInSchool(Vendor, vendorId, schoolId, "vendor");

  const enrichedItems = items.map((i) => ({
    ...i,
    totalPrice: (i.quantity || 0) * (i.unitPrice || 0),
  }));

  const { subtotal, taxAmount, totalAmount } = calcTotals(enrichedItems, taxRate);

  const order = await PurchaseOrder.create({
    schoolId,
    vendorId,
    items: enrichedItems,
    subtotal, taxRate, taxAmount, totalAmount,
    expectedDate, notes,
    orderedBy: req.user._id,
    status: "draft",
  });

  return res.status(201).json(new ApiResponse(201, order, "Purchase order created"));
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const order = await PurchaseOrder.findOne({ _id: id, schoolId });
  if (!order) throw new ApiError(404, "Purchase order not found");
  if (["received", "cancelled"].includes(order.status))
    throw new ApiError(400, "Cannot edit a received or cancelled order");

  const { items, taxRate, vendorId, expectedDate, notes } = req.body;

  if (vendorId) {
    await assertInSchool(Vendor, vendorId, schoolId, "vendor");
    order.vendorId = vendorId;
  }
  if (expectedDate !== undefined) order.expectedDate = expectedDate;
  if (notes !== undefined) order.notes = notes;

  if (items) {
    const enrichedItems = items.map((i) => ({
      ...i,
      totalPrice: (i.quantity || 0) * (i.unitPrice || 0),
    }));
    order.items = enrichedItems;
    const tr = taxRate !== undefined ? taxRate : order.taxRate;
    const { subtotal, taxAmount, totalAmount } = calcTotals(enrichedItems, tr);
    order.subtotal = subtotal;
    order.taxRate  = tr;
    order.taxAmount = taxAmount;
    order.totalAmount = totalAmount;
  }

  await order.save();
  return res.status(200).json(new ApiResponse(200, order, "Purchase order updated"));
});

export const updatePOStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));
  const { status, receivedDate, receivedItems } = req.body;

  const VALID = ["draft", "pending", "approved", "ordered", "partial", "received", "cancelled"];
  if (!VALID.includes(status)) throw new ApiError(400, `Invalid status. Must be one of: ${VALID.join(", ")}`);

  const order = await PurchaseOrder.findOne({ _id: id, schoolId });
  if (!order) throw new ApiError(404, "Purchase order not found");

  const loadedAt = order.updatedAt;
  const stockIn = [];
  order.status = status;
  if (status === "approved") order.approvedBy = req.user._id;
  if (["received", "partial"].includes(status)) {
    order.receivedDate = receivedDate || new Date();
    if (Array.isArray(receivedItems)) {
      // qty is the running total received for that line. Stock goes up by what is new since the
      // last receipt, never past what was ordered: adding the whole running total each time counted
      // earlier deliveries again (3 then 5 received added 8), and repeating a receipt added it twice.
      for (const ri of receivedItems) {
        const item = order.items[ri.index];
        if (!item) continue;
        const before = Number(item.receivedQty) || 0;
        const now = Math.min(Math.max(Number(ri.qty) || 0, before), Number(item.quantity) || 0);
        item.receivedQty = now;
        if (ri.inventoryItemId && now > before) stockIn.push({ id: ri.inventoryItemId, qty: now - before });
      }
      const allReceived = order.items.every((i) => i.receivedQty >= i.quantity);
      order.status = allReceived ? "received" : "partial";
    }
  }

  // Saved only if nobody changed the order since it was read, so two receipts sent together cannot
  // both add their stock.
  const saved = await PurchaseOrder.findOneAndUpdate(
    { _id: order._id, schoolId, updatedAt: loadedAt },
    { $set: { status: order.status, approvedBy: order.approvedBy, receivedDate: order.receivedDate, items: order.items } },
    { new: true, runValidators: true }
  );
  if (!saved) throw new ApiError(409, "This order was just updated — refresh and try again");

  // This school's stock only: by id alone, receiving an order added to another school's item.
  for (const { id: itemId, qty } of stockIn) {
    await Inventory.updateOne({ _id: itemId, schoolId }, { $inc: { quantity: qty } });
  }

  return res.status(200).json(new ApiResponse(200, saved, "Status updated"));
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const schoolId = ensureSchool(resolveSchoolId(req));

  const order = await PurchaseOrder.findOne({ _id: id, schoolId });
  if (!order) throw new ApiError(404, "Purchase order not found");
  if (order.status !== "draft") throw new ApiError(400, "Only draft orders can be deleted");

  await order.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Purchase order deleted"));
});
