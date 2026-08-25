import { SchoolClass } from "../models/schoolClass.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Section } from "../models/section.model.js";
import mongoose from "mongoose";
import { buildSchoolAccessFilter } from "../utils/buildSchoolAccessFilter.js";
// 🔹 CREATE
export const createSchoolClass = async (req, res) => {
  try {
    const { academicYearId, boardClassId, name } = req.body;
    // Forces schoolId to the caller's own school for everyone except Super Admin — previously
    // req.body.schoolId was trusted outright, letting a School Admin create/duplicate-check
    // classes against another school's schoolId.
    const { schoolId } = buildSchoolAccessFilter(req, { schoolId: req.body.schoolId });

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
    const { academicYearId } = req.query;
    // Forces schoolId to the caller's own school for everyone except Super Admin — previously
    // this trusted req.query.schoolId outright, so any Teacher/Student/etc. could pass another
    // school's id and list its full class roster.
    const { schoolId } = buildSchoolAccessFilter(req, { schoolId: req.query.schoolId });

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "schoolId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid schoolId",
      });
    }

    const filter = {
      schoolId: new mongoose.Types.ObjectId(schoolId),
    };

    if (academicYearId) {
      if (!mongoose.Types.ObjectId.isValid(academicYearId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid academicYearId",
        });
      }

      filter.academicYearId = new mongoose.Types.ObjectId(academicYearId);
    }

    const classes = await SchoolClass.find(filter)
      .select("name schoolId academicYearId")
      .sort({ createdAt: -1 })
      .lean();

    const classIds = classes.map((cls) => cls._id);

    const sections = await Section.find({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      schoolClassId: { $in: classIds },
      ...(academicYearId && {
        academicYearId: new mongoose.Types.ObjectId(academicYearId),
      }),
    })
      .select("name schoolId schoolClassId classTeacherId subjects")
      .populate("classTeacherId", "name email")
      .populate("subjects.subjectId", "name")
      .lean();

    const finalData = classes.map((cls) => {
      const classSections = sections
        .filter(
          (sec) => sec.schoolClassId?.toString() === cls._id.toString()
        )
        .map((sec) => ({
          _id: sec._id,
          name: sec.name,
          schoolId: sec.schoolId,

          teacher: sec.classTeacherId
            ? {
                _id: sec.classTeacherId._id,
                name: sec.classTeacherId.name,
                email: sec.classTeacherId.email,
              }
            : null,

          subjects: (sec.subjects || []).map((sub) => ({
            _id: sub.subjectId?._id || null,
            name: sub.subjectId?.name || "",
          })),
        }));

      return {
        _id: cls._id,
        name: cls.name,
        schoolId: cls.schoolId,
        academicYearId: cls.academicYearId,
        sections: classSections,
      };
    });

    return res.status(200).json({
      success: true,
      message: "School classes fetched successfully",
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

    const data = await SchoolClass.findOne(buildSchoolAccessFilter(req, { _id: id }))
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

    const updated = await SchoolClass.findOneAndUpdate(
      buildSchoolAccessFilter(req, { _id: id }),
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

    const deleted = await SchoolClass.findOneAndDelete(buildSchoolAccessFilter(req, { _id: id }));

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
  const { academicYearId } = req.query;
  // Forces schoolId to the caller's own school for everyone except Super Admin — same leak as
  // getAllSchoolClasses above.
  const { schoolId } = buildSchoolAccessFilter(req, { schoolId: req.query.schoolId });

  // =============================
  // VALIDATION
  // =============================
  if (!schoolId) {
    return res.status(400).json({
      success: false,
      message: "schoolId is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(schoolId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid schoolId",
    });
  }

  if (academicYearId && !mongoose.Types.ObjectId.isValid(academicYearId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid academicYearId",
    });
  }

  // =============================
  // FETCH SCHOOL CLASSES
  // =============================
  const classFilter = {
    schoolId: new mongoose.Types.ObjectId(schoolId),
    ...(academicYearId && {
      academicYearId: new mongoose.Types.ObjectId(academicYearId),
    }),
  };

  const classes = await SchoolClass.find(classFilter)
    .populate("boardClassId", "name")
    .lean();

  if (!classes.length) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
      message: "No classes found",
    });
  }

  // =============================
  // GET ALL SECTION IDS
  // =============================
  const sectionIds = [
    ...new Set(
      classes.flatMap((cls) =>
        (cls.sections || [])
          .map((sec) => {
            const sectionId =
              sec?.sectionId?._id || sec?.sectionId || sec?._id || null;
            return sectionId ? String(sectionId) : null;
          })
          .filter(Boolean)
      )
    ),
  ];

  // =============================
  // FETCH SECTIONS WITH SUBJECTS
  // =============================
  const sections = await Section.find({
    _id: { $in: sectionIds },
  })
    .populate("subjects.subjectId", "name")
    .populate("subjects.teacherId", "name")
    .lean();

  // =============================
  // MAP SECTIONS
  // =============================
  const sectionMap = new Map();
  sections.forEach((sec) => {
    sectionMap.set(String(sec._id), sec);
  });

  // =============================
  // FINAL STRUCTURE
  // =============================
  const result = classes.map((cls) => ({
    _id: cls._id,
    name: cls.name,
    boardClass: cls.boardClassId || null,
    sections: (cls.sections || []).map((sec) => {
      const sectionId = sec?.sectionId?._id || sec?.sectionId || sec?._id || null;
      const fullSection = sectionMap.get(String(sectionId));

      return {
        _id: sectionId,
        name: fullSection?.name || sec?.name || null,
        subjects: (fullSection?.subjects || []).map((sub) => ({
          _id: sub?.subjectId?._id || null,
          name: sub?.subjectId?.name || null,
          teacherId: sub?.teacherId?._id || null,
          teacherName: sub?.teacherId?.name || "Unassigned",
        })),
      };
    }),
  }));

  // =============================
  // RESPONSE
  // =============================
  return res.status(200).json({
    success: true,
    count: result.length,
    data: result,
  });
});