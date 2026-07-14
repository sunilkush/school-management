import express from "express";
import {
  createSupportTicket,
  getSupportTicketById,
  getSupportTickets,
  resolveSupportTicket,
  updateSupportTicket,
  updateSupportTicketStatus,
} from "../controllers/supportTicket.controllers.js";
import { auth, requireRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();

const SUPPORT_ROLES = [
  "Super Admin",
  "School Admin",
  "Principal",
  "Vice Principal",
  "Teacher",
  "Class Teacher",
  "Sports Teacher",
  "Lab Technician",
  "Medical Officer",
  "Subject Coordinator",
  "Student",
  "Parent",
  "Accountant",
  "Staff",
  "Support Staff",
  "Librarian",
  "Hostel Warden",
  "Transport Manager",
  "Exam Coordinator",
  "Receptionist",
  "IT Support",
  "Counselor",
  "Security",
  "Sports Teacher",
  "Lab Technician",
  "Medical Officer",
  "Class Teacher",
];

router.post("/", auth, requireRoles(SUPPORT_ROLES), createSupportTicket);
router.get("/", auth, requireRoles(SUPPORT_ROLES), getSupportTickets);
router.get("/:id", auth, requireRoles(SUPPORT_ROLES), getSupportTicketById);
router.patch("/:id", auth, requireRoles(SUPPORT_ROLES), updateSupportTicket);
router.patch("/:id/status", auth, requireRoles(SUPPORT_ROLES), updateSupportTicketStatus);
router.patch("/:id/resolve", auth, requireRoles(SUPPORT_ROLES), resolveSupportTicket);

export default router;
