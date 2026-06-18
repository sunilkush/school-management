import express from "express";
import {
  createTempAccess,
  listTempAccess,
  revokeTempAccess,
  deleteTempAccess,
} from "../controllers/tempAccess.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/",            auth, roleMiddleware(["Super Admin"]), createTempAccess);
router.get("/",             auth, roleMiddleware(["Super Admin"]), listTempAccess);
router.patch("/:id/revoke", auth, roleMiddleware(["Super Admin"]), revokeTempAccess);
router.delete("/:id",       auth, roleMiddleware(["Super Admin"]), deleteTempAccess);

export default router;
