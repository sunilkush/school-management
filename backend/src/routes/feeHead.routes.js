import { Router } from "express";
import {
    createFeeHead,
    getFeeHeads,
    updateFeeHead,
    deleteFeeHead,
    getFeeHeadsBySchool
} from "../controllers/feeHead.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/", auth, roleMiddleware("Super Admin", "School Admin"), createFeeHead);
router.get("/", auth, roleMiddleware("Super Admin", "School Admin"),getFeeHeads);
router.get(
  "/by-school",
  auth,
  roleMiddleware("Super Admin"),
  getFeeHeadsBySchool
);
router.put("/:id", auth, roleMiddleware("Super Admin", "School Admin"), updateFeeHead);
router.delete("/:id", auth, roleMiddleware("Super Admin", "School Admin"), deleteFeeHead);

export default router;
