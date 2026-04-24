import { Router } from "express";
import {
  approveRestoreJob,
  listRestoreJobs,
  requestRestoreJob,
  runRestoreJob,
} from "../controllers/systemBackup.controllers.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(auth);

router.post("/request", requestRestoreJob);
router.patch("/:id/approve", approveRestoreJob);
router.post("/:id/run", runRestoreJob);
router.get("/", listRestoreJobs);

export default router;
