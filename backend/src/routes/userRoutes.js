import express from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  refreshToken,
} from "../controllers/authController.js";

import { protect, authorize } from "../middlewares/authMiddleware.js"; // Middleware for authentication

const router = express.Router();

// 🔹 Authentication Routes (Public & Protected)
router.post("/auth/register", protect, authorize("Super Admin", "School Admin"), registerUser);
router.post("/auth/login", loginUser);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password/:token", resetPassword);
router.get("/auth/refresh-token", protect, refreshToken);

// 🔹 User Management Routes (Protected, Role-Based)
router.post("/", protect, authorize("Super Admin", "School Admin"), createUser);
router.get("/", protect, authorize("Super Admin", "School Admin"), getUsers);
router.get("/:id", protect, getUserById);
router.put("/:id", protect, authorize("Super Admin", "School Admin"), updateUser);
router.delete("/:id", protect, authorize("Super Admin", "School Admin"), deleteUser);

export default router;
