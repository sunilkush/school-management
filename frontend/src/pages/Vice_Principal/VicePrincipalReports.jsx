import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Row, Col, Select, Statistic, Table, Typography, Tag, Empty } from "antd";
import { fetchAllAcademicYears, fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { fetchSchoolReports } from "../../features/reportSlice";

const { Title, Text } = Typography;

const VicePrincipalReports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { schoolReports, loading } = useSelector((state) => state.reports || {});
  const { academicYears = [], activeYear } = useSelector((state) => state.academicYear || {});

  const schoolId = user?.school?._id;
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState();

  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchAllAcademicYears(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (activeYear?._id && !selectedAcademicYearId) {
      setSelectedAcademicYearId(activeYear._id);
    }
  }, [activeYear, selectedAcademicYearId]);

  useEffect(() => {
    if (!schoolId || !selectedAcademicYearId) return;
    dispatch(fetchSchoolReports({ schoolId, academicYearId: selectedAcademicYearId }));
  }, [dispatch, schoolId, selectedAcademicYearId]);

  const roleWiseRows = useMemo(
    () =>
      (schoolReports?.roleWise || []).map((row, index) => ({
        key: row._id || index,
        role: row._id || "Unknown",
        count: row.count || 0,
      })),
    [schoolReports]
  );

  const classWiseRows = useMemo(
    () =>
      (schoolReports?.classWise || []).map((row, index) => ({
        key: row._id || index,
        className: row._id || "Unknown",
        count: row.count || 0,
      })),
    [schoolReports]
  );

  const summary = schoolReports?.summary || {};

  return (
    <Card loading={loading}>
      <Row justify="space-between" align="middle" gutter={[12, 12]}>
        <Col>
          <Title level={4} style={{ marginBottom: 0 }}>Vice Principal Reports</Title>
          <Text type="secondary">Academic and operational snapshot by year.</Text>
        </Col>
        <Col>
          <Select
            style={{ minWidth: 220 }}
            placeholder="Select Academic Year"
            value={selectedAcademicYearId}
            onChange={setSelectedAcademicYearId}
            options={academicYears.map((year) => ({
              value: year._id,
              label: `${year.name}${activeYear?._id === year._id ? " (Active)" : ""}`,
            }))}
          />
        </Col>
      </Row>

      {!schoolReports?.academicYear ? (
        <Empty description="No report data found for selected academic year" style={{ marginTop: 32 }} />
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={8}><Card><Statistic title="Total Users" value={summary.totalUsers || 0} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="Students" value={summary.totalStudents || 0} /></Card></Col>
            <Col xs={24} md={8}><Card><Statistic title="Teachers" value={summary.totalTeachers || 0} /></Card></Col>
          </Row>

          <Card style={{ marginTop: 16 }} title={<span>Report Year <Tag color="blue">{schoolReports.academicYear}</Tag></span>}>
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={roleWiseRows}
                  columns={[
                    { title: "Role", dataIndex: "role", key: "role" },
                    { title: "Count", dataIndex: "count", key: "count" },
                  ]}
                />
              </Col>
              <Col xs={24} lg={12}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={classWiseRows}
                  columns={[
                    { title: "Class", dataIndex: "className", key: "className" },
                    { title: "Count", dataIndex: "count", key: "count" },
                  ]}
                />
              </Col>
            </Row>
          </Card>
        </>
      )}
    </Card>
  );
};

export default VicePrincipalReports;
