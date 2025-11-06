import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import  {School}  from '../models/school.model.js'
import { initializeNewSchool } from "../utils/schoolSetup.js"; // ✅ import setup function

const registerSchool = asyncHandler(async (req, res) => {
  const { name, address, email, phone, website, isActive } = req.body;

  // Validate required fields
  if (!name || !email)
    return res.status(400).json({ message: "Name and Email are required" });

  // Check if school already exists
  const existingSchool = await School.findOne({ email });
  if (existingSchool) throw new ApiError(400, "School already registered");

  // Handle logo upload
  let logoUrl = "";
  if (req.files?.logo?.[0]?.path) {
    const uploadLogo = await uploadOnCloudinary(req.files.logo[0].path);
    logoUrl = uploadLogo?.url || "";
  }

  // Create and save new school
  const newSchool = await School.create({
    name,
    address,
    email,
    phone,
    website,
    logo: logoUrl,
    isActive,
  });

  // ✅ Initialize default setup
  await initializeNewSchool(newSchool._id);

  res
    .status(201)
    .json(new ApiResponse(201, newSchool, "School registered successfully and setup completed."));
});

const getAllSchools = asyncHandler(async (req, res) => {
    const {
        search,
        page = 1,
        limit = 10,
        sort = 'name',
        order = 'asc',
    } = req.query
    const query = search ? { name: { $regex: search, $options: 'i' } } : {}

    const schools = await School.find(query)
        .sort({ [sort]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))

    const totalSchools = await School.countDocuments(query)
    res.status(200).json(
        new ApiResponse(
            200,
            { schools, total: totalSchools },
            'Schools retrieved successfully'
        )
    )
})

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
