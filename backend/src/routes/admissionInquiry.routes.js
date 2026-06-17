import { Router } from "express";
import { auth } from "../middlewares/auth.middleware.js";
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  getInquiryStats,
} from "../controllers/admissionInquiry.controllers.js";

const router = Router();

router.use(auth);

router.get   ("/stats",  getInquiryStats);
router.get   ("/",       getInquiries);
router.post  ("/",       createInquiry);
router.get   ("/:id",    getInquiryById);
router.put   ("/:id",    updateInquiry);
router.delete("/:id",    deleteInquiry);

export default router;
