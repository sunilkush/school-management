import express from 'express';
import {
  createSection,
  getSections,
  updateSection,
  deleteSection
} from '../controllers/section.controllers.js';

const router = express.Router();

// POST /sections
router.post('/', createSection);

// GET /sections?schoolId=...&classId=...&academicYearId=...
router.get('/', getSections);

// PUT /sections/:id
router.put('/:id', updateSection);

// DELETE /sections/:id
router.delete('/:id', deleteSection);

export default router;
