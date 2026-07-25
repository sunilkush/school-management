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
} from "../../../features/academicYearSlice";

import { fetchSchools } from "../../../features/schoolSlice";

import {
  Table,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Drawer,
  message,
  Popconfirm,
  Tooltip,
  Empty,
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
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  pageCard,
  sectionPanel,
  toolbarRow,
  tableHeadCss,
  statGrid,
  statCard,
  statLabel,
  statValue,
} from "../../../styles/pageStyles";

const { Option } = Select;

const StatusTag = ({ record, activeYear }) => {
  if (record.status === "archived")
    return (
      <Tag
        icon={<InboxOutlined />}
        style={{
          background: "var(--surface-soft)",
          color: "var(--text-muted)",
          border: "1px solid var(--border-muted)",
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
          background: "rgba(220,252,231,0.2)",
          color: "#22C55E",
          border: "1px solid rgba(220,252,231,0.5)",
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
        background: "var(--surface-soft)",
        color: "var(--primary)",
        border: "1px solid var(--border-muted)",
        borderRadius: 20,
        fontWeight: 600,
        padding: "2px 10px",
      }}
    >
      Inactive
    </Tag>
  );
};

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

  useEffect(() => {
    if (user?.role?.name === "Super Admin") dispatch(fetchSchools());
  }, [dispatch, user?.role?.name]);

  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }
  }, [selectedSchoolId, dispatch]);

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
          updateAcademicYear({ id: editId, data: { schoolId: selectedSchoolId, name, startDate, endDate } })
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

  const handleEdit = (record) => {
    setEditId(record._id);
    form.setFieldsValue({
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteAcademicYear(id)).unwrap();
      message.success("Academic year deleted");
    } catch (error) {
      message.error(error || "Failed to delete");
    }
  };

  const handleArchive = async (id) => {
    try {
      await dispatch(archiveAcademicYear(id)).unwrap();
      message.success("Academic year archived");
    } catch (error) {
      message.error(error || "Failed to archive");
    }
  };

  const handleSetActive = async (id) => {
    try {
      await dispatch(setActiveAcademicYear(id)).unwrap();
      message.success("Active year updated");
    } catch (error) {
      message.error(error || "Failed to set active");
    }
  };

  const total = academicYears.length;
  const archivedTotal = academicYears.filter((a) => a.status === "archived").length;
  const inactiveTotal = academicYears.filter(
    (a) => a.status !== "archived" && activeYear?._id !== a._id
  ).length;

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
              background: activeYear?._id === record._id ? "rgba(220,252,231,0.2)" : "var(--surface-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: activeYear?._id === record._id ? "#22C55E" : "var(--primary)",
              fontSize: 16,
            }}
          >
            <CalendarOutlined />
          </div>
          <div>
            <span style={{ fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
              {name}
            </span>
            {activeYear?._id === record._id && (
              <span style={{ fontSize: 11, color: "#22C55E" }}>Currently active</span>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (d) => (
        <span style={{ color: "var(--text-muted)" }}>{dayjs(d).format("DD MMM YYYY")}</span>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (d) => (
        <span style={{ color: "var(--text-muted)" }}>{dayjs(d).format("DD MMM YYYY")}</span>
      ),
    },
    {
      title: "Duration",
      render: (_, record) => {
        const months = dayjs(record.endDate).diff(dayjs(record.startDate), "month");
        return <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{months} months</span>;
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
            {!isActive && record.status !== "archived" && (
              <Tooltip title="Set as active year">
                <Button
                  type="text"
                  size="small"
                  icon={<SafetyCertificateOutlined />}
                  style={{ color: "#22C55E", fontWeight: 600 }}
                  onClick={() => handleSetActive(record._id)}
                >
                  Set Active
                </Button>
              </Tooltip>
            )}
            {record.status !== "archived" && (
              <Tooltip title="Archive this year">
                <Popconfirm
                  title="Archive this academic year?"
                  description="Archived years remain visible but cannot be set active."
                  icon={<ExclamationCircleOutlined style={{ color: "var(--warning)" }} />}
                  onConfirm={() => handleArchive(record._id)}
                  okText="Archive"
                  cancelText="Cancel"
                >
                  <Button type="text" size="small" icon={<InboxOutlined />} style={{ color: "var(--text-muted)", fontWeight: 600 }}>
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
                style={{ color: isActive ? undefined : "var(--primary)", fontWeight: 600 }}
              >
                Edit
              </Button>
            </Tooltip>
            <Popconfirm
              title="Delete Academic Year?"
              description="This action is permanent and cannot be undone."
              icon={<ExclamationCircleOutlined style={{ color: "var(--danger, #ef4444)" }} />}
              onConfirm={() => handleDelete(record._id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
              cancelText="Cancel"
              disabled={isActive}
            >
              <Tooltip title={isActive ? "Cannot delete the active year" : "Delete"}>
                <Button type="text" size="small" icon={<DeleteOutlined />} danger disabled={isActive} style={{ fontWeight: 600 }}>
                  Delete
                </Button>
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("ay-table")}</style>

      <PageHeader
        title="Academic Year Management"
        subtitle="Manage academic sessions, set active years, and archive past records"
        icon={<BookOutlined />}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setDrawerOpen(true)}
            style={{ fontWeight: 600, borderRadius: 10 }}
          >
            New Academic Year
          </Button>
        }
      />

      {activeYear && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleFilled style={{ color: "#22C55E" }} />}
          message={
            <span>
              Active Year: <strong style={{ color: "#22C55E" }}>{activeYear.name}</strong>
              {"  "}
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {dayjs(activeYear.startDate).format("DD MMM YYYY")} → {dayjs(activeYear.endDate).format("DD MMM YYYY")}
              </span>
            </span>
          }
          style={{ borderRadius: 12, marginBottom: 20, background: "rgba(220,252,231,0.2)", border: "1.5px solid rgba(220,252,231,0.5)" }}
        />
      )}

      <div className="stat-grid" style={statGrid(180)}>
        <div style={statCard({ color: "var(--primary)" })}>
          <div>
            <div style={statLabel("var(--primary)")}>Total Years</div>
            <div style={statValue("var(--primary)")}>{total}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{inactiveTotal} inactive</div>
          </div>
          <CalendarOutlined style={{ fontSize: 26, color: "var(--primary)", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#22C55E" })}>
          <div>
            <div style={statLabel("#22C55E")}>Active Year</div>
            <div style={{ ...statValue("#22C55E"), fontSize: 18 }}>{activeYear?.name || "—"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{activeYear ? "Currently running" : "None set"}</div>
          </div>
          <CheckCircleFilled style={{ fontSize: 26, color: "#22C55E", opacity: 0.4 }} />
        </div>
        <div style={statCard({ color: "#F59E0B" })}>
          <div>
            <div style={statLabel("#F59E0B")}>Archived</div>
            <div style={statValue("#F59E0B")}>{archivedTotal}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Historical records</div>
          </div>
          <InboxOutlined style={{ fontSize: 26, color: "#F59E0B", opacity: 0.4 }} />
        </div>
      </div>

      <div className="page-toolbar" style={{ ...toolbarRow, marginBottom: 16 }}>
        {user?.role?.name === "Super Admin" && (
          <Select
            placeholder="Filter by School"
            style={{ width: 240 }}
            value={selectedSchoolId || undefined}
            onChange={setSelectedSchoolId}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {schools.map((s) => (
              <Option key={s._id} value={s._id}>{s.name}</Option>
            ))}
          </Select>
        )}
        <Tooltip title="Refresh data">
          <Button
            icon={<ReloadOutlined />}
            onClick={() => selectedSchoolId && dispatch(fetchAllAcademicYears(selectedSchoolId))}
          >
            Refresh
          </Button>
        </Tooltip>
      </div>

      <div style={pageCard}>
        {!selectedSchoolId && user?.role?.name === "Super Admin" ? (
          <div style={{ padding: "60px 20px" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a school to view academic years" />
          </div>
        ) : (
          <Table
            className="ay-table"
            columns={columns}
            dataSource={academicYears}
            rowKey="_id"
            loading={loading}
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (t) => `${t} academic year${t !== 1 ? "s" : ""}`,
              style: { padding: "12px 20px" },
            }}
            locale={{
              emptyText: (
                <div style={{ padding: "48px 20px" }}>
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No academic years found. Create one to get started." />
                </div>
              ),
            }}
            onRow={(record) => ({
              style: { background: activeYear?._id === record._id ? "#F0FDF4" : undefined, transition: "background 0.15s" },
            })}
          />
        )}
      </div>

      <Drawer
        title={
          <Space>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--primary-light, #e0e7ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              {editId ? <EditOutlined /> : <PlusOutlined />}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                {editId ? "Edit Academic Year" : "Create Academic Year"}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
                {editId ? "Update the date range for this year" : "Define a new academic session by selecting a date range"}
              </div>
            </div>
          </Space>
        }
        width={400}
        open={drawerOpen}
        onClose={closeDrawer}
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={closeDrawer}>Cancel</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit} style={{ fontWeight: 600 }}>
              {editId ? "Update Year" : "Create Year"}
            </Button>
          </Space>
        }
        styles={{ body: { padding: "28px 24px" }, footer: { padding: "14px 24px", borderTop: "1px solid var(--border-muted)" } }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            name="dateRange"
            label={<span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Academic Year Period</span>}
            rules={[
              { required: true, message: "Please select the start and end dates" },
              () => ({
                validator(_, value) {
                  if (!value || !value[0] || !value[1]) return Promise.resolve();
                  if (dayjs(value[1]).isBefore(dayjs(value[0]))) {
                    return Promise.reject(new Error("End date must be after start date"));
                  }
                  if (dayjs(value[0]).isSame(dayjs(value[1]), "year")) {
                    return Promise.reject(new Error("Start and end must span different years"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker.RangePicker style={{ width: "100%" }} placeholder={["Start Date", "End Date"]} format="DD MMM YYYY" size="large" />
          </Form.Item>

          <div style={{ background: "var(--surface-soft)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border-muted)" }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 700, marginBottom: 8 }}>
              Preview
            </div>
            <Form.Item noStyle shouldUpdate>
              {({ getFieldValue }) => {
                const dr = getFieldValue("dateRange");
                if (!dr?.[0] || !dr?.[1])
                  return <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Select dates to preview year name</span>;
                const name = generateYearName(dr[0], dr[1]);
                const months = dayjs(dr[1]).diff(dayjs(dr[0]), "month");
                return (
                  <Space direction="vertical" size={4}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>{name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                      {months} months · {dayjs(dr[0]).format("DD MMM YYYY")} → {dayjs(dr[1]).format("DD MMM YYYY")}
                    </span>
                  </Space>
                );
              }}
            </Form.Item>
          </div>
        </Form>
      </Drawer>
    </div>
  );
};

export default AcademicYearPage;
