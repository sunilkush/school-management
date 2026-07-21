import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
} from "../controllers/topic.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();

// Same role split as chapters — topics live one level below a chapter.
const WRITE_ROLES = [
  "Super Admin", "School Admin",
  "Teacher", "Subject Coordinator",
];

const READ_ROLES = [
  "Super Admin", "School Admin",
  "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Student", "Parent",
];

router.post("/", auth, roleMiddleware(WRITE_ROLES), createTopic);
router.get("/", auth, roleMiddleware(READ_ROLES), getAllTopics);
router.get(
  "/:id",
  auth,
  roleMiddleware(READ_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  getTopicById
);
router.patch(
  "/:id",
  auth,
  roleMiddleware(WRITE_ROLES),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  updateTopic
);
router.delete(
  "/:id",
  auth,
  roleMiddleware(["Super Admin", "School Admin"]),
  validate({ params: { id: { required: true, type: "objectId" } } }),
  deleteTopic
);

export default router;
