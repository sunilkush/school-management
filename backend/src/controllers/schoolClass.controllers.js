import { SchoolClass } from "../models/schoolClass.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Section } from "../models/section.model.js";
// 🔹 CREATE
export const createSchoolClass = async (req, res) => {
  try {
    const { schoolId, academicYearId, boardClassId, name } = req.body;

    // ✅ VALIDATION
    if (!schoolId || !academicYearId || !boardClassId || !name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ DUPLICATE CHECK (as per schema unique index)
    const exists = await SchoolClass.findOne({
      schoolId,
      academicYearId,
      boardClassId,
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Class already mapped for this academic year",
      });
    }

    // ✅ CREATE
    const newClass = await SchoolClass.create({
      schoolId,
      academicYearId,
      boardClassId,
      name,
      sections: [], // ✅ always initialize
      createdBy: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 GET ALL
export const getAllSchoolClasses = async (req, res) => {
  try {
    const { schoolId, academicYearId } = req.query;

    const filter = {};
    if (schoolId) filter.schoolId = schoolId;
    if (academicYearId) filter.academicYearId = academicYearId;

    const classes = await SchoolClass.find(filter)
      .select("name") // ✅ only class name
      .sort({ createdAt: -1 })
      .lean();

    const classIds = classes.map((cls) => cls._id);

    const sections = await Section.find({
      schoolClassId: { $in: classIds },
    })
      .select("name schoolClassId subjects") // ✅ only needed fields
      .populate("subjects.subjectId", "name")
      .lean();

    // ✅ FINAL STRUCTURE
    const finalData = classes.map((cls) => {
      const classSections = sections
        .filter(
          (sec) =>
            sec.schoolClassId.toString() === cls._id.toString()
        )
        .map((sec) => ({
          _id: sec._id,
          name: sec.name,
          teacher: sec.classTeacherId
            ? {
                _id: sec.classTeacherId._id,
                name: sec.classTeacherId.name,
                email: sec.classTeacherId.email,
              }
            : null,
          subjects: sec.subjects.map((sub) => ({
            _id: sub.subjectId?._id,
            name: sub.subjectId?.name,
          })),
        }));

      return {
        _id: cls._id,
        name: cls.name,
        sections: classSections,
      };
    });

    return res.status(200).json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    console.error("Get Classes Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

// 🔹 GET SINGLE
export const getSchoolClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await SchoolClass.findById(id)
      .populate("boardClassId", "name")
      .populate("sections.sectionId", "name")
      .populate("sections.teacherId", "name");

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 UPDATE
export const updateSchoolClass = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await SchoolClass.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    )
      .populate("sections.sectionId", "name")
      .populate("sections.teacherId", "name");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🔹 DELETE
export const deleteSchoolClass = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await SchoolClass.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "School class not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getSchoolClassSectionSubjects = asyncHandler(async (req, res) => {
  const { schoolId, academicYearId } = req.query;

  // =============================
  // 🔹 VALIDATION
  // =============================
  if (!schoolId) {
    return res.status(400).json({
      success: false,
      message: "schoolId is required",
    });
  }

  // =============================
  // 🔹 FETCH SCHOOL CLASSES
  // =============================
  const classes = await SchoolClass.find({
    schoolId,
    ...(academicYearId && { academicYearId }),
  })
    .populate("boardClassId", "name")
    .lean();

  // =============================
  // 🔹 GET ALL SECTION IDS
  // =============================
  const sectionIds = classes.flatMap((cls) =>
    (cls.sections || []).map((s) => s.sectionId)
  );

  // =============================
  // 🔹 FETCH SECTIONS WITH SUBJECTS
  // =============================
  const sections = await Section.find({
    _id: { $in: sectionIds },
  })
    .populate("subjects.subjectId", "name")
    .populate("subjects.teacherId", "name")
    .lean();

  // =============================
  // 🔹 MAP SECTIONS
  // =============================
  const sectionMap = {};
  sections.forEach((sec) => {
    sectionMap[sec._id] = sec;
  });

  // =============================
  // 🔥 FINAL STRUCTURE
  // =============================
  const result = classes.map((cls) => ({
    _id: cls._id,
    name: cls.name,
    board: cls.boardClassId?.name,

    sections: (cls.sections || []).map((sec) => {
      const fullSection = sectionMap[sec.sectionId];

      return {
        _id: sec.sectionId,
        name: fullSection?.name,

        subjects: (fullSection?.subjects || []).map((sub) => ({
          _id: sub.subjectId?._id,
          name: sub.subjectId?.name,
          teacherId: sub.teacherId?._id ,
          teacherName : sub.teacherId?.name || "Unassigned",
        })),
      };
    }),
  }));

  // =============================
  // 🔹 RESPONSE
  // =============================
  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});