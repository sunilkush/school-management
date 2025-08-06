import { Router } from "express";
import {
            registerUser,
            loginUser,
            updateUser,
            changeCurrentPassword,
            getCurrentUser,
            logoutUser, 
            getAllUsers,
            deleteUser,
            activeUser
} from "../controllers/user.controllers.js";
import { auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];

const ALL_USERS = ["Super Admin", "School Admin", "Teacher", "Student", "Parent"];
//

// ✅ Public Routes

router.post("/login", loginUser);

// ✅ Protected Routes
router.post("/register",auth,roleMiddleware(ADMIN_ROLE), upload.fields([{ name: "avatar", maxCount: 1 }]), registerUser);
router.get("/profile", auth, roleMiddleware(ALL_USERS), getCurrentUser);
router.put("/update", auth, roleMiddleware(ALL_USERS), updateUser);
router.put("/change-password", auth, roleMiddleware(ALL_USERS), changeCurrentPassword);
router.post("/logout", auth, roleMiddleware(ALL_USERS), logoutUser);
router.get("/get_all_user", auth, roleMiddleware(ADMIN_ROLE), getAllUsers);
router.patch("/delete/:id", auth, roleMiddleware(ADMIN_ROLE), deleteUser);
router.patch("/active/:id",auth,roleMiddleware(ADMIN_ROLE),activeUser)


export default router;
