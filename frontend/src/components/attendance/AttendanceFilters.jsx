import React from "react";
import { Col, DatePicker, Input, Row, Select } from "antd";
import dayjs from "dayjs";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";


const AttendanceFilters = ({
  filters,
  onChange,
  showSearch = true,
  schoolName = "",
  classOptions = [],
  sectionOptions = [],
}) => (
  <Row gutter={[12, 12]}>
    <Col xs={24} md={4}>
      <Input
        placeholder="School"
        value={schoolName || ""}
        disabled
      />
    </Col>
    <Col xs={24} md={4}>
      <Select
        allowClear
        placeholder="Select Class"
        style={{ width: "100%" }}
        value={filters.classId || undefined}
        options={classOptions}
        onChange={(value) => onChange({ classId: value || null, sectionId: null })}
      />
    </Col>
    <Col xs={24} md={4}>
      <Select
        allowClear
        placeholder="Select Section"
        style={{ width: "100%" }}
        value={filters.sectionId || undefined}
        disabled={!filters.classId}
        options={sectionOptions}
        onChange={(value) => onChange({ sectionId: value || null })}
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
