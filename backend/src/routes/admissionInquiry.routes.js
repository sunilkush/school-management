import { Router } from "express";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  getInquiryStats,
} from "../controllers/admissionInquiry.controllers.js";

const router = Router();

// Who manages admissions
const INQUIRY_MANAGE = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Receptionist", "Counselor",
];

// Stats — leadership only
const INQUIRY_STATS = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
];

router.use(auth);

router.get("/stats", roleMiddleware(INQUIRY_STATS),  getInquiryStats);
router.get("/",      roleMiddleware(INQUIRY_MANAGE), getInquiries);
router.post("/",     roleMiddleware(INQUIRY_MANAGE), createInquiry);
router.get("/:id",   roleMiddleware(INQUIRY_MANAGE), getInquiryById);
router.put("/:id",   roleMiddleware(INQUIRY_MANAGE), updateInquiry);
router.delete("/:id", roleMiddleware(INQUIRY_MANAGE), deleteInquiry);

export default router;
