import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  createAcademicYear,
  archiveAcademicYear,
  deleteAcademicYear,
  updateAcademicYear,
} from "../../../../features/academicYearSlice";

import { fetchSchools } from "../../../../features/schoolSlice";

import {
  Table,
  Select,
  DatePicker,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Drawer,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm,
  Divider,
  Tooltip,
  Badge,
  Empty,
  Skeleton,
  Alert,
  Form,
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined,
  CalendarOutlined,
  BookOutlined,
  InboxOutlined,
  CheckCircleFilled,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

/* ─────────────────────────────────────────────
   STYLE TOKENS (inline, no extra CSS file)
───────────────────────────────────────────── */
const token = {
  primary: "#4361EE",
  success: "#2EC4B6",
  warning: "#FF9F1C",
  danger: "#E63946",
  surface: "#F8F9FE",
  border: "#E8EAF6",
  textPrimary: "#1A1D2E",
  textSecondary: "#6B7280",
  cardRadius: 16,
  shadow: "0 2px 16px 0 rgba(67,97,238,0.07)",
  shadowHover: "0 8px 32px 0 rgba(67,97,238,0.14)",
};

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
const StatCard = ({ icon, title, value, color, subtitle }) => (
  <Card
    style={{
      borderRadius: token.cardRadius,
      border: `1.5px solid ${token.border}`,
      boxShadow: token.shadow,
      transition: "box-shadow 0.2s, transform 0.2s",
      cursor: "default",
      overflow: "hidden",
      position: "relative",
    }}
    bodyStyle={{ padding: "24px 28px" }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = token.shadowHover;
      e.currentTarget.style.transform = "translateY(-2px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = token.shadow;
      e.currentTarget.style.transform = "translateY(0)";
    }}
  >
    {/* Decorative blob */}
    <div
      style={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: color,
        opacity: 0.08,
      }}
    />
    <Space align="start" size={16}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: token.textSecondary,
            display: "block",
            marginBottom: 4,
          }}
        >
          {title}
        </Text>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: token.textPrimary,
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {subtitle && (
          <Text style={{ fontSize: 12, color: token.textSecondary, marginTop: 4, display: "block" }}>
            {subtitle}
          </Text>
        )}
      </div>
    </Space>
  </Card>
);

/* ─────────────────────────────────────────────
   STATUS TAG
───────────────────────────────────────────── */
const StatusTag = ({ record, activeYear }) => {
  if (record.archived)
    return (
      <Tag
        icon={<InboxOutlined />}
        style={{
          background: "#F3F4F6",
          color: "#6B7280",
          border: "1px solid #E5E7EB",
          borderRadius: 20,
          fontWeight: 600,
          padding: "2px 10px",
        }}
      >
        Archived
      </Tag>
    );
  if (activeYear?._id === record._id)
    return (
      <Tag
        icon={<CheckCircleFilled />}
        style={{
          background: "#ECFDF5",
          color: "#059669",
          border: "1px solid #A7F3D0",
          borderRadius: 20,
          fontWeight: 600,
          padding: "2px 10px",
        }}
      >
        Active
      </Tag>
    );
  return (
    <Tag
      icon={<ClockCircleOutlined />}
      style={{
        background: "#EEF2FF",
        color: token.primary,
        border: `1px solid #C7D2FE`,
        borderRadius: 20,
        fontWeight: 600,
        padding: "2px 10px",
      }}
    >
      Inactive
    </Tag>
  );
};

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const AcademicYearPage = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { schools } = useSelector((state) => state.school);
  const {
    academicYears = [],
    activeYear = null,
    loading,
  } = useSelector((state) => state.academicYear);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form] = Form.useForm();

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    user?.role?.name === "Super Admin" ? "" : user?.school?._id
  );

  /* ── Fetches ── */
  useEffect(() => {
    if (user?.role?.name === "Super Admin") dispatch(fetchSchools());
  }, [dispatch, user?.role?.name]);

  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }
  }, [selectedSchoolId, dispatch]);

  /* ── Helpers ── */
  const generateYearName = (start, end) =>
    `${dayjs(start).year()}-${dayjs(end).year()}`;

  const resetForm = () => {
    setEditId(null);
    form.resetFields();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    resetForm();
  };

  /* ── Create / Update ── */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { dateRange } = values;
      const startDate = dateRange[0];
      const endDate = dateRange[1];

      if (user?.role?.name === "Super Admin" && !selectedSchoolId) {
        message.error("Please select a school first");
        return;
      }

      const name = generateYearName(startDate, endDate);

      if (editId) {
        await dispatch(
          updateAcademicYear({ id: editId, schoolId: selectedSchoolId, name, startDate, endDate })
        ).unwrap();
        message.success("Academic year updated successfully");
      } else {
        await dispatch(
          createAcademicYear({ schoolId: selectedSchoolId, name, startDate, endDate })
        ).unwrap();
        message.success("Academic year created successfully");
      }

      closeDrawer();
    } catch (error) {
      if (error?.message) message.error(error.message);
    }
  };

  /* ── Edit ── */
  const handleEdit = (record) => {
    setEditId(record._id);
    form.setFieldsValue({
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
    });
    setDrawerOpen(true);
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAcademicYear(id)).unwrap();
      message.success("Academic year deleted");
    } catch (error) {
      message.error(error || "Failed to delete");
    }
  };

  /* ── Archive ── */
  const handleArchive = async (id) => {
    try {
      await dispatch(archiveAcademicYear(id)).unwrap();
      message.success("Academic year archived");
    } catch (error) {
      message.error(error || "Failed to archive");
    }
  };

  /* ── Set Active ── */
  const handleSetActive = async (id) => {
    try {
      await dispatch(setActiveAcademicYear(id)).unwrap();
      message.success("Active year updated");
    } catch (error) {
      message.error(error || "Failed to set active");
    }
  };

  /* ── Stats ── */
  const total = academicYears.length;
  const archivedTotal = academicYears.filter((a) => a.archived).length;
  const inactiveTotal = academicYears.filter(
    (a) => !a.archived && activeYear?._id !== a._id
  ).length;

  /* ── Columns ── */
  const columns = [
    {
      title: "Academic Year",
      dataIndex: "name",
      render: (name, record) => (
        <Space>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background:
                activeYear?._id === record._id
                  ? "#ECFDF5"
                  : record.archived
                  ? "#F3F4F6"
                  : "#EEF2FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color:
                activeYear?._id === record._id
                  ? "#059669"
                  : record.archived
                  ? "#9CA3AF"
                  : token.primary,
              fontSize: 16,
            }}
          >
            <CalendarOutlined />
          </div>
          <div>
            <Text strong style={{ color: token.textPrimary, display: "block" }}>
              {name}
            </Text>
            {activeYear?._id === record._id && (
              <Text style={{ fontSize: 11, color: "#059669" }}>
                Currently active
              </Text>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (d) => (
        <Text style={{ color: token.textSecondary }}>
          {dayjs(d).format("DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (d) => (
        <Text style={{ color: token.textSecondary }}>
          {dayjs(d).format("DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "Duration",
      render: (_, record) => {
        const months = dayjs(record.endDate).diff(dayjs(record.startDate), "month");
        return (
          <Text style={{ color: token.textSecondary, fontSize: 13 }}>
            {months} months
          </Text>
        );
      },
    },
    {
      title: "Status",
      render: (_, record) => <StatusTag record={record} activeYear={activeYear} />,
    },
    {
      title: "Actions",
      align: "right",
      render: (_, record) => {
        const isActive = activeYear?._id === record._id;
        return (
          <Space size={4}>
            {!isActive && !record.archived && (
              <Tooltip title="Set as active year">
                <Button
                  type="text"
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                  style={{ color: "#059669", fontWeight: 600 }}
                  onClick={() => handleSetActive(record._id)}
                >
                  Set Active
                </Button>
              </Tooltip>
            )}

            {!record.archived && (
              <Tooltip title="Archive this year">
                <Popconfirm
                  title="Archive this academic year?"
                  description="Archived years remain visible but cannot be set active."
                  icon={<ExclamationCircleOutlined style={{ color: token.warning }} />}
                  onConfirm={() => handleArchive(record._id)}
                  okText="Archive"
                  cancelText="Cancel"
                >
                  <Button
                    type="text"
                    size="small"
                    icon={<InboxOutlined />}
                    style={{ color: token.warning, fontWeight: 600 }}
                  >
                    Archive
                  </Button>
                </Popconfirm>
              </Tooltip>
            )}

            <Tooltip title={isActive ? "Cannot edit the active year" : "Edit"}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                disabled={isActive}
                onClick={() => handleEdit(record)}
                style={{ color: isActive ? undefined : token.primary, fontWeight: 600 }}
              >
                Edit
              </Button>
            </Tooltip>

            <Popconfirm
              title="Delete Academic Year?"
              description="This action is permanent and cannot be undone."
              icon={<ExclamationCircleOutlined style={{ color: token.danger }} />}
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              disabled={isActive}
            >
              <Tooltip title={isActive ? "Cannot delete the active year" : "Delete"}>
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  danger
                  disabled={isActive}
                  style={{ fontWeight: 600 }}
                >
                  Delete
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  /* ── UI ── */
  return (
    <div
      style={{
        background: token.surface,
        minHeight: "100vh",
        padding: "28px 32px",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── PAGE HEADER ── */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 28 }}>
        <div>
          <Space align="center" size={12}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: `${token.primary}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.primary,
                fontSize: 20,
              }}
            >
              <BookOutlined />
            </div>
            <div>
              <Title
                level={4}
                style={{ margin: 0, color: token.textPrimary, fontWeight: 700 }}
              >
                Academic Year Management
              </Title>
              <Text style={{ color: token.textSecondary, fontSize: 13 }}>
                Manage academic sessions, set active years, and archive past records
              </Text>
            </div>
          </Space>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setDrawerOpen(true)}
          style={{
            background: token.primary,
            border: "none",
            borderRadius: 10,
            fontWeight: 600,
            height: 42,
            paddingInline: 20,
            boxShadow: `0 4px 14px ${token.primary}40`,
          }}
        >
          New Academic Year
        </Button>
      </Row>

      {/* ── ACTIVE YEAR ALERT ── */}
      {activeYear && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleFilled style={{ color: "#059669" }} />}
          message={
            <Text strong>
              Active Year:{" "}
              <Text style={{ color: "#059669", fontWeight: 700 }}>
                {activeYear.name}
              </Text>
              {"  "}
              <Text style={{ color: token.textSecondary, fontWeight: 400, fontSize: 13 }}>
                {dayjs(activeYear.startDate).format("DD MMM YYYY")} →{" "}
                {dayjs(activeYear.endDate).format("DD MMM YYYY")}
              </Text>
            </Text>
          }
          style={{
            borderRadius: 12,
            marginBottom: 24,
            background: "#ECFDF5",
            border: "1.5px solid #A7F3D0",
          }}
        />
      )}

      {/* ── STATS ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<CalendarOutlined />}
            title="Total Years"
            value={total}
            color={token.primary}
            subtitle={`${inactiveTotal} inactive`}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<CheckCircleFilled />}
            title="Active Year"
            value={activeYear?.name || "—"}
            color="#059669"
            subtitle={activeYear ? "Currently running" : "None set"}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            icon={<InboxOutlined />}
            title="Archived"
            value={archivedTotal}
            color={token.warning}
            subtitle="Historical records"
          />
        </Col>
      </Row>

      {/* ── FILTER BAR ── */}
      <Card
        style={{
          borderRadius: token.cardRadius,
          border: `1.5px solid ${token.border}`,
          marginBottom: 20,
          boxShadow: "none",
        }}
        bodyStyle={{ padding: "14px 20px" }}
      >
        <Row justify="space-between" align="middle">
          <Space>
            {user?.role?.name === "Super Admin" && (
              <Select
                placeholder="Filter by School"
                style={{ width: 240, borderRadius: 8 }}
                value={selectedSchoolId || undefined}
                onChange={setSelectedSchoolId}
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {schools.map((s) => (
                  <Option key={s._id} value={s._id}>
                    {s.name}
                  </Option>
                ))}
              </Select>
            )}
          </Space>

          <Tooltip title="Refresh data">
            <Button
              icon={<ReloadOutlined />}
              style={{ borderRadius: 8 }}
              onClick={() =>
                selectedSchoolId &&
                dispatch(fetchAllAcademicYears(selectedSchoolId))
              }
            >
              Refresh
            </Button>
          </Tooltip>
        </Row>
      </Card>

      {/* ── TABLE ── */}
      <Card
        style={{
          borderRadius: token.cardRadius,
          border: `1.5px solid ${token.border}`,
          boxShadow: token.shadow,
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        {!selectedSchoolId && user?.role?.name === "Super Admin" ? (
          <div style={{ padding: "60px 20px" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ color: token.textSecondary }}>
                  Select a school to view academic years
                </Text>
              }
            />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={academicYears}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => (
                <Text style={{ color: token.textSecondary }}>
                  {total} academic year{total !== 1 ? "s" : ""}
                </Text>
              ),
              style: { padding: "12px 20px" },
            }}
            locale={{
              emptyText: (
                <div style={{ padding: "48px 20px" }}>
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <Text style={{ color: token.textSecondary }}>
                        No academic years found. Create one to get started.
                      </Text>
                    }
                  />
                </div>
              ),
            }}
            rowClassName={(record) =>
              activeYear?._id === record._id ? "active-row" : ""
            }
            onRow={(record) => ({
              style: {
                background:
                  activeYear?._id === record._id ? "#F0FDF4" : undefined,
                transition: "background 0.15s",
              },
            })}
          />
        )}
      </Card>

      {/* ── DRAWER ── */}
      <Drawer
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${token.primary}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: token.primary,
              }}
            >
              {editId ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: token.textPrimary }}>
                {editId ? "Edit Academic Year" : "Create Academic Year"}
              </div>
              <div style={{ fontSize: 12, color: token.textSecondary, fontWeight: 400 }}>
                {editId
                  ? "Update the date range for this year"
                  : "Define a new academic session by selecting a date range"}
              </div>
            </div>
          </Space>
        }
        width={400}
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={closeDrawer} style={{ borderRadius: 8 }}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleSubmit}
              style={{
                background: token.primary,
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                boxShadow: `0 4px 12px ${token.primary}40`,
              }}
            >
              {editId ? "Update Year" : "Create Year"}
            </Button>
          </Space>
        }
        styles={{
          body: { padding: "28px 24px" },
          footer: {
            padding: "14px 24px",
            borderTop: `1px solid ${token.border}`,
          },
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          {/* School (Super Admin only, inside drawer as info) */}
          {user?.role?.name === "Super Admin" && selectedSchoolId && (
            <Alert
              type="info"
              showIcon={false}
              message={
                <Space>
                  <BookOutlined style={{ color: token.primary }} />
                  <Text style={{ fontSize: 13 }}>
                    School:{" "}
                    <Text strong>
                      {schools.find((s) => s._id === selectedSchoolId)?.name ||
                        "Selected"}
                    </Text>
                  </Text>
                </Space>
              }
              style={{
                borderRadius: 8,
                marginBottom: 20,
                background: "#EEF2FF",
                border: `1px solid #C7D2FE`,
              }}
            />
          )}

          <Form.Item
            name="dateRange"
            label={
              <Text strong style={{ color: token.textPrimary }}>
                Academic Year Period
              </Text>
            }
            rules={[
              { required: true, message: "Please select the start and end dates" },
              () => ({
                validator(_, value) {
                  if (!value || !value[0] || !value[1]) return Promise.resolve();
                  if (dayjs(value[1]).isBefore(dayjs(value[0]))) {
                    return Promise.reject(new Error("End date must be after start date"));
                  }
                  if (dayjs(value[0]).isSame(dayjs(value[1]), "year")) {
                    return Promise.reject(
                      new Error("Start and end must span different years")
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker.RangePicker
              style={{ width: "100%", borderRadius: 8 }}
              placeholder={["Start Date", "End Date"]}
              format="DD MMM YYYY"
              size="large"
            />
          </Form.Item>

          <Divider dashed style={{ margin: "16px 0" }} />

          <div
            style={{
              background: "#F8F9FE",
              borderRadius: 10,
              padding: "14px 16px",
              border: `1px solid ${token.border}`,
            }}
          >
            <Text
              strong
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: token.textSecondary,
                display: "block",
                marginBottom: 8,
              }}
            >
              Preview
            </Text>
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const dr = getFieldValue("dateRange");
                if (!dr?.[0] || !dr?.[1])
                  return (
                    <Text style={{ color: token.textSecondary, fontSize: 13 }}>
                      Select dates to preview year name
                    </Text>
                  );
                const name = generateYearName(dr[0], dr[1]);
                const months = dayjs(dr[1]).diff(dayjs(dr[0]), "month");
                return (
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: 18, color: token.primary }}>
                      {name}
                    </Text>
                    <Text style={{ color: token.textSecondary, fontSize: 13 }}>
                      {months} months · {dayjs(dr[0]).format("DD MMM YYYY")} →{" "}
                      {dayjs(dr[1]).format("DD MMM YYYY")}
                    </Text>
                  </Space>
                );
              }}
            </Form.Item>
          </div>
        </Form>
      </Drawer>

      {/* ── Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .ant-table-thead > tr > th {
          background: #F1F3FA !important;
          color: #6B7280 !important;
          font-weight: 700 !important;
          font-size: 12px !important;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1.5px solid #E8EAF6 !important;
          padding: 12px 16px !important;
        }

        .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid #F1F3F9 !important;
        }

        .ant-table-tbody > tr:hover > td {
          background: #F5F7FF !important;
        }

        .ant-table-pagination {
          padding: 12px 16px !important;
        }

        .ant-btn-primary {
          background: #4361EE !important;
        }

        .ant-drawer-header {
          border-bottom: 1.5px solid #E8EAF6 !important;
          padding: 20px 24px !important;
        }
      `}</style>
    </div>
  );
};

export default AcademicYearPage;