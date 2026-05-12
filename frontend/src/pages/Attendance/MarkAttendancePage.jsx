import React, { useMemo } from "react";
import { Button, Card, DatePicker, Input, Row, Col, Select, message } from "antd";
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

  return (
    <Card title="Bulk Mark Attendance">
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={5}>
          <Input
            placeholder="School ID"
            value={filters.schoolId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ schoolId: e.target.value || null }))}
          />
        </Col>
        <Col xs={24} md={4}>
          <Input
            placeholder="Class ID"
            value={filters.classId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ classId: e.target.value || null }))}
          />
        </Col>
        <Col xs={24} md={4}>
          <Input
            placeholder="Section ID"
            value={filters.sectionId || ""}
            onChange={(e) => dispatch(setAttendanceFilters({ sectionId: e.target.value || null }))}
          />
        </Col>
        <Col xs={24} md={4}>
          <DatePicker
            style={{ width: "100%" }}
            value={filters.date ? dayjs(filters.date) : dayjs()}
            onChange={(value) => dispatch(setAttendanceFilters({ date: value?.toISOString() || null }))}
          />
        </Col>
        <Col xs={24} md={4}>
          <Select
            style={{ width: "100%" }}
            value={filters.role || "student"}
            options={ATTENDANCE_ROLE_OPTIONS}
            onChange={(value) => dispatch(setAttendanceFilters({ role: value }))}
          />
        </Col>
        <Col xs={24} md={3}>
          <Button onClick={handleLoad} block>
            Load
          </Button>
        </Col>
      </Row>

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
