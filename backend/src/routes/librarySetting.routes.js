import express from "express";
import { getLibrarySettings, updateLibrarySettings } from "../controllers/librarySetting.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
const LIBRARY_STAFF = ["School Admin", "Librarian"];

router.get("/", auth, roleMiddleware([...LIBRARY_STAFF, "Teacher"]), getLibrarySettings);
router.put("/", auth, roleMiddleware(LIBRARY_STAFF), updateLibrarySettings);

export default router;
