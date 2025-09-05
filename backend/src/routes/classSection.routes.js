import express from "express";
import {
  createClassSection,
  getClassSections,
  getClassSectionById,
  updateClassSection,
  deleteClassSection,
} from "../controllers/classSection.controllers.js";

const router = express.Router();

router.post("/", createClassSection);
router.get("/", getClassSections);
router.get("/:id", getClassSectionById);
router.put("/:id", updateClassSection);
router.delete("/:id", deleteClassSection);

export default router;
