import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import sendEmail from "../utils/sendEmail.js"; // Utility for sending emails

dotenv.config();

/**
 * @desc Register a new user
 * @route POST /api/auth/register
 * @access Private (Only Super Admin & School Admin)
 */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      schoolId: role === "Super Admin" ? null : schoolId, // Super Admins don't belong to a school
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc User login
 * @route POST /api/auth/login
 * @access Public
 */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Forgot Password - Sends Reset Link
 * @route POST /api/auth/forgot-password
 * @access Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // Token expires in 1 hour

    await user.save();

    // Send email with reset link
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail(email, "Password Reset", `Click here to reset your password: ${resetURL}`);

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Reset Password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password and save
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Refresh JWT Token
 * @route GET /api/auth/refresh-token
 * @access Private
 */
export const refreshToken = async (req, res) => {
  try {
    const { token } = req.headers.authorization.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid token" });

      const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({ token: newToken });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
