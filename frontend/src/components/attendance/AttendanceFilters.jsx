import React from "react";
import { Col, DatePicker, Input, Row, Select } from "antd";
import dayjs from "dayjs";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";


const AttendanceFilters = ({ filters, onChange, showSearch = true }) => (
  <Row gutter={[12, 12]}>
    <Col xs={24} md={4}>
      <Input
        placeholder="School ID"
        value={filters.schoolId || ""}
        onChange={(e) => onChange({ schoolId: e.target.value || null })}
      />
    </Col>
    <Col xs={24} md={4}>
      <Input
        placeholder="Class ID"
        value={filters.classId || ""}
        onChange={(e) => onChange({ classId: e.target.value || null })}
      />
    </Col>
    <Col xs={24} md={4}>
      <Input
        placeholder="Section ID"
        value={filters.sectionId || ""}
        onChange={(e) => onChange({ sectionId: e.target.value || null })}
      />
    </Col>
    <Col xs={24} md={4}>
      <Select
        allowClear
        placeholder="Role"
        style={{ width: "100%" }}
        value={filters.role || undefined}
        options={ATTENDANCE_ROLE_OPTIONS}
        onChange={(value) => onChange({ role: value || null })}
      />
    </Col>
    <Col xs={24} md={4}>
      <DatePicker
        style={{ width: "100%" }}
        value={filters.date ? dayjs(filters.date) : null}
        onChange={(value) => onChange({ date: value ? value.toISOString() : null })}
      />
    </Col>
    {showSearch && (
      <Col xs={24} md={4}>
        <Input.Search
          placeholder="Search remarks"
          allowClear
          defaultValue={filters.search || ""}
          onSearch={(value) => onChange({ search: value || "" })}
        />
      </Col>
    )}
  </Row>
);

export default AttendanceFilters;
