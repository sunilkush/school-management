import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Card,
  Input,
  Button,
  Modal,
  Space,
  Avatar,
  Select,
  Empty,
  Spin,
  Tag,
  Typography,
  Tooltip,
  Badge,
  Statistic,
  Row,
  Col,
  Divider,
  ConfigProvider,
  
} from "antd";
import {
  UserOutlined,
  SearchOutlined,
  DownloadOutlined,
  PlusOutlined,
  TeamOutlined,
  BookOutlined,
  CalendarOutlined,
  FilterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { fetchStudentsBySchoolId } from "../../../features/studentSlice";
import AdmissionForm from "../../../components/forms/AdmissionForm";

const { Option } = Select;
const { Title, Text } = Typography;

/* ──────────────────────────────────────
   STATUS COLOUR MAP
────────────────────────────────────── */
const statusConfig = {
  Active: { color: "success", label: "Active" },
  Inactive: { color: "error", label: "Inactive" },
  Pending: { color: "warning", label: "Pending" },
};

/* ──────────────────────────────────────
   BLOOD GROUP COLOURS
────────────────────────────────────── */
const bloodGroupColor = {
  "A+": "red",
  "A-": "volcano",
  "B+": "orange",
  "B-": "gold",
  "AB+": "blue",
  "AB-": "geekblue",
  "O+": "green",
  "O-": "lime",
};

/* ══════════════════════════════════════
   COMPONENT
══════════════════════════════════════ */
const StudentList = () => {
  const dispatch = useDispatch();

  const { schoolStudents, loading } = useSelector((state) => state.students);
  const { user } = useSelector((state) => state.auth);
  const { selectedAcademicYear } = useSelector((state) => state.academicYear);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const schoolId = user?.school?._id;
  const academicYearId = selectedAcademicYear?._id;
  const isSchoolAdmin = user?.role?.name === "School Admin";

  /* ── Fetch ── */
  useEffect(() => {
    if (!isSchoolAdmin || !schoolId || !academicYearId) return;
    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }));
  }, [dispatch, isSchoolAdmin, schoolId, academicYearId, isModalOpen]);

  /* ── Data ── */
  const studentsArray = useMemo(() => {
    if (Array.isArray(schoolStudents)) return schoolStudents;
    if (schoolStudents?.data) return schoolStudents.data;
    return [];
  }, [schoolStudents]);

  const formattedStudents = useMemo(() =>
    studentsArray.map((stu) => ({
      key: stu._id,
      name: stu.user?.name ?? "N/A",
      email: stu.user?.email ?? "N/A",
      schoolClass: stu.schoolClass?.name ?? "N/A",
      section: stu.section?.name ?? "N/A",
      dateOfBirth: stu.student?.dateOfBirth
        ? new Date(stu.student.dateOfBirth).toISOString().split("T")[0]
        : "N/A",
      mobileNumber: stu.mobileNumber ?? "N/A",
      admissionDate: stu.admissionDate
        ? new Date(stu.admissionDate).toISOString().split("T")[0]
        : "N/A",
      bloodGroup: stu.student?.bloodGroup ?? "N/A",
      schoolName: stu.school?.name ?? "N/A",
      academicYear: stu.academicYear?.name ?? "N/A",
      status: stu.status ?? "Active",
    })),
    [studentsArray]
  );

  /* ── Filters ── */
  const classOptions = useMemo(() => {
    const classes = formattedStudents.map((s) => s.class).filter(Boolean);
    return ["all", ...new Set(classes)];
  }, [formattedStudents]);

  const sectionOptions = useMemo(() => {
    const sections = formattedStudents
      .filter((s) => selectedClass === "all" || s.class === selectedClass)
      .map((s) => s.section)
      .filter(Boolean);
    return ["all", ...new Set(sections)];
  }, [formattedStudents, selectedClass]);

  const filteredStudents = useMemo(() =>
    formattedStudents.filter((stu) => {
      const matchSearch = stu.name.toLowerCase().includes(searchText.toLowerCase()) ||
        stu.email.toLowerCase().includes(searchText.toLowerCase());
      const matchClass = selectedClass === "all" || stu.class === selectedClass;
      const matchSection = selectedSection === "all" || stu.section === selectedSection;
      return matchSearch && matchClass && matchSection;
    }),
    [formattedStudents, searchText, selectedClass, selectedSection]
  );

  /* ── Stats ── */
  const stats = useMemo(() => {
    const active = formattedStudents.filter((s) => s.status === "Active").length;
    const classes = new Set(formattedStudents.map((s) => s.class)).size;
    return { total: formattedStudents.length, active, classes };
  }, [formattedStudents]);

  /* ── Columns ── */
  const columns = [
    {
      title: "Student",
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name, record) => (
        <Space size={10}>
          <Avatar
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`}
            size={36}
            style={{ flexShrink: 0 }}
          />
          <div style={{ lineHeight: 1.3 }}>
            <Text strong style={{ display: "block", fontSize: 13 }}>{name}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Class",
      dataIndex: "schoolClass",
      width: 90,
      render: (cls) => (
        <Tag color="blue" style={{ borderRadius: 20, fontWeight: 600 }}>{cls}</Tag>
      ),
    },
    {
      title: "Section",
      dataIndex: "section",
      width: 90,
      render: (sec) => (
        <Tag color="geekblue" style={{ borderRadius: 20 }}>{sec}</Tag>
      ),
    },
    {
      title: "Blood Group",
      dataIndex: "bloodGroup",
      width: 110,
      render: (bg) =>
        bg !== "N/A" ? (
          <Tag color={bloodGroupColor[bg] ?? "default"} style={{ borderRadius: 20, fontWeight: 700 }}>{bg}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Date of Birth",
      dataIndex: "dateOfBirth",
      width: 120,
      render: (dob) => (
        <Space size={4}>
          <CalendarOutlined style={{ color: "#8c8c8c", fontSize: 12 }} />
          <Text style={{ fontSize: 12 }}>{dob}</Text>
        </Space>
      ),
    },
    {
      title: "Phone",
      dataIndex: "mobileNumber",
      width: 130,
      render: (phone) => <Text style={{ fontSize: 12 }}>{phone}</Text>,
    },
    {
      title: "Admission",
      dataIndex: "admissionDate",
      width: 120,
      render: (date) => <Text style={{ fontSize: 12 }}>{date}</Text>,
    },
    {
      title: "Academic Year",
      dataIndex: "academicYear",
      width: 130,
      render: (year) => (
        <Tag style={{ borderRadius: 20, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
          {year}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (status) => {
        const cfg = statusConfig[status] ?? { color: "default", label: status };
        return <Badge status={cfg.color} text={cfg.label} />;
      },
    },
  ];

  /* ── Guards ── */
  if (!isSchoolAdmin) {
    return (
      <div style={{ padding: 20 }}>
        <Card style={{ borderRadius: 16, textAlign: "center", padding: "40px 0" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                <Text strong style={{ fontSize: 16 }}>Access Restricted</Text>
                <br />
                <Text type="secondary">You don't have permission to view this page.</Text>
              </span>
            }
          />
        </Card>
      </div>
    );
  }

  if (!user) return <Spin size="large" fullscreen />;

  /* ── Render ── */
  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
        },
        components: {
          Table: { borderRadius: 12 },
          Card: { borderRadius: 16 },
        },
      }}
    >
     

      <div style={{ padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
            Students
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {selectedAcademicYear?.name ?? "Current"} Academic Year ·{" "}
            {user?.school?.name ?? "School"}
          </Text>
        </div>

        {/* ── Stats Row ── */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          {[
            {
              title: "Total Students",
              value: stats.total,
              icon: <TeamOutlined style={{ fontSize: 20, color: "#6366f1" }} />,
              bg: "#f5f3ff",
              color: "#6366f1",
            },
            {
              title: "Active",
              value: stats.active,
              icon: <UserOutlined style={{ fontSize: 20, color: "#16a34a" }} />,
              bg: "#f0fdf4",
              color: "#16a34a",
            },
            {
              title: "Classes",
              value: stats.classes,
              icon: <BookOutlined style={{ fontSize: 20, color: "#0ea5e9" }} />,
              bg: "#f0f9ff",
              color: "#0ea5e9",
            },
            {
              title: "Showing",
              value: filteredStudents.length,
              icon: <FilterOutlined style={{ fontSize: 20, color: "#f59e0b" }} />,
              bg: "#fffbeb",
              color: "#f59e0b",
            },
          ].map((stat) => (
            <Col xs={12} sm={6} key={stat.title}>
              <Card className="stat-card" bodyStyle={{ padding: "16px 20px" }}>
                <Space size={12} align="start">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: stat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      {stat.title}
                    </Text>
                    <div>
                      <Text strong style={{ fontSize: 22, color: "#1e293b", lineHeight: 1.2 }}>
                        {stat.value}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Main Table Card ── */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 16, border: "1.5px solid #e2e8f0", overflow: "hidden" }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #f1f5f9",
              background: "#fff",
            }}
          >
            {/* Left: filters */}
            <Space wrap size={8}>
              <Input
                className="search-input"
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                placeholder="Search by name or email…"
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 220, borderRadius: 8 }}
              />

              <Select
                className="filter-select"
                value={selectedClass}
                onChange={(value) => {
                  setSelectedClass(value);
                  setSelectedSection("all");
                }}
                style={{ width: 145 }}
                placeholder="All Classes"
              >
                {classOptions.map((cls) => (
                  <Option key={cls} value={cls}>
                    {cls === "all" ? "All Classes" : cls}
                  </Option>
                ))}
              </Select>

              <Select
                className="filter-select"
                value={selectedSection}
                onChange={setSelectedSection}
                disabled={selectedClass === "all"}
                style={{ width: 145 }}
                placeholder="All Sections"
              >
                {sectionOptions.map((sec) => (
                  <Option key={sec} value={sec}>
                    {sec === "all" ? "All Sections" : sec}
                  </Option>
                ))}
              </Select>

              <Tooltip title="Refresh data">
                <Button
                  icon={<ReloadOutlined />}
                  style={{ borderRadius: 8, borderColor: "#e2e8f0", color: "#64748b" }}
                  onClick={() =>
                    dispatch(fetchStudentsBySchoolId({ schoolId, academicYearId }))
                  }
                />
              </Tooltip>
            </Space>

            {/* Right: actions */}
            <Space size={8}>
              <Button
                icon={<DownloadOutlined />}
                style={{ borderRadius: 8, borderColor: "#e2e8f0", color: "#475569", fontWeight: 500 }}
              >
                Export
              </Button>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="add-btn"
                onClick={() => setIsModalOpen(true)}
              >
                Add Student
              </Button>
            </Space>
          </div>

          {/* Table */}
          <Table
            className="student-table"
            loading={loading}
            columns={columns}
            dataSource={filteredStudents}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} students`,
              style: { padding: "12px 20px" },
            }}
            scroll={{ x: 1000 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    searchText || selectedClass !== "all"
                      ? "No students match the current filters."
                      : "No students enrolled yet."
                  }
                  style={{ padding: "40px 0" }}
                />
              ),
            }}
            style={{ borderRadius: 0 }}
            size="middle"
          />
        </Card>
      </div>

      {/* ── Modal ── */}
      <Modal
        title={
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#f5f3ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserOutlined style={{ color: "#6366f1", fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                New Student Admission
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
                Fill in the details below
              </div>
            </div>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={820}
        destroyOnClose
        styles={{
          header: { padding: "20px 24px 14px", borderBottom: "1px solid #f1f5f9" },
          body: { padding: "20px 24px 24px" },
        }}
        style={{ borderRadius: 18, overflow: "hidden" }}
      >
        <AdmissionForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </ConfigProvider>
  );
};

export default StudentList;