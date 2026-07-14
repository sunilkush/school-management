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
            activeUser,
            getUserById,
            refreshAccessToken,
            forgotPassword,
            resetPassword,
            verifyEmail,
            resendVerificationEmail,
            getMyPermissions
} from "../controllers/user.controllers.js";
import { allowPublic,auth, roleMiddleware } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js"
import { validateBody } from "../middlewares/validate.middleware.js";
import { authRateLimiter } from "../middlewares/security.middleware.js";
const router = Router();

// Role-Based Access Control
const ADMIN_ROLE = ["Super Admin", "School Admin"];
const ADMIN_AND_ACCOUNTANT_ROLE = ["Super Admin", "School Admin", "Accountant", "Librarian", "Subject Coordinator", "Exam Coordinator", "Principal", "Vice Principal"];

const ALL_USERS = [
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Student", "Parent",
  "Accountant", "Staff", "Support Staff",
  "Librarian", "Hostel Warden", "Transport Manager",
  "Receptionist", "IT Support", "Counselor", "Security",
];
//

// ✅ Public Routes

router.post("/login", allowPublic, authRateLimiter, validateBody(['email', 'password']), loginUser);
router.post("/refresh-token", allowPublic, authRateLimiter, refreshAccessToken);
router.post("/forgot-password", allowPublic, authRateLimiter, forgotPassword);
router.post("/reset-password/:token", allowPublic, authRateLimiter, resetPassword);
router.get("/verify-email/:token", allowPublic, verifyEmail);
router.post("/resend-verification", allowPublic, authRateLimiter, resendVerificationEmail);

// ✅ Protected Routes

router.post(
  "/register",
  auth,
  roleMiddleware(ADMIN_ROLE),
  upload.fields([{ name: "avatar", maxCount: 1 }]),
  registerUser
);

router.get("/me", auth, roleMiddleware(ALL_USERS), getCurrentUser);
router.get("/my-permissions", auth, roleMiddleware(ALL_USERS), getMyPermissions);
router.put("/update", auth, roleMiddleware(ALL_USERS), upload.fields([{ name: "avatar", maxCount: 1 }]), updateUser);
router.put("/change-password", auth, roleMiddleware(ALL_USERS), changeCurrentPassword);
router.post("/logout", auth, roleMiddleware(ALL_USERS), logoutUser);
router.get("/all", auth, roleMiddleware(ADMIN_AND_ACCOUNTANT_ROLE), getAllUsers);
router.patch("/delete/:id", auth, roleMiddleware(ADMIN_ROLE), deleteUser);
router.patch("/active/:id",auth,roleMiddleware(ADMIN_ROLE),activeUser);
router.get("/single/:id", auth, roleMiddleware(ALL_USERS),getUserById)


export default router;
