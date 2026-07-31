import express from "express";
import { getCommunicationSettings, updateCommunicationSettings } from "../controllers/communicationSettings.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const ADMIN_ROLE = ["Super Admin", "School Admin"];

router.get("/", auth, roleMiddleware(ADMIN_ROLE), getCommunicationSettings);
router.put("/", auth, roleMiddleware(ADMIN_ROLE), updateCommunicationSettings);

export default router;
