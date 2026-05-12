import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Skeleton, Space, Typography } from "antd";
import { fetchMyStudentTimetable, fetchTimeSlots } from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { schoolIdFromUser } from "./timetableUi";

export default function StudentTimetablePage(){
 const dispatch=useDispatch(); const {user}=useSelector(s=>s.auth); const selectedAcademicYear=useSelector(s=>s.academicYear.selectedAcademicYear||s.academicYear.activeYear); const {timeSlots,myStudentTimetable,loading}=useSelector(s=>s.timetable); const schoolId=schoolIdFromUser(user); const academicYearId=selectedAcademicYear?._id;
 useEffect(()=>{ if(schoolId&&academicYearId){ dispatch(fetchTimeSlots({schoolId,academicYearId})); dispatch(fetchMyStudentTimetable({academicYearId})); }},[dispatch,schoolId,academicYearId]);
 return <Space direction="vertical" className="w-full" size="large"><Card><Typography.Title level={3}>My Class Timetable</Typography.Title><Typography.Text type="secondary">Readonly class-section weekly timetable.</Typography.Text></Card><Card>{!academicYearId?<Empty description="Select academic year"/>:loading?<Skeleton active/>:<TimetableGrid timeSlots={timeSlots} entries={myStudentTimetable} readOnly/>}</Card></Space>;
}