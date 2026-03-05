import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { School }  from '../models/school.model.js'
import { initializeNewSchool } from "../utils/schoolSetup.js"; // ✅ import setup function
import { SubscriptionPlan } from "../models/SubscriptionPlan.model.js";
import { SchoolSubscription } from '../models/schoolSubscription.model.js';
import { SchoolBoard } from '../models/School_board.model.js';

const registerSchool = asyncHandler(async (req, res) => {

  const {
    name,
    address,
    email,
    phone,
    website,
    isActive,
    boards,
    subscriptionPlan
  } = req.body;

  // Validate
  if (!name || !email)
    throw new ApiError(400, "Name and Email are required");

  const existingSchool = await School.findOne({ email });

  if (existingSchool)
    throw new ApiError(400, "School already registered");

  // Upload Logo
  let logoUrl = "";

  if (req.files?.logo?.[0]?.path) {
    const uploadLogo = await uploadOnCloudinary(req.files.logo[0].path);
    logoUrl = uploadLogo?.url || "";
  }

  // 1️⃣ Create School
  const newSchool = await School.create({
    name,
    address,
    email,
    phone,
    website,
    logo: logoUrl,
    isActive
  });

  const schoolId = newSchool._id;

  // 2️⃣ Assign Boards
  if (boards && boards.length > 0) {

    const schoolBoards = boards.map((boardId, index) => ({
      schoolId,
      boardId,
      isPrimary: index === 0,
      assignedBy: req.user._id,
      assignedByRole: req.user.role
    }));

    await SchoolBoard.insertMany(schoolBoards);

  }

  // 3️⃣ Assign Subscription Plan
  if (subscriptionPlan) {

    const plan = await SubscriptionPlan.findById(subscriptionPlan);

    if (!plan)
      throw new ApiError(404, "Subscription plan not found");

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationInDays);

    await SchoolSubscription.create({
      schoolId,
      planId: plan._id,

      snapshot: {
        price: plan.price,
        durationInDays: plan.durationInDays,
        features: plan.features
      },

      startDate: new Date(),
      endDate,
      paymentStatus: "completed"
    });

  }

  // 4️⃣ Default Setup
  await initializeNewSchool(schoolId);

  res.status(201).json(
    new ApiResponse(
      201,
      newSchool,
      "School registered successfully with boards and subscription"
    )
  );

});



const getAllSchools = asyncHandler(async (req, res) => {
  const {
    search,
    page = 1,
    limit = 10,
    sort = "name",
    order = "asc",
  } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);
  const skip = (pageNumber - 1) * limitNumber;

  /* ================= SEARCH ================= */

  const matchStage = search
    ? {
        name: { $regex: search, $options: "i" },
      }
    : {};

  /* ================= PIPELINE ================= */

  const schools = await School.aggregate([
    {
      $match: matchStage,
    },

    /* ================= SCHOOL BOARDS ================= */

    {
      $lookup: {
        from: "schoolboards",
        localField: "_id",
        foreignField: "schoolId",
        as: "schoolBoards",
      },
    },

    /* ================= BOARD DETAILS ================= */

    {
      $lookup: {
        from: "boards",
        localField: "schoolBoards.boardId",
        foreignField: "_id",
        as: "boards",
      },
    },

    /* ================= SUBSCRIPTION ================= */

    {
      $lookup: {
        from: "schoolsubscriptions",
        localField: "_id",
        foreignField: "schoolId",
        as: "subscription",
      },
    },

    {
      $unwind: {
        path: "$subscription",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "subscriptionplans",
        localField: "subscription.planId",
        foreignField: "_id",
        as: "subscription.plan",
      },
    },

    {
      $unwind: {
        path: "$subscription.plan",
        preserveNullAndEmptyArrays: true,
      },
    },

    /* ================= SORT ================= */

    {
      $sort: {
        [sort]: order === "desc" ? -1 : 1,
      },
    },

    /* ================= PAGINATION ================= */

    {
      $skip: skip,
    },

    {
      $limit: limitNumber,
    },

    /* ================= RESPONSE CLEAN ================= */

    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        website: 1,
        address: 1,
        logo: 1,
        isActive: 1,

        boards: {
          _id: 1,
          name: 1,
        },

        subscriptionPlan: "$subscription.plan",

        createdAt: 1,
      },
    },
  ]);

  /* ================= TOTAL ================= */

  const totalSchools = await School.countDocuments(matchStage);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        schools,
        total: totalSchools,
        page: pageNumber,
        limit: limitNumber,
      },
      "Schools retrieved successfully"
    )
  );
});

const getSchoolById = asyncHandler(async (req, res) => {
    const school = await School.findById(req.params.schoolId)
    if (!school) throw new ApiError(404, 'School not found')

    res.status(200).json(
        new ApiResponse(200, school, 'School retrieved successfully')
    )
})

const updateSchool = asyncHandler(async (req, res) => {
    const { schoolId } = req.params
    const { name, address, email, phone, website, isActive } = req.body

    const school = await School.findById(schoolId)
    if (!school) throw new ApiError(404, 'School not found')

    // Update school details
    if (name) school.name = name
    if (address) school.address = address
    if (email) school.email = email
    if (phone) school.phone = phone
    if (website) school.website = website
    if (isActive !== undefined) school.isActive = isActive === 'true'

    // Handle new logo upload
    if (req.files?.logo?.[0]?.path) {
        const uploadLogo = await uploadOnCloudinary(req.files.logo[0].path)
        if (uploadLogo?.url) school.logo = uploadLogo.url
    }

    await school.save()
    res.status(200).json(
        new ApiResponse(200, school, 'School updated successfully')
    )
})

const activateSchool = asyncHandler(async (req, res) => {
    const school = await School.findByIdAndUpdate(
        req.params.schoolId,
        { isActive: true },
        { new: true }
    )
    if (!school) throw new ApiError(404, 'School not found')

    res.status(200).json(
        new ApiResponse(200, school, 'School activated successfully')
    )
})

// ✅ Deactivate School
const deactivateSchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const school = await School.findByIdAndUpdate(
    schoolId,
    { isActive: false },
    { new: true }
  );

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return res.status(200).json(
    new ApiResponse(200, school, 'School deactivated successfully')
  );
});

// ✅ Delete School
const deleteSchool = asyncHandler(async (req, res) => {
  const { schoolId } = req.params;

  const school = await School.findByIdAndDelete(schoolId);

  if (!school) {
    throw new ApiError(404, 'School not found');
  }

  return res.status(200).json(
    new ApiResponse(200, null, 'School deleted successfully')
  );
});

export {
    registerSchool,
    getAllSchools,
    getSchoolById,
    updateSchool,
    activateSchool,
    deactivateSchool,
    deleteSchool,
}
