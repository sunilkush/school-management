import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createIpRule,
  listIpRules,
  updateIpRule,
  deleteIpRule,
  toggleIpRule,
} from "../controllers/ipRestriction.controllers.js";

const router = Router();
const ADMIN_ROLES = ["Super Admin", "School Admin"];

router.use(auth);
router.use(roleMiddleware(ADMIN_ROLES));

router.get("/", listIpRules);
router.post("/", createIpRule);
router.put("/:id", updateIpRule);
router.patch("/:id/toggle", toggleIpRule);
router.delete("/:id", deleteIpRule);

export default router;
