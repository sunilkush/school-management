import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import {Attendance} from '../models/attendance.model.js';


// 1. Mark Attendance (Create)
const markAttendance = asyncHandler(async (req, res) => {
    try {
        const {
            schoolId,
            studentId,
            classId,
            subjectId,
            date,
            status,
            recordedBy,
        } = req.body

        if (
            [
                schoolId,
                studentId,
                classId,
                subjectId,
                date,
                status,
                recordedBy,
            ].some((fields) => fields?.trim() === '')
        ) {
            throw new ApiError(400, 'All fileds Required !')
        }

        const attendance = new Attendance({
            schoolId,
            studentId,
            classId,
            subjectId,
            date,
            status,
            recordedBy,
        })

        const saveAttendance = await attendance.save()

        return res.status(201).json(
            new ApiResponse(
                200,
                saveAttendance,

                'Attendance recorded successfully'
            )
        )
    } catch (error) {
        throw new ApiError(500, error.message || 'recorded not found !')
    }
})

// 2. Get Attendance by Student ID
const getAttendanceByStudent = asyncHandler(async (req, res) => {
    try {
        const { studentId } = req.params
        if (studentId === '') {
            throw new ApiError(400, 'student id missing')
        }
        const attendance = await Attendance.findById({ studentId }).populate(
            'classId subjectId recordedBy'
        )

        if (!attendance) {
            throw new ApiError(400, "something went wrong's")
        }
        return res
            .status(200)
            .json( 
                new ApiResponse(
                    200,
                    attendance,
                    'Attendance recorded find successfully'
                )
            )
    } catch (error) {
        throw new ApiError(500, error.message || 'recorded not found !')
    }
})
// 3. Get Attendance by Class ID
const getAttendanceByClass = asyncHandler(async (req, res) => {
    try {
        const { classId } = req.params
        const attendance = await Attendance.find({ classId }).populate(
            'studentId subjectId recordedBy'
        )
        if (!attendance) {
            throw new ApiError(400, "something went wrong's")
        }
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    attendance,
                    'Attendance recorded find successfully'
                )
            )
    } catch (error) {
        throw new ApiError(500, error.message || 'recorded not found !')
    }
})
// 4. Update Attendance Record

const updateAttendanceRecord = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params
        const {} = req.body

        const updateAttendance = await Attendance.findByIdAndUpdate(
            id,
            {
                $set: {},
            },
            {
                new: true,
            }
        )

        if (!updateAttendance) {
            throw new ApiError(400, 'Attendance not found')
        }

        return res
            .status(202)
            .json(
                new ApiResponse(
                    200,
                    updateAttendance,
                    'Attendance record updated successfully'
                )
            )
    } catch (error) {
        throw new ApiError(500, error.message || 'recorded not found !')
    }
})

// 5. Delete Attendance Record

const deleteAttendanceRecord = asyncHandler(async(req,res)=>{
      try {
        const { id } = req.params;
        const deletedAttendance = await Attendance.findByIdAndUpdate(id,{
            $set:{
                isVisble:false
            }
        },{
            new:true
        });
        if (!deletedAttendance) {
            throw new ApiError(400,"data not found")
        };

        return res.status(200).json(
            new ApiResponse(200,"Attendance record deleted successfully")
        )
      } catch (error) {
        throw new ApiError(500, error.message || 'recorded not found !')
      }
})

export {
    markAttendance,
    getAttendanceByStudent,
    getAttendanceByClass,
    updateAttendanceRecord,
    deleteAttendanceRecord
}
