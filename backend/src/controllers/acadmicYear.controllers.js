import {AcademicYear} from '../models/AcademicYear.model.js';
// Create Academic Year
const createAcademicYear = async (req, res) => {
    try {
      const { name, startDate, endDate, isActive,schoolId } = req.body;
      if (!name || !schoolId || !startDate || !endDate) {
        return res.status(400).json({ message: 'All fields are required' });
      }
      // Validate dates
      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({ message: "Start date must be before end date" });
      }
  
      const existing = await AcademicYear.findOne({ name, schoolId });
      if (existing) {
        return res.status(400).json({ message: "Academic Year already exists" });
      }
  
      const academicYear = await AcademicYear.create({
        name,
        startDate,
        endDate,
        isActive,
        schoolId
      });
  
      res.status(201).json({ message: 'Academic Year created successfully', data: academicYear });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  // Get Active Academic Year
  // ✅ Get Active Academic Year
const getActiveAcademicYear = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ error: "schoolId is required" });
    }

    const activeYear = await AcademicYear.findOne({
      schoolId,
      isActive: true
    });

    if (!activeYear) {
      return res.status(404).json({ message: "No active academic year found" });
    }

    res.json(activeYear);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
  // Get All Academic Years
  const getAllAcademicYears = async (req, res) => {
    try {
      const academicYears = await AcademicYear.find().sort({ startDate: 1 });
      res.status(200).json({ data: academicYears });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  
  // Get Single Academic Year
  const getAcademicYearById = async (req, res) => {
    try {
      const { id } = req.params;
      const academicYear = await AcademicYear.findById(id);
  
      if (!academicYear) {
        return res.status(404).json({ message: 'Academic Year not found' });
      }
  
      res.status(200).json({ data: academicYear });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  
  // Update Academic Year
 const updateAcademicYear = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, startDate, endDate, isActive } = req.body;
  
      const academicYear = await AcademicYear.findById(id);
      if (!academicYear) {
        return res.status(404).json({ message: 'Academic Year not found' });
      }
      academicYear.name = name || academicYear.name;
      academicYear.startDate = startDate || academicYear.startDate;
      academicYear.endDate = endDate || academicYear.endDate;
      academicYear.isActive = isActive !== undefined ? isActive : academicYear.isActive;
  
      await academicYear.save();
  
      res.status(200).json({ message: 'Academic Year updated successfully', data: academicYear });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };
  
  // Delete Academic Year
  const deleteAcademicYear = async (req, res) => {
    try {
      const { id } = req.params;
      const academicYear = await AcademicYear.findById(id);
  
      if (!academicYear) {
        return res.status(404).json({ message: 'Academic Year not found' });
      }
  
      await academicYear.deleteOne();
  
      res.status(200).json({ message: 'Academic Year deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server Error', error: error.message });
    }
  };


  
  export {
    deleteAcademicYear,
    updateAcademicYear,
    getAcademicYearById,
    getAllAcademicYears,
    createAcademicYear,
    getActiveAcademicYear
  }