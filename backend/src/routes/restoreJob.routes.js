import { Router } from "express";
import {
  approveRestoreJob,
  listRestoreJobs,
  requestRestoreJob,
  runRestoreJob,
} from "../controllers/systemBackup.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

const SUPER_ADMIN = ["Super Admin"];

router.use(auth);
router.use(roleMiddleware(SUPER_ADMIN));

router.post("/request",      requestRestoreJob);
router.patch("/:id/approve", approveRestoreJob);
router.post("/:id/run",      runRestoreJob);
router.get("/",              listRestoreJobs);

export default router;
