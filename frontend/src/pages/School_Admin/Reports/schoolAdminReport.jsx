import React, { useEffect,useState } from "react";
import {
  Alert,
  Card,
  Col,
  Empty,
  Layout,
  Row,
  Select,
  Spin,
  Statistic,
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
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllAcademicYears, fetchActiveAcademicYear } from "../../../features/academicYearSlice";
import { fetchSchoolReports } from "../../../features/reportSlice";


const { Content } = Layout;
const { Title, Text } = Typography;

const SchoolAdminReport = () => {
  const dispatch = useDispatch();

  const { schoolReports, loading, error } = useSelector((state) => state.reports || {});
  const { academicYears = [], activeYear } = useSelector((state) => state.academicYear || {});
  const {user} = useSelector((state) => state.auth) || {};
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState();
  const [accessError, setAccessError] = useState("");

  

  const roleName = user?.role?.name || "";
  const schoolId = user?.school?._id;
  const isSchoolAdmin = roleName === "School Admin";

  useEffect(() => {
    if (!user) {
      setAccessError("User session not found. Please login again.");
      return;
    }

    if (!isSchoolAdmin) {
      setAccessError("This reports page is only available for School Admin users.");
      return;
    }

    if (!schoolId) {
      setAccessError("School is not mapped to this account.");
      return;
    }

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

  const roleWiseRows = (schoolReports?.roleWise || []).map((row, index) => ({
    key: `${row._id}-${index}`,
    role: row._id,
    count: row.count,
  }));

  const classWiseRows = (schoolReports?.classWise || []).map((row, index) => ({
    key: `${row._id}-${index}`,
    className: row._id,
    count: row.count,
  }));

  const sectionWiseRows = (schoolReports?.sectionWise || []).map((row, index) => ({
    key: `${row._id}-${index}`,
    sectionName: row._id,
    count: row.count,
  }));

  const genderStats = schoolReports?.genderStats || [];

  return (
    <Layout style={{ background: "#f5f7fb", minHeight: "100vh", padding: 20 }}>
      <Content>
        <div style={{ marginBottom: 16 }}>
          <Title level={3} style={{ marginBottom: 0 }}>School Admin Reports</Title>
          <Text type="secondary">
            Dynamic school-level analytics for admissions and users.
          </Text>
        </div>

        {accessError && (
          <Alert
            type="warning"
            message={accessError}
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {!accessError && (
          <Card style={{ marginBottom: 16, borderRadius: 12 }}>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={12}>
                <Text strong>Academic Year</Text>
                <Select
                  value={selectedAcademicYearId}
                  onChange={setSelectedAcademicYearId}
                  placeholder="Select academic year"
                  style={{ width: "100%", marginTop: 8 }}
                  options={academicYears.map((year) => ({
                    label: `${year.name}${year.isActive ? " (Active)" : ""}`,
                    value: year._id,
                  }))}
                />
              </Col>
              <Col xs={24} md={12}>
                <Text type="secondary">
                  Showing report for: <Tag color="blue">{schoolReports?.academicYear || "--"}</Tag>
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        {!accessError && loading && (
          <div style={{ textAlign: "center", marginTop: 80 }}>
            <Spin size="large" />
          </div>
        )}

        {!accessError && !loading && error && (
          <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />
        )}

        {!accessError && !loading && !error && !schoolReports?.academicYear && (
          <Empty description="No report data available for selected year" />
        )}

        {!accessError && !loading && !error && schoolReports?.academicYear && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} style={{ borderRadius: 12 }}>
                  <Statistic title="School Admins" prefix={<BankOutlined />} value={summary.adminCount || 0} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} style={{ borderRadius: 12 }}>
                  <Statistic title="Teachers" prefix={<SolutionOutlined />} value={summary.teacherCount || 0} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} style={{ borderRadius: 12 }}>
                  <Statistic title="Students" prefix={<TeamOutlined />} value={summary.studentCount || 0} />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card bordered={false} style={{ borderRadius: 12 }}>
                  <Statistic title="Parents" prefix={<UserOutlined />} value={summary.parentCount || 0} />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={12}>
                <Card title="Role Distribution" extra={<PieChartOutlined />} style={{ borderRadius: 12 }}>
                  <Table
                    size="small"
                    dataSource={roleWiseRows}
                    pagination={false}
                    columns={[
                      { title: "Role", dataIndex: "role", key: "role" },
                      { title: "Users", dataIndex: "count", key: "count", align: "right" },
                    ]}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card title="Gender Distribution" extra={<PieChartOutlined />} style={{ borderRadius: 12 }}>
                  <Table
                    size="small"
                    dataSource={genderStats.map((item, index) => ({
                      key: `${item._id}-${index}`,
                      gender: item._id || "Unknown",
                      count: item.count || 0,
                    }))}
                    pagination={false}
                    columns={[
                      { title: "Gender", dataIndex: "gender", key: "gender" },
                      { title: "Students", dataIndex: "count", key: "count", align: "right" },
                    ]}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card title="Class-wise Enrollment" style={{ borderRadius: 12 }}>
                  <Table
                    size="small"
                    dataSource={classWiseRows}
                    pagination={false}
                    columns={[
                      { title: "Class", dataIndex: "className", key: "className" },
                      { title: "Students", dataIndex: "count", key: "count", align: "right" },
                    ]}
                  />
                </Card>
              </Col>
              <Col xs={24} xl={12}>
                <Card title="Section-wise Enrollment" style={{ borderRadius: 12 }}>
                  <Table
                    size="small"
                    dataSource={sectionWiseRows}
                    pagination={false}
                    columns={[
                      { title: "Section", dataIndex: "sectionName", key: "sectionName" },
                      { title: "Students", dataIndex: "count", key: "count", align: "right" },
                    ]}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Content>
    </Layout>
  );
};

export default SchoolAdminReport;