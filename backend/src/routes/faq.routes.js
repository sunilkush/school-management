import { Router } from "express";
import {
  createFaq,
  getFaqs,
  getFaqById,
  updateFaq,
  deleteFaq,
} from "../controllers/faq.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Public read — any authenticated user can view FAQs
router.get("/", auth, getFaqs);
router.get("/:id", auth, getFaqById);

// Super Admin only — CRUD
router.post("/", auth, roleMiddleware("Super Admin"), createFaq);
router.put("/:id", auth, roleMiddleware("Super Admin"), updateFaq);
router.delete("/:id", auth, roleMiddleware("Super Admin"), deleteFaq);

export default router;
