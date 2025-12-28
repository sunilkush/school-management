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
const ADMIN_ONLY = ["Super Admin", "School Admin"];
router.post("/", auth, roleMiddleware(ADMIN_ONLY), createFeeHead);
router.get("/",auth,roleMiddleware(ADMIN_ONLY), getFeeHeads);
router.get(
  "/by-school",
  auth,
  roleMiddleware(ADMIN_ONLY),
  getFeeHeadsBySchool
);
router.put("/:id", auth, roleMiddleware(ADMIN_ONLY), updateFeeHead);
router.delete("/:id", auth, roleMiddleware(ADMIN_ONLY), deleteFeeHead);
export default router;
