import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Skeleton, Space, Typography } from "antd";
import { fetchMyTeacherTimetable, fetchTimeSlots } from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { schoolIdFromUser } from "./timetableUi";

export default function TeacherTimetablePage() {
    const dispatch = useDispatch();
    const { user } = useSelector(s => s.auth);
    const selectedAcademicYear = useSelector(s => s.academicYear.selectedAcademicYear || s.academicYear.activeYear);
    const { timeSlots, myTeacherTimetable, loading } = useSelector(s => s.timetable);
    const schoolId = schoolIdFromUser(user); const academicYearId = selectedAcademicYear?._id;
    useEffect(() => {
        if (schoolId && academicYearId) {
            dispatch(fetchTimeSlots({ schoolId, academicYearId }));
            dispatch(fetchMyTeacherTimetable({ schoolId, academicYearId }));
        }
    }, [dispatch, schoolId, academicYearId]);

    return <Space direction="vertical" className="w-full" size="large">
        <Card>
            <Typography.Title level={3}>My Teaching Timetable</Typography.Title>
            <Typography.Text type="secondary">Readonly weekly timetable with today's column highlighted.</Typography.Text>
        </Card>
        <Card>{!academicYearId ? <Empty description="Select academic year" /> : loading ? <Skeleton active /> : <TimetableGrid timeSlots={timeSlots} entries={myTeacherTimetable} readOnly />}</Card></Space>;
}
