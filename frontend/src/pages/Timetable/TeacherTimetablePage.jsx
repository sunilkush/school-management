import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, App, Card, Empty, Select, Skeleton, Space, Typography } from "antd";
import apiClient from "../../api/httpClient";
import { fetchMyTeacherTimetable, fetchTimeSlots, fetchTimetable } from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getName, schoolIdFromUser } from "./timetableUi";

const getRoleName = (user) => {
    const role = user?.roleId || user?.role;
    return (role?.name || role || "").toString().toLowerCase();
};

const getTeacherName = (teacher = {}) => teacher?.name || teacher?.fullName || teacher?.email || "Unnamed Teacher";

export default function TeacherTimetablePage() {
    const dispatch = useDispatch();
    const { message } = App.useApp();
    const { user } = useSelector(s => s.auth);
    const selectedAcademicYear = useSelector(s => s.academicYear.selectedAcademicYear || s.academicYear.activeYear);
    const { timeSlots, myTeacherTimetable, teacherTimetable, loading } = useSelector(s => s.timetable);
    const schoolId = schoolIdFromUser(user);
    const academicYearId = selectedAcademicYear?._id;
    const isSchoolAdmin = getRoleName(user) === "school admin";
    const [teachers, setTeachers] = useState([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState("");

    useEffect(() => {
        if (!schoolId || !academicYearId) return;
        dispatch(fetchTimeSlots({ schoolId, academicYearId }));
    }, [dispatch, schoolId, academicYearId]);

    useEffect(() => {
        if (!isSchoolAdmin || !schoolId) return;

        let ignore = false;
        apiClient.get("/user/all", { params: { schoolId, roleName: "Teacher", isActive: true } })
            .then((res) => {
                if (ignore) return;
                const rows = res.data?.data || [];
                setTeachers(rows);
                setSelectedTeacherId((current) => current || rows[0]?._id || "");
            })
            .catch((error) => {
                if (!ignore) message.error(error.response?.data?.message || error.message || "Failed to load teachers");
            });

        return () => { ignore = true; };
    }, [isSchoolAdmin, schoolId, message]);

    useEffect(() => {
        if (!schoolId || !academicYearId) return;

        if (isSchoolAdmin) {
            if (!selectedTeacherId) return;
            dispatch(fetchTimetable({ schoolId, academicYearId, teacherId: selectedTeacherId }));
            return;
        }

        dispatch(fetchMyTeacherTimetable({ schoolId, academicYearId }));
    }, [dispatch, schoolId, academicYearId, isSchoolAdmin, selectedTeacherId]);

    const entries = isSchoolAdmin ? teacherTimetable : myTeacherTimetable;
    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => teacher._id === selectedTeacherId),
        [teachers, selectedTeacherId]
    );

    return <Space direction="vertical" className="w-full" size="large">
        <Card>
            <Typography.Title level={3}>{isSchoolAdmin ? "Teacher Timetable" : "My Teaching Timetable"}</Typography.Title>
            <Typography.Text type="secondary">
                {isSchoolAdmin
                    ? "Select a teacher to view their readonly weekly teaching timetable."
                    : "Readonly weekly timetable with today's column highlighted."}
            </Typography.Text>
        </Card>

        {isSchoolAdmin ? (
            <Card>
                <Space direction="vertical" size="middle" className="w-full">
                    <Alert
                        type="info"
                        showIcon
                        message="Need changes in schedule?"
                        description="Please update periods from the Timetable Planner page."
                    />
                    <Select
                        value={selectedTeacherId || undefined}
                        placeholder="Select teacher"
                        style={{ width: "min(100%, 360px)" }}
                        onChange={setSelectedTeacherId}
                        showSearch
                        optionFilterProp="label"
                        options={teachers.map((teacher) => ({
                            value: teacher._id,
                            label: getTeacherName(teacher),
                        }))}
                    />
                    {selectedTeacher ? (
                        <Typography.Text type="secondary">Showing timetable for {getName(selectedTeacher, getTeacherName(selectedTeacher))}</Typography.Text>
                    ) : null}
                </Space>
            </Card>
        ) : null}

        <Card>
            {!academicYearId ? (
                <Empty description="Select academic year" />
            ) : isSchoolAdmin && !selectedTeacherId ? (
                <Empty description="Select a teacher to view timetable" />
            ) : loading ? (
                <Skeleton active />
            ) : (
                <TimetableGrid timeSlots={timeSlots} entries={entries} readOnly showClass />
            )}
        </Card>
    </Space>;
}