import User from "../models/userModel.js";
import Role from "../models/roleModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/**
 * @desc Register a new user
 * @route POST /api/users
 * @access Private (Only Super Admin & School Admin)
 */
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, schoolId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Check if role exists
    const roleExists = await Role.findOne({ name: role });
    if (!roleExists) return res.status(400).json({ message: "Invalid role" });

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
    res.status(201).json({ message: "User created successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get all users with filters & pagination
 * @route GET /api/users
 * @access Private (Super Admin, School Admin)
 */
export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (search) filter.name = { $regex: search, $options: "i" };

    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-password");

    const totalUsers = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get a single user by ID
 * @route GET /api/users/:id
 * @access Private
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update user details
 * @route PUT /api/users/:id
 * @access Private (Super Admin, School Admin)
 */
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, schoolId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.schoolId = schoolId || user.schoolId;

    await user.save();
    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Delete user
 * @route DELETE /api/users/:id
 * @access Private (Super Admin, School Admin)
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
