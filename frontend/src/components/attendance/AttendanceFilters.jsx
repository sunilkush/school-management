import React from "react";
import { Button, Col, DatePicker, Input, Row, Select, Space } from "antd";
import dayjs from "dayjs";
import { ATTENDANCE_ROLE_OPTIONS } from "../../utils/attendanceRoles";


const AttendanceFilters = ({ filters, onChange, showSearch = true }) => (
  <Space direction="vertical" size={10} style={{ width: "100%" }}>
    <Row gutter={[12, 12]}>
      <Col xs={24} md={6}>
        <Select
          allowClear
          placeholder="Select role"
          style={{ width: "100%" }}
          value={filters.role || undefined}
          options={ATTENDANCE_ROLE_OPTIONS}
          onChange={(value) => onChange({ role: value || null })}
        />
      </Col>
      <Col xs={24} md={6}>
        <DatePicker
          style={{ width: "100%" }}
          placeholder="Choose date"
          value={filters.date ? dayjs(filters.date) : null}
          onChange={(value) => onChange({ date: value ? value.toISOString() : null })}
        />
      </Col>
      {showSearch && (
        <Col xs={24} md={8}>
          <Input.Search
            placeholder="Search by remarks"
            allowClear
            defaultValue={filters.search || ""}
            onSearch={(value) => onChange({ search: value || "" })}
          />
        </Col>
      )}
      <Col xs={24} md={4}>
        <Button block onClick={() => onChange({ schoolId: null, classId: null, sectionId: null, page: 1 })}>
          Clear IDs
        </Button>
      </Col>
    </Row>

    <Row gutter={[12, 12]}>
      <Col span={24}>
        <span style={{ color: "#8c8c8c", fontSize: 12 }}>Advanced filters (optional)</span>
      </Col>
      <Col xs={24} md={8}>
      <Input
        placeholder="School ID"
        value={filters.schoolId || ""}
        onChange={(e) => onChange({ schoolId: e.target.value || null })}
      />
      </Col>
      <Col xs={24} md={8}>
      <Input
        placeholder="Class ID"
        value={filters.classId || ""}
        onChange={(e) => onChange({ classId: e.target.value || null })}
      />
      </Col>
      <Col xs={24} md={8}>
      <Input
        placeholder="Section ID"
        value={filters.sectionId || ""}
        onChange={(e) => onChange({ sectionId: e.target.value || null })}
      />
      </Col>
    </Row>
  </Space>
);

export default AttendanceFilters;
