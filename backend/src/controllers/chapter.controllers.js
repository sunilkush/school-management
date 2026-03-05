import mongoose from "mongoose";
import { Chapter } from "../models/Chapter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
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
      schoolClassId,
      subjectId,
      isGlobal,
      schoolId: bodySchoolId,
    } = req.body;

    const user = req.user;

    /* =====================================================
       ✅ BASIC VALIDATION
    ===================================================== */
    if (!name || !chapterNo || !boardId || !schoolClassId || !subjectId) {
      throw new ApiError(400, "Required fields missing");
    }

    /* =====================================================
       ✅ OBJECT ID VALIDATION
    ===================================================== */
    const idsToValidate = [boardId, schoolClassId, subjectId];
    if (idsToValidate.some((id) => !isValidObjectId(id))) {
      throw new ApiError(400, "Invalid reference id");
    }

    /* =====================================================
       ✅ GET USER ROLE
    ===================================================== */
    const populatedUser = await User.findById(user._id)
      .populate("roleId", "name")
      

    const roleName = populatedUser?.roleId?.name;

    if (!roleName) {
      throw new ApiError(403, "User role not found");
    }

    let schoolId = null;
    let finalIsGlobal = false;

    /* =====================================================
       🧠 ROLE BASED BUSINESS LOGIC (ENTERPRISE SAFE)
    ===================================================== */

    // ✅ SUPER ADMIN
    if (roleName === "Super Admin") {
      finalIsGlobal = isGlobal ?? true; // ⭐ default GLOBAL

      if (!finalIsGlobal) {
        // school specific chapter
        if (!bodySchoolId) {
          throw new ApiError(
            400,
            "schoolId required when creating school chapter"
          );
        }

        if (!isValidObjectId(bodySchoolId)) {
          throw new ApiError(400, "Invalid schoolId");
        }

        schoolId = bodySchoolId;
      }
    }

    // ✅ SCHOOL ADMIN
    else if (roleName === "School Admin") {
      if (!user?.schoolId) {
        throw new ApiError(400, "School Admin has no school assigned");
      }

      finalIsGlobal = false;
      schoolId = user.schoolId;
    }

    // ❌ OTHER ROLES
    else {
      throw new ApiError(403, "Unauthorized role");
    }

    /* =====================================================
       🚀 CREATE CHAPTER
    ===================================================== */
    const chapter = await Chapter.create(
      [
        {
          name: name.trim(),
          chapterNo,
          description,
          boardId,
          schoolClassId,
          subjectId,
          isGlobal: finalIsGlobal,
          schoolId,
          createdByRole: roleName,
          createdBy: user._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res
      .status(201)
      .json(
        new ApiResponse(201, chapter[0], "Chapter created successfully")
      );
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    /* =====================================================
       🔥 DUPLICATE SAFE
    ===================================================== */
    if (error?.code === 11000) {
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
    schoolClassId,
    subjectId,
    page = 1,
    limit = 10,
    search = ""
  } = req.query;

  const user = req.user;

  page = Math.max(1, Number(page));
  limit = Math.min(100, Number(limit));

  const filter = { isActive: true };
      /* =====================================================
       ✅ GET USER ROLE
    ===================================================== */
    const populatedUser = await User.findById(user._id)
      .populate("roleId", "name")
      

    const roleName = populatedUser?.roleId?.name;

  /* 🧠 VISIBILITY */

  if (roleName === "School Admin") {
    filter.$or = [{ isGlobal: true }, { schoolId: user.schoolId }];
  }

  /* 🎯 FILTERS */

  if (boardId && isValidObjectId(boardId)) filter.boardId = boardId;
  if (schoolClassId && isValidObjectId(schoolClassId)) filter.schoolClassId = schoolClassId;
  if (subjectId && isValidObjectId(subjectId)) filter.subjectId = subjectId;

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [chapters, total] = await Promise.all([
    Chapter.find(filter)
      .populate("boardId schoolClassId subjectId academicYearId schoolId")
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
    .populate("boardId schoolClassId subjectId academicYearId schoolId")
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

  /* =====================================================
       ✅ GET USER ROLE
    ===================================================== */
    const populatedUser = await User.findById(user._id)
      .populate("roleId", "name")
      

    const roleName = populatedUser?.roleId?.name;


  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid chapter id");
  }

  const chapter = await Chapter.findById(id);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  /* 🔥 GLOBAL PROTECTION */
  if (chapter.isGlobal && roleName !== "Super Admin") {
    throw new ApiError(403, "Cannot modify global chapter");
  }

  /* 🔐 SCHOOL SECURITY */
  if (
    roleName === "School Admin" &&
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

  /* =====================================================
       ✅ GET USER ROLE
    ===================================================== */
    const populatedUser = await User.findById(user._id)
      .populate("roleId", "name")
      

    const roleName = populatedUser?.roleId?.name;

  if (!isValidObjectId(id)) {
    throw new ApiError(400, "Invalid chapter id");
  }

  const chapter = await Chapter.findById(id);

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  /* 🔥 GLOBAL PROTECTION */
  if (chapter.isGlobal && roleName !== "Super Admin") {
    throw new ApiError(403, "Cannot delete global chapter");
  }
  
  /* 🔐 SCHOOL SECURITY */
  if (
    roleName === "School Admin" &&
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



export const getVisibleChapters = asyncHandler(async (req, res) => {
  const user = req.user;

  const {
    boardId,
    schoolClassId,
    subjectId,
    search = "",
    page = 1,
    limit = 10,
  } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  /* =====================================================
       ✅ GET USER ROLE
    ===================================================== */
    const populatedUser = await User.findById(user._id)
      .populate("roleId", "name")
      

    const roleName = populatedUser?.roleId?.name;

  /* =====================================================
     🧠 BASE MATCH
  ===================================================== */

  const matchStage = {
    isActive: true,
  };

  if (boardId) matchStage.boardId = new mongoose.Types.ObjectId(boardId);
  if (schoolClassId) matchStage.schoolClassId = new mongoose.Types.ObjectId(schoolClassId);
  if (subjectId) matchStage.subjectId = new mongoose.Types.ObjectId(subjectId);

  if (search) {
    matchStage.name = { $regex: search, $options: "i" };
  }

  /* =====================================================
     🔐 VISIBILITY LOGIC
  ===================================================== */

  let visibilityPipeline = [];
  

  if (roleName === "Super Admin") {
    // Super admin sees everything
    visibilityPipeline = [{ $match: matchStage }];
  } else if (roleName === "School Admin") {
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
              localField: "schoolClassId",
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