import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    resetPassword,
    refreshAccessToken
} from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.middleware.js"
const router = Router()

router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
// secure route
router.route("/logout").post(auth, logoutUser)
router.route("/update").patch(auth, updateUser)
router.route("/delete").post(auth, deleteUser)
router.route("/currentUser").get(auth, getCurrentUser)
router.route("/change-password").patch(auth, resetPassword)
router.route("/refresh-token").post(auth, refreshAccessToken)

export default router