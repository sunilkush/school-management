import express from 'express';
import {
  createSection,
  getSections,
  updateSection,
  deleteSection
} from '../controllers/section.controllers.js';
import { auth, roleMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 🔑 Role Groups
const ADMIN_ONLY = ["Super Admin", "School Admin"];

// ➕ Create Section
router.post('/', auth, roleMiddleware(ADMIN_ONLY), createSection);

// 📋 Get Sections
router.get('/', auth, getSections);

// ✏️ Update Section
router.put('/:id', auth, roleMiddleware(ADMIN_ONLY), updateSection);

// 🗑️ Delete Section
router.delete('/:id', auth, roleMiddleware(ADMIN_ONLY), deleteSection);

export default router;
