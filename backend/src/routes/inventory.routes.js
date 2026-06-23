import express from "express";
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  updateInventoryItem,
} from "../controllers/inventory.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

const INVENTORY_MANAGE = ["Super Admin", "School Admin", "IT Support", "Principal", "Vice Principal"];
const INVENTORY_READ   = [...INVENTORY_MANAGE, "Accountant"];

router.use(auth);

router.get("/",       roleMiddleware(INVENTORY_READ),   getInventoryItems);
router.post("/",      roleMiddleware(INVENTORY_MANAGE), createInventoryItem);
router.put("/:id",    roleMiddleware(INVENTORY_MANAGE), updateInventoryItem);
router.delete("/:id", roleMiddleware(INVENTORY_MANAGE), deleteInventoryItem);

export default router;
