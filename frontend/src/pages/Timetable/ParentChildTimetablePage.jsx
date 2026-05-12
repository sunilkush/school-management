import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Empty, Input, Select, Skeleton, Space, Typography, App } from "antd";
import apiClient from "../../api/httpClient";
import { fetchChildTimetable, fetchTimeSlots } from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getName, schoolIdFromUser } from "./timetableUi";

export default function ParentChildTimetablePage() {
    const dispatch = useDispatch(); 
    const { message } = App.useApp(); 
    const { user } = useSelector(s => s.auth); 
    const selectedAcademicYear = useSelector(s => s.academicYear.selectedAcademicYear || s.academicYear.activeYear); 
    const { timeSlots, childTimetable, loading } = useSelector(s => s.timetable); 
    const [children, setChildren] = useState([]); const [studentId, setStudentId] = useState(""); 
    const schoolId = schoolIdFromUser(user); const academicYearId = selectedAcademicYear?._id;
    useEffect(() => { 
        if (schoolId && academicYearId) 
            dispatch(fetchTimeSlots({ schoolId, academicYearId })); 
        }, [dispatch, schoolId, academicYearId]);
    useEffect(() => { 
        apiClient.get("/student", { 
            params: { parentId: user?._id, schoolId } 
        })
        .then(r => setChildren(r.data?.data || []))
        .catch(() => setChildren([]));
     },[user?._id, schoolId]);

    const load = () => { 
        if (!studentId || !academicYearId) 
            return message.error("Select child and academic year"); 
            dispatch(fetchChildTimetable({ studentId, academicYearId }))
            .unwrap()
            .catch(message.error); 
        };
    return <Space direction="vertical" className="w-full" size="large">
        <Card>
            <Typography.Title level={3}>Child Timetable</Typography.Title>
            <Typography.Text type="secondary">Select a child to view the active weekly timetable.</Typography.Text>
            <Space wrap className="mt-4">
                <Select style={{ minWidth: 260 }} placeholder="Select child" value={studentId || undefined} onChange={setStudentId} options={children.map(c => ({ value: c._id, label: getName(c.userId) || getName(c) }))} />
                <Input style={{ width: 260 }} placeholder="Or paste student id" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
                <Button type="primary" onClick={load}>View Timetable</Button>
            </Space>
        </Card>
        <Card>
            {loading ? <Skeleton active /> : childTimetable.length ? <TimetableGrid timeSlots={timeSlots} entries={childTimetable} readOnly /> : <Empty description="Select a child to view timetable" />}
        </Card>
    </Space>;
}
