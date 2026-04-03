import { Router } from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
  getClassById,
} from "../controllers/class.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

const ADMIN_TEACHER = ["Super Admin", "School Admin", "Teacher"];
const ADMIN_ONLY = ["Super Admin", "School Admin"];

router.post(
  "/create",
  auth,
  roleMiddleware(ADMIN_ONLY),
  validate({ body: { name: { required: true, type: "string" } } }),
  createClass
);

router.get(
  "/all",
  auth,
  roleMiddleware(ADMIN_TEACHER),
  validate({ query: { page: { type: "positiveInt" }, limit: { type: "positiveInt" } } }),
  getAllClasses
);

router.get(
  "/:schoolClassId",
  auth,
  roleMiddleware(ADMIN_TEACHER),
  validate({ params: { schoolClassId: { required: true, type: "objectId" } } }),
  getClassById
);

router.put(
  "/:schoolClassId",
  auth,
  roleMiddleware(ADMIN_ONLY),
  validate({ params: { schoolClassId: { required: true, type: "objectId" } } }),
  updateClass
);

router.delete(
  "/:schoolClassId",
  auth,
  roleMiddleware(ADMIN_ONLY),
  validate({ params: { schoolClassId: { required: true, type: "objectId" } } }),
  deleteClass
);

export default router;
