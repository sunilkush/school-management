import {Section} from '../models/Section.model.js';

// Create Section
export const createSection = async (req, res) => {
  try {
    const section = await Section.create(req.body);
    res.status(201).json(section);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Sections for a School + Class + Year
export const getSections = async (req, res) => {
  try {
    const { schoolId, classId, academicYearId } = req.query;
    const filters = {};
    if (schoolId) filters.schoolId = schoolId;
    if (classId) filters.classId = classId;
    if (academicYearId) filters.academicYearId = academicYearId;

    const sections = await Section.find(filters)
      .populate('classId', 'name')
      .populate('academicYearId', 'name')
      .sort({ name: 1 });

    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Section
export const updateSection = async (req, res) => {
  try {
    const updated = await Section.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete Section
export const deleteSection = async (req, res) => {
  try {
    await Section.findByIdAndDelete(req.params.id);
    res.json({ message: 'Section deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
