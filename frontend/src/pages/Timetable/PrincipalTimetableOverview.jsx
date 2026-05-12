import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Col, Empty, Row, Select, Skeleton, Space, Statistic, Typography, App } from "antd";
import apiClient from "../../api/httpClient";
import { fetchRooms, fetchTimeSlots, fetchTimetable } from "../../features/timetableSlice";
import TimetableGrid from "./TimetableGrid";
import { getId, getName, schoolIdFromUser } from "./timetableUi";

export default function PrincipalTimetableOverview() {
    const dispatch = useDispatch();
    const { message } = App.useApp();
    const { user } = useSelector(s => s.auth);
    const selectedAcademicYear = useSelector(s => s.academicYear.selectedAcademicYear || s.academicYear.activeYear);
    const { timeSlots, entries, loading } = useSelector(s => s.timetable);
    const [masters, setMasters] = useState({ classes: [], sections: [], teachers: [] });
    const [filters, setFilters] = useState({});
    const schoolId = schoolIdFromUser(user);
    const academicYearId = selectedAcademicYear?._id;
    useEffect(() => {
        if (!schoolId || !academicYearId) return;
        dispatch(fetchTimeSlots({ schoolId, academicYearId }));
        dispatch(fetchRooms({ schoolId }));
        Promise.all([apiClient.get("/school-class/class-detailes",
            {
                params: { schoolId, academicYearId }
            }),
        apiClient.get("/sections", {
            params: { schoolId, academicYearId }
        }),
        apiClient.get("/user/all", {
            params: { schoolId, roleName: "Teacher", isActive: true }
        })]).then(([c, s, t]) => setMasters({ classes: c.data?.data || [], sections: s.data?.data || [], teachers: t.data?.data || [] }))
            .catch(e => message.error(e.response?.data?.message || e.message));
    }, [dispatch, schoolId, academicYearId, message]);

    useEffect(() => {
        if (schoolId && academicYearId)
            dispatch(fetchTimetable({ schoolId, academicYearId, ...filters }));
    }, [dispatch, schoolId, academicYearId, filters]);

    const workload = useMemo(() => entries.reduce((m, e) => { const k = getId(e.teacherId); if (k) m[k] = (m[k] || 0) + 1; return m; }, {}), [entries]);
    const conflicts = 0;
    const sections = masters.sections.filter(s => !filters.schoolClassId || getId(s.schoolClassId) === filters.schoolClassId);
    return <Space direction="vertical" className="w-full" size="large">
        <Card>
            <Typography.Title level={3}>Timetable Overview</Typography.Title>
            <Typography.Text type="secondary">View class, section, and teacher schedules with conflict and workload summaries.</Typography.Text>
        </Card>
        <Row gutter={[16, 16]}><Col xs={24} md={8}>
            <Card>
                <Statistic title="Scheduled Periods" value={entries.length} />
            </Card>
        </Col>
            <Col xs={24} md={8}>
                <Card>
                    <Statistic title="Conflicts" value={conflicts} />
                </Card>
            </Col>
            <Col xs={24} md={8}><Card>
                <Statistic title="Teachers Scheduled" value={Object.keys(workload).length} />
            </Card>
            </Col>
        </Row>
        <Card>
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Select allowClear className="w-full" placeholder="Class"
                        onChange={v => setFilters({ schoolClassId: v, sectionId: undefined })}
                        options={masters.classes.map(c => ({ value: c._id, label: getName(c) }))} />
                </Col>
                <Col xs={24} md={8}>
                    <Select allowClear
                        className="w-full"
                        placeholder="Section"
                        value={filters.sectionId}
                        onChange={v => setFilters(f => ({ ...f, sectionId: v }))}
                        options={sections.map(s => ({ value: s._id, label: getName(s) }))} />
                </Col>
                <Col xs={24} md={8}>
                    <Select allowClear
                        className="w-full"
                        placeholder="Teacher"
                        onChange={v => setFilters(f => ({ ...f, teacherId: v }))}
                        options={masters.teachers.map(t => ({ value: t._id, label: getName(t) }))}
                    />
                </Col>
            </Row>
        </Card>
        <Card>{!academicYearId ?
            <Empty description="Select academic year" /> : loading ? <Skeleton active /> : <TimetableGrid timeSlots={timeSlots} entries={entries} readOnly />}
            </Card>
            </Space>;
}
