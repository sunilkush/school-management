import express from "express";
import { createHostel, getHostels, getHostelById, updateHostel, deleteHostel } from "../controllers/hostel.controller.js";
import { auth, roleMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// Define allowed roles
const ADMIN_ROLES = ["admin", "superadmin"];
const STUDENT_ROLE = ["student"];
const ALL_ROLES = ["admin", "superadmin", "student"];

// Assign Student to Hostel (Only Admins Can Assign)
router.post("/createHostals", auth, roleMiddleware(ADMIN_ROLES), createHostel);

// Get All Hostel Entries (Admins & Students Can View)
router.get("/getHostals", auth, roleMiddleware(ALL_ROLES), getHostels);

// Get Single Hostel Entry by ID (Admins & Students Can View)
router.get("/hostelSingle/:id", auth, roleMiddleware(ALL_ROLES), getHostelById);

// Update Hostel Entry (Only Admins Can Update)
router.put("/hostelUpdate/:id", auth, roleMiddleware(ADMIN_ROLES), updateHostel);

// Delete Hostel Entry (Only Admins Can Delete)
router.delete("/hostelDelete/:id", auth, roleMiddleware(ADMIN_ROLES), deleteHostel);

export default router;
