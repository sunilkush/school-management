import React, { useMemo } from "react";
import { Alert, Button, Card, DatePicker, Input, Row, Col, Select, Space, Typography, message } from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import BulkAttendanceTable from "../../components/attendance/BulkAttendanceTable";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";
import {
  fetchAttendance,
  markBulkAttendance,
  setAttendanceFilters,
  setDraftAttendanceStatus,
} from "../../features/attendanceSlice";

const { Text } = Typography;

const MarkAttendancePage = () => {
  const dispatch = useDispatch();
  const { list, draftRecords, loading, filters } = useSelector((state) => state.attendance);

  const rows = useMemo(
    () =>
      list.map((item) => ({
        userId: item.userId?._id || item.userId,
        name: item.userId?.name,
        email: item.userId?.email,
        status: item.status,
      })),
    [list]
  );

  const handleLoad = () => {
    dispatch(fetchAttendance(filters));
  };

  const handleSave = async () => {
    const records = rows.map((row) => ({ userId: row.userId, status: draftRecords[row.userId] || "present" }));
    const payload = {
      schoolId: filters.schoolId,
      classId: filters.classId,
      sectionId: filters.sectionId,
      subjectId: filters.subjectId,
      role: filters.role || "student",
      date: filters.date || new Date().toISOString(),
      records,
    };

    const result = await dispatch(markBulkAttendance(payload));
    if (result.meta.requestStatus === "fulfilled") {
      message.success("Attendance saved");
      dispatch(fetchAttendance(filters));
    } else {
      message.error(result.payload || "Unable to save attendance");
    }
  };

  const setAllStatus = (status) => {
    rows.forEach((row) => dispatch(setDraftAttendanceStatus({ userId: row.userId, status })));
  };

  return (
    <Card title="Mark Attendance" extra={<Text type="secondary">Simple 3-step flow: filter → load users → save</Text>}>
      <Alert
        showIcon
        type="info"
        style={{ marginBottom: 12 }}
        message="Use role and date first. School/Class/Section IDs are optional advanced filters."
      />
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={6}>
          <Select
            style={{ width: "100%" }}
            value={filters.role || "student"}
            options={ATTENDANCE_ROLE_OPTIONS}
            onChange={(value) => dispatch(setAttendanceFilters({ role: value }))}
          />
        </Col>
        <Col xs={24} md={6}>
          <DatePicker
            style={{ width: "100%" }}
            value={filters.date ? dayjs(filters.date) : dayjs()}
            onChange={(value) => dispatch(setAttendanceFilters({ date: value?.toISOString() || null }))}
          />
        </Col>
        <Col xs={24} md={6}>
          <Button onClick={handleLoad} block>
            Load Users
          </Button>
        </Col>
        <Col xs={24} md={6}>
          <Button block onClick={() => dispatch(setAttendanceFilters({ schoolId: null, classId: null, sectionId: null }))}>
            Clear Optional IDs
          </Button>
        </Col>
        <Col xs={24} md={8}>
          <Input
            placeholder="School ID (optional)"
            value={filters.schoolId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ schoolId: e.target.value || null }))}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            placeholder="Class ID (optional)"
            value={filters.classId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ classId: e.target.value || null }))}
          />
        </Col>
        <Col xs={24} md={8}>
          <Input
            placeholder="Section ID (optional)"
            value={filters.sectionId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ sectionId: e.target.value || null }))}
          />
        </Col>
      </Row>

      <Space style={{ marginBottom: 12 }} wrap>
        <Text type="secondary">Quick mark all:</Text>
        <Button size="small" onClick={() => setAllStatus("present")} disabled={!rows.length}>Present</Button>
        <Button size="small" onClick={() => setAllStatus("absent")} disabled={!rows.length}>Absent</Button>
        <Button size="small" onClick={() => setAllStatus("leave")} disabled={!rows.length}>Leave</Button>
      </Space>

      <BulkAttendanceTable
        rows={rows}
        draftMap={draftRecords}
        loading={loading}
        onStatusChange={(userId, status) => dispatch(setDraftAttendanceStatus({ userId, status }))}
      />
      <Button style={{ marginTop: 12 }} type="primary" onClick={handleSave} disabled={!rows.length || loading}>
        Save Attendance
      </Button>
    </Card>
  );
};

export default MarkAttendancePage;
