import { AcademicYear } from "../models/AcademicYear.model.js";
import { StudentEnrollment } from "../models/StudentEnrollment.model.js";
import { StudentTransportAssignment } from "../models/StudentTransportAssignment.model.js";
import { Transport } from "../models/Transport.model.js";
import { TransportRoute } from "../models/TransportRoute.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) => req.user?.schoolId || req.body?.schoolId || req.query?.schoolId;

const resolveAcademicYearId = (req) => req.body?.academicYearId || null;

const resolveActiveAcademicYear = async (schoolId) => {
  const academicYear = await AcademicYear.findOne({ schoolId, isActive: true }).select("_id name");

  if (!academicYear) {
    throw new ApiError(404, "Active academic year not found");
  }

  return academicYear;
};

export const getVehicles = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const filter = schoolId ? { schoolId } : {};

  const vehicles = await Transport.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, vehicles, "Vehicles fetched successfully"));
});

export const createVehicle = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const { type, number, driver, capacity, status, route, driverContact, drivingLicense } = req.body;

  if (!number || !driver) {
    throw new ApiError(400, "Vehicle number and driver are required");
  }

  const vehicle = await Transport.create({
    schoolId,
    academicYearId: resolveAcademicYearId(req),
    vehicleType: type || "Bus",
    busNumber: number,
    driverName: driver,
    driverContact: driverContact || "NA",
    drivingLicense: drivingLicense || "NA",
    capacity: capacity || 0,
    status: status || "Available",
    route: route || "",
  });

  return res.status(201).json(new ApiResponse(201, vehicle, "Vehicle created successfully"));
});

export const updateVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = {};

  const fieldMap = {
    type: "vehicleType",
    number: "busNumber",
    driver: "driverName",
    capacity: "capacity",
    status: "status",
    route: "route",
    driverContact: "driverContact",
    drivingLicense: "drivingLicense",
  };

  Object.entries(fieldMap).forEach(([key, mappedKey]) => {
    if (req.body[key] !== undefined) {
      updates[mappedKey] = req.body[key];
    }
  });

  const vehicle = await Transport.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  return res.status(200).json(new ApiResponse(200, vehicle, "Vehicle updated successfully"));
});

export const deleteVehicle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const vehicle = await Transport.findByIdAndDelete(id);

  if (!vehicle) throw new ApiError(404, "Vehicle not found");

  return res.status(200).json(new ApiResponse(200, null, "Vehicle deleted successfully"));
});

export const getRoutes = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  const filter = schoolId ? { schoolId } : {};

  const routes = await TransportRoute.find(filter).sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, routes, "Routes fetched successfully"));
});

export const createRoute = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const { name, bus, stops = [], students = 0 } = req.body;

  if (!name || !bus) throw new ApiError(400, "Route name and bus are required");

  const route = await TransportRoute.create({
    schoolId,
    academicYearId: resolveAcademicYearId(req),
    name,
    bus,
    stops: Array.isArray(stops) ? stops : [],
    students,
  });

  return res.status(201).json(new ApiResponse(201, route, "Route created successfully"));
});

export const updateRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, bus, stops, students } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (bus !== undefined) updates.bus = bus;
  if (stops !== undefined) updates.stops = Array.isArray(stops) ? stops : [];
  if (students !== undefined) updates.students = students;

  const route = await TransportRoute.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!route) throw new ApiError(404, "Route not found");

  return res.status(200).json(new ApiResponse(200, route, "Route updated successfully"));
});

export const deleteRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const route = await TransportRoute.findByIdAndDelete(id);

  if (!route) throw new ApiError(404, "Route not found");

  return res.status(200).json(new ApiResponse(200, null, "Route deleted successfully"));
});

export const getAssignableStudents = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const activeAcademicYear = await resolveActiveAcademicYear(schoolId);

  const enrollments = await StudentEnrollment.find({
    schoolId,
    academicYearId: activeAcademicYear._id,
    status: "Active",
  })
    .populate({
      path: "studentId",
      populate: {
        path: "userId",
        select: "name email",
      },
      select: "userId",
    })
    .populate("schoolClassId", "name")
    .populate("sectionId", "name")
    .sort({ createdAt: -1 })
    .lean();

  const students = enrollments.map((enrollment) => ({
    _id: enrollment._id,
    registrationNumber: enrollment.registrationNumber,
    name: enrollment.studentId?.userId?.name || "Unknown Student",
    email: enrollment.studentId?.userId?.email || "",
    className: enrollment.schoolClassId?.name || "",
    sectionName: enrollment.sectionId?.name || "",
  }));

  return res.status(200).json(new ApiResponse(200, students, "Assignable students fetched successfully"));
});

export const getTransportAssignments = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const activeAcademicYear = await resolveActiveAcademicYear(schoolId);

  const assignments = await StudentTransportAssignment.find({
    schoolId,
    academicYearId: activeAcademicYear._id,
    isActive: true,
  })
    .populate("routeId")
    .populate("vehicleId")
    .populate({
      path: "studentEnrollmentId",
      select: "registrationNumber schoolClassId sectionId studentId",
      populate: [
        {
          path: "studentId",
          select: "userId",
          populate: {
            path: "userId",
            select: "name",
          },
        },
        { path: "schoolClassId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, assignments, "Transport assignments fetched successfully"));
});

export const createOrUpdateTransportAssignment = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) throw new ApiError(400, "schoolId is required");

  const { studentEnrollmentId, routeId, vehicleId, pickupStop, dropStop } = req.body;

  if (!studentEnrollmentId || !routeId || !vehicleId) {
    throw new ApiError(400, "studentEnrollmentId, routeId and vehicleId are required");
  }

  const activeAcademicYear = await resolveActiveAcademicYear(schoolId);

  const assignment = await StudentTransportAssignment.findOneAndUpdate(
    {
      schoolId,
      academicYearId: activeAcademicYear._id,
      studentEnrollmentId,
    },
    {
      schoolId,
      academicYearId: activeAcademicYear._id,
      studentEnrollmentId,
      routeId,
      vehicleId,
      pickupStop: pickupStop || "",
      dropStop: dropStop || "",
      isActive: true,
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  )
    .populate("routeId")
    .populate("vehicleId")
    .populate({
      path: "studentEnrollmentId",
      select: "registrationNumber schoolClassId sectionId studentId",
      populate: [
        {
          path: "studentId",
          select: "userId",
          populate: {
            path: "userId",
            select: "name",
          },
        },
        { path: "schoolClassId", select: "name" },
        { path: "sectionId", select: "name" },
      ],
    });

  return res.status(200).json(new ApiResponse(200, assignment, "Transport assignment saved successfully"));
});

export const deleteTransportAssignment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assignment = await StudentTransportAssignment.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!assignment) {
    throw new ApiError(404, "Transport assignment not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Transport assignment removed successfully"));
});
