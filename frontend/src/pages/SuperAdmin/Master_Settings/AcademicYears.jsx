import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  clearAcademicYearMessages,
  createAcademicYear,
  archiveAcademicYear,
} from "../../../features/academicYearSlice";
import { fetchSchools } from "../../../features/schoolSlice";
import { Table, Select, DatePicker, Button, Card, Typography, Space, message as AntMessage, Tag } from "antd";
import dayjs from "dayjs";
import { ReloadOutlined } from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

const AcademicYearPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { schools } = useSelector((state) => state.school);
  const { academicYears = [], activeYear = null, loading = false, error = null, message = null } = useSelector(
    (state) => state.academicYear
  );

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    user?.role?.name === "Super Admin" ? "" : user?.school?._id
  );
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Fetch schools if Super Admin
  useEffect(() => {
    if (user?.role?.name === "Super Admin") {
      dispatch(fetchSchools());
    }
  }, [dispatch, user]);

  // Fetch academic years when school changes
  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }
  }, [dispatch, selectedSchoolId]);

  // Clear messages after 4s
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        dispatch(clearAcademicYearMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  const generateYearName = (start, end) => {
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return `${startYear}-${endYear}`;
  };

  const validateDates = () => {
    if (!startDate || !endDate) return "Start and End dates are required.";
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s >= e) return "Start date must be before end date.";
    for (const y of academicYears) {
      const yStart = new Date(y.startDate);
      const yEnd = new Date(y.endDate);
      if (s <= yEnd && e >= yStart) return "Date range overlaps with an existing academic year.";
    }
    return null;
  };

  const handleCreate = () => {
    const validationError = validateDates();
    if (validationError) {
      AntMessage.error(validationError);
      return;
    }
    const name = generateYearName(startDate, endDate);
    dispatch(
      createAcademicYear({
        schoolId: selectedSchoolId,
        name,
        startDate,
        endDate,
      })
    );
  };

  const handleSwitchActive = (id) => {
    dispatch(setActiveAcademicYear(id));
  };

  const handleArchive = (id) => {
    dispatch(archiveAcademicYear(id));
  };

  // Table Columns
  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Start Date", dataIndex: "startDate", key: "startDate", render: (d) => new Date(d).toLocaleDateString() },
    { title: "End Date", dataIndex: "endDate", key: "endDate", render: (d) => new Date(d).toLocaleDateString() },
    {
      title: "Status",
      key: "status",
      render: (_, record) =>
        record.archived ? (
          <Tag color="gray">Archived</Tag>
        ) : activeYear?._id === record._id ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="blue">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          {!record.archived && activeYear?._id !== record._id && (
            <Button type="link" onClick={() => handleSwitchActive(record._id)}>
              Switch Active
            </Button>
          )}
          {!record.archived && (
            <Button type="link" danger onClick={() => handleArchive(record._id)}>
              Archive
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={<Title level={4}>Academic Years Management</Title>}
        extra={
          <Space>
            {user?.role?.name === "Super Admin" && (
              <Select
                value={selectedSchoolId || undefined}
                onChange={setSelectedSchoolId}
                placeholder="Select School"
                style={{ width: 200 }}
              >
                {schools.map((s) => (
                  <Option key={s._id} value={s._id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            )}
            <Button icon={<ReloadOutlined />} onClick={() => selectedSchoolId && dispatch(fetchAllAcademicYears(selectedSchoolId))}>
              Refresh
            </Button>
          </Space>
        }
      >
        {message && <Text type="success">{message}</Text>}
        {error && <Text type="danger">{error}</Text>}
        <Table
          columns={columns}
          dataSource={academicYears}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 5 }}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Card title="Create New Academic Year" style={{ marginTop: 16, width: "33.3%" }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {user?.role?.name === "Super Admin" && (
            <Select
              value={selectedSchoolId || undefined}
              onChange={setSelectedSchoolId}
              placeholder="Select School"
              style={{ width: "100%" }}
            >
              {schools.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          )}

          <DatePicker
            value={startDate ? dayjs(startDate) : null}
            onChange={(date, dateString) => setStartDate(dateString)}
            placeholder="Start Date"
            style={{ width: "100%" }}
          />
          <DatePicker
            value={endDate ? dayjs(endDate) : null}
            onChange={(date, dateString) => setEndDate(dateString)}
            placeholder="End Date"
            style={{ width: "100%" }}
          />

          <Button type="primary" onClick={handleCreate} loading={loading}>
            Create Academic Year
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default AcademicYearPage;
