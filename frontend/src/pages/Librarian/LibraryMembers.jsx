import React, { useEffect, useMemo } from "react";
import { Card, Col, Row, Statistic, Table, Tag, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssuedBooks, fetchLibraryStudents } from "../../features/librarySlice";

const { Title, Text } = Typography;

const LibraryMembers = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth || {});
  const { students = [], issuedBooks = [], studentsLoading, issuedLoading } = useSelector(
    (state) => state.library || {}
  );

  const schoolId = user?.school?._id || user?.schoolId;

  useEffect(() => {
    dispatch(fetchIssuedBooks());
    if (schoolId) {
      dispatch(fetchLibraryStudents({ schoolId, limit: 500 }));
    }
  }, [dispatch, schoolId]);

  const issuedCountByStudent = useMemo(() => {
    return issuedBooks.reduce((acc, issue) => {
      const studentId = issue?.studentId?._id || issue?.studentId;
      const isIssued = String(issue?.status || "").toLowerCase() === "issued";
      if (!studentId || !isIssued) return acc;
      acc[studentId] = (acc[studentId] || 0) + 1;
      return acc;
    }, {});
  }, [issuedBooks]);

  const rows = useMemo(() => {
    return students.map((student, index) => {
      const id = student?.studentId || student?.student?._id || student?._id;
      const name =
        student?.userDetails?.name ||
        student?.user?.name ||
        student?.studentName ||
        `Student ${index + 1}`;
      const regNo = student?.registrationNumber || student?.admissionNumber || "-";
      const issued = issuedCountByStudent[id] || 0;

      return {
        key: id || `${name}-${index}`,
        name,
        regNo,
        issued,
        status: issued > 0 ? "Active Borrower" : "No Active Book",
      };
    });
  }, [students, issuedCountByStudent]);

  const activeBorrowers = rows.filter((row) => row.issued > 0).length;

  const columns = [
    { title: "Member Name", dataIndex: "name" },
    { title: "Registration No.", dataIndex: "regNo" },
    {
      title: "Issued Books",
      dataIndex: "issued",
      render: (count) => <Tag color={count > 0 ? "orange" : "default"}>{count}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "Active Borrower" ? <Tag color="green">Active</Tag> : <Tag>No Active Issue</Tag>,
    },
  ];

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 4 }}>
        Library Members
      </Title>
      <Text type="secondary">Students with their current borrowing status.</Text>

      <Row gutter={16} style={{ margin: "16px 0" }}>
        <Col xs={24} sm={12} md={8}>
          <Statistic title="Total Members" value={rows.length} />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Statistic title="Active Borrowers" value={activeBorrowers} />
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={rows}
        rowKey="key"
        loading={studentsLoading || issuedLoading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default LibraryMembers;
