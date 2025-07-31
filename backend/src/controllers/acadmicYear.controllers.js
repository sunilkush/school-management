import {AcademicYear} from '../models/AcademicYear.model.js'; // adjust path as needed



export const createAcademicYear = async (req, res) => {
  try {
    const { name, startDate, endDate, isActive, schoolId } = req.body;

    if (!name || !startDate || !endDate || !schoolId) {
      return res.status(400).json({ error: "All required fields must be provided." });
    }

    // Check if an active academic year already exists for the same school
    if (isActive) {
      const existingActiveYear = await AcademicYear.findOne({ schoolId, isActive: true });
      if (existingActiveYear) {
        return res.status(400).json({ error: "An active academic year already exists for this school." });
      }
    }

    // Create new academic year
    const newAcademicYear = new AcademicYear({
      name,
      startDate,
      endDate,
      isActive,
      schoolId
    });

    await newAcademicYear.save();

    return res.status(201).json({
      success: true,
      message: "Academic year created successfully",
      data: newAcademicYear,
    });
  } catch (err) {
    console.error("Error creating academic year:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
};


// ✅ Get All Academic Years for a School
export const getAllAcademicYears = async (req, res) => {
  try {
    const schoolId = req.params.schoolId || req.user.school;

    const years = await AcademicYear.find({ schoolId }).sort({ startDate: -1 });

    return res.status(200).json({ success: true, data: years });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Get Active Academic Year for a School
export const getActiveAcademicYear = async (req, res) => {
  try {
    const schoolId = req.params.schoolId || req.user.school;

    const activeYear = await AcademicYear.findOne({ schoolId, isActive: true });

    if (!activeYear) {
      return res.status(404).json({ error: 'No active academic year found' });
    }

    return res.status(200).json({ success: true, data: activeYear });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Update Academic Year
export const updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const yearToUpdate = await AcademicYear.findById(id);
    if (!yearToUpdate) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // 🛡 Prevent updates to another school's academic year
    if (user.role === 'School Admin' && user.school.toString() !== yearToUpdate.schoolId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // ✅ Only one active per school — deactivate others
    if (req.body.isActive === true) {
      await AcademicYear.updateMany(
        { schoolId: yearToUpdate.schoolId },
        { isActive: false }
      );
    }

    const updated = await AcademicYear.findByIdAndUpdate(id, req.body, { new: true });

    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Academic Year
export const deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // 🛡 Protect school boundary
    if (user.role === 'School Admin' && user.school.toString() !== year.schoolId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await AcademicYear.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'Academic year deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
