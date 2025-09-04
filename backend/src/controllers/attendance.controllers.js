import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Attendance } from '../models/attendance.model.js';

// 1. Mark Attendance (Create)
const markAttendance = asyncHandler(async (req, res) => {
  try {
    const { attendanceData } = req.body;

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid attendance data"));
    }

    const insertedRecords = [];

    for (const record of attendanceData) {
      // Normalize date to ignore time
      const dateStart = new Date(record.date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(record.date);
      dateEnd.setHours(23, 59, 59, 999);

      const existing = await Attendance.findOne({
        studentId: record.studentId,
        date: { $gte: dateStart, $lte: dateEnd },
      });

      if (!existing) {
        const newRecord = await Attendance.create(record);
        insertedRecords.push(newRecord);
      }
    }

    return res
      .status(201)
      .json(new ApiResponse(201, insertedRecords, "Attendance marked successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, error.message));
  }
});



// 2. Get Attendance by Student ID
const getAttendanceByStudent = asyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params;
        if (!studentId) {
            throw new ApiError(400, 'Student ID is missing');
        }

        const attendance = await Attendance.find({ studentId }).populate('classId subjectId recordedBy');
        if (!attendance) {
            throw new ApiError(400, 'No attendance record found');
        }

        return res.status(200).json(new ApiResponse(200, attendance, 'Attendance records retrieved successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Record not found!');
    }
});

// 3. Get Attendance by Class ID
const getAttendanceByClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params;
        if (!classId) {
            throw new ApiError(400, 'Class ID is missing');
        }

        const attendance = await Attendance.find({ classId }).populate('studentId subjectId recordedBy');
        if (!attendance) {
            throw new ApiError(400, 'No attendance record found');
        }

        return res.status(200).json(new ApiResponse(200, attendance, 'Attendance records retrieved successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Record not found!');
    }
});

// 4. Update Attendance Record
const updateAttendanceRecord = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (Object.keys(updates).length === 0) {
            throw new ApiError(400, 'No updates provided');
        }

        const updateAttendance = await Attendance.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );

        if (!updateAttendance) {
            throw new ApiError(400, 'Attendance not found');
        }

        return res.status(202).json(new ApiResponse(200, updateAttendance, 'Attendance record updated successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Record not found!');
    }
});

// 5. Delete Attendance Record
const deleteAttendanceRecord = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const deletedAttendance = await Attendance.findByIdAndUpdate(
            id,
            { $set: { isVisible: false } },
            { new: true }
        );

        if (!deletedAttendance) {
            throw new ApiError(400, 'Attendance record not found');
        }

        return res.status(200).json(new ApiResponse(200, deletedAttendance, 'Attendance record deleted successfully'));
    } catch (error) {
        throw new ApiError(500, error.message || 'Record not found!');
    }
});

export {
    markAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord
};
