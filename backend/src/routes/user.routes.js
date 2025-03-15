import { Router } from "express";
import {

    registerUser,
    loginUser,
    updateUser,
    changeCurrentPassword,
    getCurrentUser,
    logoutUser
} from "../controllers/user.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "Admin"];
const TEACHER_ROLE = ["Super Admin", "Admin", "Teacher"];
const ALL_USERS = ["Super Admin", "Admin", "Teacher", "Student", "Parent"];
//

// ✅ Public Routes
router.post("/register", upload.fields([{ name: "logo", maxCount: 1 }]), registerUser);
router.post("/login", loginUser);

// ✅ Protected Routes
router.get("/me", auth, roleMiddleware(ALL_USERS), getCurrentUser);
router.put("/update", auth, roleMiddleware(ALL_USERS), updateUser);
router.put("/change-password", auth, roleMiddleware(ALL_USERS), changeCurrentPassword);
router.post("/logout", auth, roleMiddleware(ALL_USERS), logoutUser);

export default router;
