import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createBonus,
  getBonuses,
  updateBonus,
  deleteBonus,
  approveBonus,
  cancelBonus,
} from "../controllers/bonus.controllers.js";

const router = Router();

const ADMIN_ROLES = ["Super Admin", "School Admin", "Accountant", "Principal"];

router.post("/",           auth, roleMiddleware(ADMIN_ROLES), createBonus);
router.get("/",            auth, roleMiddleware(ADMIN_ROLES), getBonuses);
router.put("/:id",         auth, roleMiddleware(ADMIN_ROLES), updateBonus);
router.delete("/:id",      auth, roleMiddleware(ADMIN_ROLES), deleteBonus);
router.put("/:id/approve", auth, roleMiddleware(ADMIN_ROLES), approveBonus);
router.put("/:id/cancel",  auth, roleMiddleware(ADMIN_ROLES), cancelBonus);

export default router;
