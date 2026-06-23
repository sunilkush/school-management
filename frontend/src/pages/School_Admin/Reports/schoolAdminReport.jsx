import React, { useEffect, useState } from "react";
import {
  Alert,
  Col,
  Empty,
  Flex,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  SolutionOutlined,
  BankOutlined,
  PieChartOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAcademicYears, fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { fetchSchoolReports } from "../../../features/reportSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { pageWrapper, sectionPanel, iconWell, tableHeadCss } from "../../../styles/pageStyles.js";

const { Text } = Typography;

const SchoolAdminReport = () => {
  const dispatch = useDispatch();
  const { schoolReports, loading, error } = useSelector((state) => state.reports || {});
  const { academicYears = [], activeYear } = useSelector((state) => state.academicYear || {});
  const { user } = useSelector((state) => state.auth) || {};
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState();
  const [accessError, setAccessError] = useState("");

  const roleName = user?.role?.name || "";
  const schoolId = user?.school?._id;
  const isSchoolAdmin = roleName === "School Admin";

  useEffect(() => {
    if (!user) { setAccessError("User session not found. Please login again."); return; }
    if (!isSchoolAdmin) { setAccessError("This reports page is only available for School Admin users."); return; }
    if (!schoolId) { setAccessError("School is not mapped to this account."); return; }
    setAccessError("");
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [user, dispatch, isSchoolAdmin, schoolId]);

  useEffect(() => {
    if (!activeYear?._id || selectedAcademicYearId) return;
    setSelectedAcademicYearId(activeYear._id);
  }, [activeYear, selectedAcademicYearId]);

  useEffect(() => {
    if (!isSchoolAdmin || !schoolId || !selectedAcademicYearId) return;
    dispatch(fetchSchoolReports({ schoolId, academicYearId: selectedAcademicYearId }));
  }, [dispatch, isSchoolAdmin, schoolId, selectedAcademicYearId]);

  const summary = schoolReports?.summary || {};

  const roleWiseRows = (schoolReports?.roleWise || []).map((row, i) => ({
    key: `${row._id}-${i}`, role: row._id, count: row.count,
  }));
  const classWiseRows = (schoolReports?.classWise || []).map((row, i) => ({
    key: `${row._id}-${i}`, className: row._id, count: row.count,
  }));
  const sectionWiseRows = (schoolReports?.sectionWise || []).map((row, i) => ({
    key: `${row._id}-${i}`, sectionName: row._id, count: row.count,
  }));
  const genderStats = schoolReports?.genderStats || [];

  const statCards = [
    { title: "School Admins", value: summary.adminCount || 0, color: "#7C3AED", icon: <BankOutlined /> },
    { title: "Teachers", value: summary.teacherCount || 0, color: "#2563EB", icon: <SolutionOutlined /> },
    { title: "Students", value: summary.studentCount || 0, color: "#10B981", icon: <TeamOutlined /> },
    { title: "Parents", value: summary.parentCount || 0, color: "#F59E0B", icon: <UserOutlined /> },
  ];

  const hasData = !accessError && !loading && !error && schoolReports?.academicYear;

  return (
    <>
      <style>{tableHeadCss("reports-tbl")}</style>
      <PageHeader
        title="School Reports"
        subtitle="Dynamic school-level analytics for admissions and users."
        icon={<BarChartOutlined />}
        extra={
          !accessError && (
            <Flex align="center" gap={8}>
              <Text type="secondary" style={{ fontSize: 13 }}>Academic Year:</Text>
              <Select
                value={selectedAcademicYearId}
                onChange={setSelectedAcademicYearId}
                placeholder="Select year"
                style={{ width: 200 }}
                options={academicYears.map((year) => ({
                  label: `${year.name}${year.isActive ? " (Active)" : ""}`,
                  value: year._id,
                }))}
              />
              {schoolReports?.academicYear && (
                <Tag color="blue" style={{ borderRadius: 99 }}>{schoolReports.academicYear}</Tag>
              )}
            </Flex>
          )
        }
      />

      <div style={pageWrapper}>
        {accessError && (
          <Alert type="warning" message={accessError} showIcon style={{ borderRadius: 12, marginBottom: 20 }} />
        )}

        {!accessError && loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        )}

        {!accessError && !loading && error && (
          <Alert type="error" message={error} showIcon style={{ borderRadius: 12, marginBottom: 20 }} />
        )}

        {!accessError && !loading && !error && !schoolReports?.academicYear && (
          <div style={{ ...sectionPanel, textAlign: "center", padding: "56px 24px" }}>
            <Empty description="No report data available for the selected year" />
          </div>
        )}

        {hasData && (
          <>
            {/* Summary Stat Cards */}
            <Row gutter={[14, 14]} style={{ marginBottom: 20 }}>
              {statCards.map((s) => (
                <Col xs={12} sm={6} key={s.title}>
                  <div style={{
                    background: "var(--surface)",
                    borderRadius: 14,
                    border: "1px solid var(--border-muted)",
                    borderTop: `4px solid ${s.color}`,
                    padding: "16px 20px",
                  }}>
                    <Flex align="center" gap={12}>
                      <div style={iconWell(s.color, 44)}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
                          {s.value}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>
                          {s.title}
                        </div>
                      </div>
                    </Flex>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Distribution Tables */}
            <Row gutter={[14, 14]}>
              <Col xs={24} xl={12}>
                <div style={sectionPanel}>
                  <Flex align="center" gap={10} style={{ marginBottom: 14 }}>
                    <div style={iconWell("#7C3AED", 34)}>
                      <PieChartOutlined style={{ fontSize: 15 }} />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Role Distribution</Text>
                  </Flex>
                  <Table
                    className="reports-tbl"
                    size="small"
                    dataSource={roleWiseRows}
                    pagination={false}
                    columns={[
                      {
                        title: "Role", dataIndex: "role", key: "role",
                        render: (v) => <Tag color="geekblue" style={{ borderRadius: 99 }}>{v}</Tag>,
                      },
                      {
                        title: "Users", dataIndex: "count", key: "count", align: "right",
                        render: (v) => <Text strong style={{ color: "var(--text-primary)" }}>{v}</Text>,
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={24} xl={12}>
                <div style={sectionPanel}>
                  <Flex align="center" gap={10} style={{ marginBottom: 14 }}>
                    <div style={iconWell("#2563EB", 34)}>
                      <PieChartOutlined style={{ fontSize: 15 }} />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Gender Distribution</Text>
                  </Flex>
                  <Table
                    className="reports-tbl"
                    size="small"
                    dataSource={genderStats.map((item, i) => ({
                      key: `${item._id}-${i}`,
                      gender: item._id || "Unknown",
                      count: item.count || 0,
                    }))}
                    pagination={false}
                    columns={[
                      {
                        title: "Gender", dataIndex: "gender", key: "gender",
                        render: (v) => (
                          <Tag
                            color={v === "Male" ? "blue" : v === "Female" ? "pink" : "default"}
                            style={{ borderRadius: 99 }}
                          >
                            {v}
                          </Tag>
                        ),
                      },
                      {
                        title: "Students", dataIndex: "count", key: "count", align: "right",
                        render: (v) => <Text strong style={{ color: "var(--text-primary)" }}>{v}</Text>,
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={24} xl={12}>
                <div style={sectionPanel}>
                  <Flex align="center" gap={10} style={{ marginBottom: 14 }}>
                    <div style={iconWell("#10B981", 34)}>
                      <BarChartOutlined style={{ fontSize: 15 }} />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Class-wise Enrollment</Text>
                  </Flex>
                  <Table
                    className="reports-tbl"
                    size="small"
                    dataSource={classWiseRows}
                    pagination={false}
                    columns={[
                      {
                        title: "Class", dataIndex: "className", key: "className",
                        render: (v) => <Text strong>{v}</Text>,
                      },
                      {
                        title: "Students", dataIndex: "count", key: "count", align: "right",
                        render: (v) => <Text strong style={{ color: "#10B981" }}>{v}</Text>,
                      },
                    ]}
                  />
                </div>
              </Col>

              <Col xs={24} xl={12}>
                <div style={sectionPanel}>
                  <Flex align="center" gap={10} style={{ marginBottom: 14 }}>
                    <div style={iconWell("#F59E0B", 34)}>
                      <BarChartOutlined style={{ fontSize: 15 }} />
                    </div>
                    <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>Section-wise Enrollment</Text>
                  </Flex>
                  <Table
                    className="reports-tbl"
                    size="small"
                    dataSource={sectionWiseRows}
                    pagination={false}
                    columns={[
                      {
                        title: "Section", dataIndex: "sectionName", key: "sectionName",
                        render: (v) => <Text strong>{v}</Text>,
                      },
                      {
                        title: "Students", dataIndex: "count", key: "count", align: "right",
                        render: (v) => <Text strong style={{ color: "#F59E0B" }}>{v}</Text>,
                      },
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </>
        )}
      </div>
    </>
  );
};

export default SchoolAdminReport;
