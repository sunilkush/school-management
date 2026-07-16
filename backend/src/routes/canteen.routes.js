import express from "express";
import {
  createItem, getItems, updateItem, deleteItem,
  getWallet, topUpCash, createTopUpRazorpayOrder, verifyTopUpRazorpay, getTransactions,
  createOrder, getOrders, cancelOrder,
} from "../controllers/canteen.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

const CANTEEN_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
const gate = [auth, roleMiddleware(CANTEEN_ROLES)];

// ── Menu Items ──
router.post(
  "/items",
  ...gate,
  validate({ body: { name: { required: true, type: "string" }, price: { required: true, type: "positiveInt" } } }),
  createItem
);
router.get("/items", ...gate, getItems);
router.put("/items/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), updateItem);
router.delete("/items/:id", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), deleteItem);

// ── Wallet ──
router.get(
  "/wallet/:studentId",
  ...gate,
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  getWallet
);
router.post(
  "/wallet/:studentId/topup",
  ...gate,
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  topUpCash
);
router.post(
  "/wallet/:studentId/topup/razorpay-order",
  ...gate,
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  createTopUpRazorpayOrder
);
router.post(
  "/wallet/:studentId/topup/razorpay-verify",
  ...gate,
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  verifyTopUpRazorpay
);
router.get(
  "/wallet/:studentId/transactions",
  ...gate,
  validate({ params: { studentId: { required: true, type: "objectId" } } }),
  getTransactions
);

// ── Orders (POS) ──
router.post(
  "/orders",
  ...gate,
  validate({ body: { studentId: { required: true, type: "objectId" }, items: { required: true, type: "array" } } }),
  createOrder
);
router.get("/orders", ...gate, getOrders);
router.patch("/orders/:id/cancel", ...gate, validate({ params: { id: { required: true, type: "objectId" } } }), cancelOrder);

export default router;
