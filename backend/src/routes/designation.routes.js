import { Router } from "express";
import {
  createDesignation,
  getDesignations,
  getDesignationById,
  updateDesignation,
  deleteDesignation,
} from "../controllers/designation.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", auth, roleMiddleware("Super Admin"), createDesignation);
router.get("/", auth, roleMiddleware(["Super Admin", "School Admin"]), getDesignations);
router.get("/:id", auth, roleMiddleware(["Super Admin", "School Admin"]), getDesignationById);
router.put("/:id", auth, roleMiddleware("Super Admin"), updateDesignation);
router.delete("/:id", auth, roleMiddleware("Super Admin"), deleteDesignation);

export default router;
