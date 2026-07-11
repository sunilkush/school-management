import { HostelRoom } from "../models/HostelRoom.model.js";
import { HostelLeave } from "../models/HostelLeave.model.js";
import { HostelVisitor } from "../models/HostelVisitor.model.js";
import { HostelComplaint } from "../models/HostelComplaint.model.js";
import { HostelAttendance } from "../models/HostelAttendance.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const resolveSchoolId = (req) =>
  req.user?.schoolId?._id || req.user?.schoolId || req.user?.school?._id;

export const getHostelWardenDashboard = asyncHandler(async (req, res) => {
  const schoolId = resolveSchoolId(req);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [
    totalRooms,
    occupiedRoomsData,
    monthlyAdmissionsData,
    pendingLeaves,
    leavesToday,
    visitorsToday,
    openComplaints,
    urgentComplaints,
    lastAttendance,
  ] = await Promise.all([
    HostelRoom.countDocuments({ schoolId }),

    HostelRoom.aggregate([
      { $match: { schoolId } },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: "$capacity" },
          totalOccupied: { $sum: { $size: "$students" } },
        },
      },
    ]),

    HostelRoom.aggregate([
      { $match: { schoolId } },
      { $unwind: "$students" },
      { $match: { "students.createdAt": { $gte: monthStart } } },
      { $count: "count" },
    ]),

    HostelLeave.countDocuments({ schoolId, status: "pending" }),

    HostelLeave.countDocuments({
      schoolId, status: "approved",
      fromDate: { $lte: todayEnd }, toDate: { $gte: todayStart },
    }),

    HostelVisitor.countDocuments({ schoolId, createdAt: { $gte: todayStart, $lte: todayEnd } }),

    HostelComplaint.countDocuments({ schoolId, status: { $in: ["open", "in_progress"] } }),

    HostelComplaint.countDocuments({ schoolId, status: "open", priority: "urgent" }),

    HostelAttendance.findOne({ schoolId })
      .sort({ date: -1 })
      .select("date session totalPresent totalAbsent totalOnLeave"),
  ]);

  const roomStats = occupiedRoomsData[0] || { totalCapacity: 0, totalOccupied: 0 };
  const totalStudents = roomStats.totalOccupied;
  const monthlyAdmissions = monthlyAdmissionsData[0]?.count || 0;
  const vacantRooms = totalRooms - (roomStats.totalOccupied > 0 ? Math.ceil(roomStats.totalOccupied / Math.max(roomStats.totalCapacity / totalRooms, 1)) : 0);

  // Monthly leave trend (last 6 months)
  const leaveMonthly = await HostelLeave.aggregate([
    { $match: { schoolId, createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 5)) } } },
    { $group: { _id: { $dateToString: { format: "%b", date: "$createdAt" } }, count: { $sum: 1 } } },
    { $sort: { "_id": 1 } },
  ]);

  // Complaint breakdown by type
  const complaintByType = await HostelComplaint.aggregate([
    { $match: { schoolId, status: { $in: ["open", "in_progress"] } } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);

  const occupancyRate = roomStats.totalCapacity > 0
    ? Math.round((roomStats.totalOccupied / roomStats.totalCapacity) * 100)
    : 0;

  return res.json(new ApiResponse(200, {
    kpis: {
      totalRooms,
      totalCapacity:   roomStats.totalCapacity,
      totalOccupied:   roomStats.totalOccupied,
      vacantBeds:      Math.max(0, roomStats.totalCapacity - roomStats.totalOccupied),
      totalStudents,
      pendingLeaves,
      leavesToday,
      visitorsToday,
      openComplaints,
      urgentComplaints,
      occupancyRate,
      newAdmissionsThisMonth: monthlyAdmissions,
    },
    lastAttendance,
    leaveMonthly,
    complaintByType,
  }, "Dashboard data fetched"));
});
