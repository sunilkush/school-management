import express from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createPurchaseOrder, deletePurchaseOrder,
  getPurchaseOrderById, getPurchaseOrders,
  updatePurchaseOrder, updatePOStatus,
} from "../controllers/purchaseOrder.controllers.js";

const router = express.Router();
const MANAGE  = ["Super Admin", "School Admin", "Principal", "IT Support"];
const READ    = [...MANAGE, "Accountant"];

router.use(auth);
router.get("/",              roleMiddleware(READ),   getPurchaseOrders);
router.get("/:id",           roleMiddleware(READ),   getPurchaseOrderById);
router.post("/",             roleMiddleware(MANAGE), createPurchaseOrder);
router.put("/:id",           roleMiddleware(MANAGE), updatePurchaseOrder);
router.patch("/:id/status",  roleMiddleware(MANAGE), updatePOStatus);
router.delete("/:id",        roleMiddleware(MANAGE), deletePurchaseOrder);

export default router;
