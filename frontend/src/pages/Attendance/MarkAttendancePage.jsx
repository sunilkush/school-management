import React, { useEffect, useMemo } from "react";
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
import { fetchSchoolClasses } from "../../features/schoolClassSlice";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";

const { Title, Text } = Typography;

const MarkAttendancePage = () => {
  const dispatch = useDispatch();  
  const { list, draftRecords, loading, filters } = useSelector(
    (s) => s.attendance
  );
  const { user } = useSelector((s) => s.auth || {});
  const { schoolClasses = [] } = useSelector((s) => s.schoolClass || {});
  const {selectedAcademicYear} = useSelector((s) => s.academicYear || {});
  const schoolId = user?.school?._id || null;
  const academicYearId =
    selectedAcademicYear?._id || selectedAcademicYear || null;

  const classes = useMemo(() => {
    if (Array.isArray(schoolClasses)) return schoolClasses;
    if (Array.isArray(schoolClasses?.classes)) return schoolClasses.classes;
    return [];
  }, [schoolClasses]);

  useEffect(() => {
    if (!schoolId) return;

    dispatch(
      setAttendanceFilters({
        schoolId,
      })
    );

    dispatch(fetchSchoolClasses({ schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);
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
      message.error("Server error", e.message);
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
            <Input placeholder="School" value={user?.school?.name || ""} disabled />
          </Col>

          <Col xs={24} md={5}>
            <Select
              className="w-full"
              placeholder="Select Class"
              value={filters.classId || undefined}
              options={classes.map((cls) => ({
                value: cls._id,
                label: cls.name,
              }))}
              onChange={(value) =>
                dispatch(setAttendanceFilters({ classId: value || null, sectionId: null }))
              }
            />
          </Col>

          <Col xs={24} md={5}>
            <Select
              className="w-full"
              placeholder="Select Section"
              value={filters.sectionId || undefined}
              disabled={!filters.classId}
              options={
                classes
                  .find((cls) => cls._id === filters.classId)
                  ?.sections?.map((section) => ({
                    value: section._id,
                    label: section.name,
                  })) || []
              }
              onChange={(value) =>
                dispatch(setAttendanceFilters({ sectionId: value || null }))
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