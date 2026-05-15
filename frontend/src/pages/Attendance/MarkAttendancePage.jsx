import React, { useMemo } from "react";
import {
  Card,
  DatePicker,
  Input,
  Select,
  Button,
  Row,
  Col,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import BulkAttendanceTable from "../../components/attendance/BulkAttendanceTable";

import {
  fetchAttendance,
  markBulkAttendance,
  setAttendanceFilters,
  setDraftAttendanceStatus,
} from "../../features/attendanceSlice";

import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";

const { Title, Text } = Typography;

const MarkAttendancePage = () => {
  const dispatch = useDispatch();

  const { list, draftRecords, loading, filters } = useSelector(
    (s) => s.attendance
  );

  /* ---------------- ROWS ---------------- */
  const rows = useMemo(() => {
    return list.map((item) => ({
      userId: item.userId?._id || item.userId,
      name: item.userId?.name,
      email: item.userId?.email,
      status: item.status,
    }));
  }, [list]);

  /* ---------------- LOAD ---------------- */
  const handleLoad = () => {
    if (!filters.schoolId) {
      return message.warning("Please enter School ID");
    }
    dispatch(fetchAttendance(filters));
  };

  /* ---------------- SAVE ---------------- */
  const handleSave = async () => {
    const records = rows.map((r) => ({
      userId: r.userId,
      status: draftRecords[r.userId] || "present",
    }));

    if (!records.length) return message.warning("No data to save");

    try {
      const res = await dispatch(
        markBulkAttendance({
          ...filters,
          date: filters.date || new Date().toISOString(),
          role: filters.role || "student",
          records,
        })
      );

      if (res.meta.requestStatus === "fulfilled") {
        message.success("Attendance saved successfully");
        dispatch(fetchAttendance(filters));
      } else {
        message.error("Failed to save attendance");
      }
    } catch (e) {
      message.error("Server error");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Bulk Attendance Management
        </Title>
        <Text type="secondary">
          Load users, mark attendance, and save in bulk
        </Text>
      </div>

      {/* FILTER PANEL */}
      <Card className="mb-4">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={5}>
            <Input
              placeholder="School ID"
              value={filters.schoolId || ""}
              onChange={(e) =>
                dispatch(
                  setAttendanceFilters({
                    schoolId: e.target.value || null,
                  })
                )
              }
            />
          </Col>

          <Col xs={24} md={5}>
            <Input
              placeholder="Class ID"
              value={filters.classId || ""}
              onChange={(e) =>
                dispatch(
                  setAttendanceFilters({
                    classId: e.target.value || null,
                  })
                )
              }
            />
          </Col>

          <Col xs={24} md={5}>
            <Input
              placeholder="Section ID"
              value={filters.sectionId || ""}
              onChange={(e) =>
                dispatch(
                  setAttendanceFilters({
                    sectionId: e.target.value || null,
                  })
                )
              }
            />
          </Col>

          <Col xs={24} md={5}>
            <DatePicker
              className="w-full"
              value={filters.date ? dayjs(filters.date) : dayjs()}
              onChange={(v) =>
                dispatch(
                  setAttendanceFilters({
                    date: v?.toISOString() || null,
                  })
                )
              }
            />
          </Col>

          <Col xs={24} md={4}>
            <Select
              className="w-full"
              value={filters.role || "student"}
              options={ATTENDANCE_ROLE_OPTIONS}
              onChange={(v) =>
                dispatch(setAttendanceFilters({ role: v }))
              }
            />
          </Col>

          <Col xs={24}>
            <div className="flex justify-end">
              <Button type="primary" onClick={handleLoad} loading={loading}>
                Load Data
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* TABLE SECTION */}
      <Card className="mb-4">
        <BulkAttendanceTable
          rows={rows}
          draftMap={draftRecords}
          loading={loading}
          onStatusChange={(userId, status) =>
            dispatch(setDraftAttendanceStatus({ userId, status }))
          }
        />
      </Card>

      {/* ACTION FOOTER */}
      <Card>
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <Text type="secondary">
            {rows.length} records loaded
          </Text>

          <Button
            type="primary"
            size="large"
            onClick={handleSave}
            disabled={!rows.length || loading}
          >
            Save Attendance
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MarkAttendancePage;