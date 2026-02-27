import mongoose from "mongoose";
import Chapter from "../models/Chapter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ChapterSchoolMap from "../models/ChapterSchoolMap.model.js";

/* =====================================================
   🔧 HELPER
===================================================== */

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/* =====================================================
   ✅ CREATE CHAPTER (TRANSACTION SAFE)
===================================================== */
export const createChapter = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      chapterNo,
      description,
      boardId,
      classId,
      subjectId,
      academicYearId,
      isGlobal,
      schoolId: bodySchoolId
    } = req.body;

    const user = req.user;

    /* ✅ REQUIRED VALIDATION */
    if (!name || !chapterNo || !boardId || !classId || !subjectId || !academicYearId) {
      throw new ApiError(400, "Required fields missing");
    }

    /* ✅ OBJECT ID VALIDATION */
    const idsToValidate = [boardId, classId, subjectId, academicYearId];
    if (idsToValidate.some((id) => !isValidObjectId(id))) {
      throw new ApiError(400, "Invalid reference id");
    }

    let schoolId = null;
    let createdByRole = user.role;

    /* 🧠 BUSINESS LOGIC */

    if (user.role === "Super Admin") {
      if (!isGlobal && bodySchoolId) {
        if (!isValidObjectId(bodySchoolId)) {
          throw new ApiError(400, "Invalid schoolId");
        }
        schoolId = bodySchoolId;
      }
    } else if (user.role === "School Admin") {
      schoolId = user.schoolId;
    } else {
      throw new ApiError(403, "Unauthorized role");
    }

    /* 🚫 CREATE */

    const chapter = await Chapter.create(
      [
        {
          name: name.trim(),
          chapterNo,
          description,
          boardId,
          classId,
          subjectId,
          academicYearId,
          isGlobal: user.role === "Super Admin" ? !!isGlobal : false,
          schoolId,
          createdByRole,
          createdBy: user._id
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(new ApiResponse(201, chapter[0], "Chapter created successfully"));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    /* 🔥 DUPLICATE SAFE */
    if (error.code === 11000) {
      throw new ApiError(409, "Chapter already exists with same number");
    }

    throw error;
  }
});

/* =====================================================
   ✅ GET ALL CHAPTERS (OPTIMIZED)
===================================================== */
export const getAllChapters = asyncHandler(async (req, res) => {
  let {
    boardId,
    classId,
    subjectId,
    academicYearId,
    page = 1,
    limit = 10,
    search = ""
  } = req.query;

  const user = req.user;

  page = Math.max(1, Number(page));
  limit = Math.min(100, Number(limit));

  const filter = { isActive: true };

  /* 🧠 VISIBILITY */

  if (user.role === "School Admin") {
    filter.$or = [{ isGlobal: true }, { schoolId: user.schoolId }];
  }

  /* 🎯 FILTERS */

  if (boardId && isValidObjectId(boardId)) filter.boardId = boardId;
  if (classId && isValidObjectId(classId)) filter.classId = classId;
  if (subjectId && isValidObjectId(subjectId)) filter.subjectId = subjectId;
  if (academicYearId && isValidObjectId(academicYearId))
    filter.academicYearId = academicYearId;

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [chapters, total] = await Promise.all([
    Chapter.find(filter)
      .populate("boardId classId subjectId academicYearId schoolId")
      .sort({ chapterNo: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Chapter.countDocuments(filter)
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: chapters,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      },
      "Chapters fetched successfully"
    )
  );
});

/* =====================================================
   ✅ GET SINGLE CHAPTER
===================================================== */
export const getChapterById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid chapter id");
  }

  const chapter = await Chapter.findById(id)
    .populate("boardId classId subjectId academicYearId schoolId")
    .lean();

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  return res.status(200).json(new ApiResponse(200, chapter, "Chapter fetched"));
});

/* =====================================================
   ✅ UPDATE CHAPTER (HARD GUARDS)
===================================================== */
export const updateChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid chapter id");
  }

  const chapter = await Chapter.findById(id);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  /* 🔥 GLOBAL PROTECTION */
  if (chapter.isGlobal && user.role !== "Super Admin") {
    throw new ApiError(403, "Cannot modify global chapter");
  }

  /* 🔐 SCHOOL SECURITY */
  if (
    user.role === "School Admin" &&
    chapter.schoolId?.toString() !== user.schoolId?.toString()
  ) {
    throw new ApiError(403, "You cannot update this chapter");
  }

  /* ✅ SAFE UPDATE FIELDS */
  const allowedFields = ["name", "chapterNo", "description"];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      chapter[field] = req.body[field];
    }
  });

  chapter.updatedBy = user._id;

  await chapter.save();

  return res
    .status(200)
    .json(new ApiResponse(200, chapter, "Chapter updated"));
});

/* =====================================================
   ✅ DELETE (SOFT DELETE + HARD GUARD)
===================================================== */
export const deleteChapter = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid chapter id");
  }

  const chapter = await Chapter.findById(id);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  /* 🔥 GLOBAL PROTECTION */
  if (chapter.isGlobal && user.role !== "Super Admin") {
    throw new ApiError(403, "Cannot delete global chapter");
  }

  /* 🔐 SCHOOL SECURITY */
  if (
    user.role === "School Admin" &&
    chapter.schoolId?.toString() !== user.schoolId?.toString()
  ) {
    throw new ApiError(403, "You cannot delete this chapter");
  }

  chapter.isActive = false;
  chapter.status = "Inactive";
  chapter.updatedBy = user._id;

  await chapter.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Chapter deleted successfully"));
});

export const assignChapterToSchool = asyncHandler(async (req, res) => {
  const { chapterId, schoolId } = req.body;
  const user = req.user;

  /* 🔐 only super admin */
  if (user.role !== "Super Admin") {
    throw new ApiError(403, "Only Super Admin can assign chapters");
  }

  if (
    !mongoose.Types.ObjectId.isValid(chapterId) ||
    !mongoose.Types.ObjectId.isValid(schoolId)
  ) {
    throw new ApiError(400, "Invalid ids");
  }

  const chapter = await Chapter.findById(chapterId);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  if (!chapter.isGlobal) {
    throw new ApiError(400, "Only global chapters can be assigned");
  }

  const mapping = await ChapterSchoolMap.create({
    chapterId,
    schoolId,
    assignedBy: user._id
  });

  return res
    .status(201)
    .json(new ApiResponse(201, mapping, "Chapter assigned to school"));
});

export const getVisibleChapters = asyncHandler(async (req, res) => {
  const user = req.user;

  const {
    boardId,
    classId,
    subjectId,
    academicYearId,
    search = "",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  /* =====================================================
     🧠 BASE MATCH
  ===================================================== */

  const matchStage = {
    isActive: true,
  };

  if (boardId) matchStage.boardId = new mongoose.Types.ObjectId(boardId);
  if (classId) matchStage.classId = new mongoose.Types.ObjectId(classId);
  if (subjectId) matchStage.subjectId = new mongoose.Types.ObjectId(subjectId);
  if (academicYearId)
    matchStage.academicYearId = new mongoose.Types.ObjectId(academicYearId);

  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }

  /* =====================================================
     🔐 VISIBILITY LOGIC
  ===================================================== */

  let visibilityPipeline = [];

  if (user.role === "Super Admin") {
    // Super admin sees everything
    visibilityPipeline = [{ $match: matchStage }];
  } else if (user.role === "School Admin") {
    if (!user.schoolId) {
      throw new ApiError(400, "School not attached to user");
    }

    visibilityPipeline = [
      { $match: matchStage },

      // 🔗 lookup mapping
      {
        $lookup: {
          from: "chapterschools", // collection name (IMPORTANT)
          let: { chapterId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$chapterId", "$$chapterId"] },
                    {
                      $eq: [
                        "$schoolId",
                        new mongoose.Types.ObjectId(user.schoolId),
                      ],
                    },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
          ],
          as: "schoolMapping",
        },
      },

      // 🎯 visibility filter
      {
        $match: {
          $or: [
            { schoolId: new mongoose.Types.ObjectId(user.schoolId) }, // own chapter
            { isGlobal: true, schoolMapping: { $ne: [] } }, // assigned global
          ],
        },
      },
    ];
  } else {
    throw new ApiError(403, "Unauthorized role");
  }

  /* =====================================================
     🚀 MAIN PIPELINE
  ===================================================== */

  const pipeline = [
    ...visibilityPipeline,

    { $sort: { chapterNo: 1 } },

    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limitNum },

          // optional lightweight lookups
          {
            $lookup: {
              from: "boards",
              localField: "boardId",
              foreignField: "_id",
              as: "board",
            },
          },
          { $unwind: { path: "$board", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "classes",
              localField: "classId",
              foreignField: "_id",
              as: "class",
            },
          },
          { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

          {
            $lookup: {
              from: "subjects",
              localField: "subjectId",
              foreignField: "_id",
              as: "subject",
            },
          },
          { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },
        ],

        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const result = await Chapter.aggregate(pipeline);

  const chapters = result[0]?.data || [];
  const total = result[0]?.totalCount?.[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        data: chapters,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
        },
      },
      "Visible chapters fetched successfully"
    )
  );
});