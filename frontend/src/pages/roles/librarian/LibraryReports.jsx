import React, { useEffect, useMemo } from "react";
import { Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchIssuedBooks, fetchLibraryBooks } from "../../../features/librarySlice";

const { Title, Text } = Typography;

const LibraryReports = () => {
  const dispatch = useDispatch();
  const { books = [], issuedBooks = [], booksLoading, issuedLoading } = useSelector(
    (state) => state.library || {}
  );

  useEffect(() => {
    dispatch(fetchLibraryBooks());
    dispatch(fetchIssuedBooks());
  }, [dispatch]);

  const summary = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((sum, book) => sum + Number(book?.totalCopies || 0), 0);
    const availableCopies = books.reduce(
      (sum, book) => sum + Number(book?.availableCopies || 0),
      0
    );

    const issuedActive = issuedBooks.filter(
      (book) => String(book?.status || "").toLowerCase() === "issued"
    ).length;

    return {
      totalTitles,
      totalCopies,
      availableCopies,
      issuedActive,
      utilization: totalCopies > 0 ? Math.round(((totalCopies - availableCopies) / totalCopies) * 100) : 0,
    };
  }, [books, issuedBooks]);

  const topIssued = useMemo(() => {
    const counts = issuedBooks.reduce((acc, issue) => {
      const title = issue?.bookId?.title || "Unknown";
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([title, count]) => ({ key: title, title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [issuedBooks]);

  return (
    <Card>
      <Title level={4} style={{ marginBottom: 4 }}>
        Library Reports
      </Title>
      <Text type="secondary">Quick utilization and circulation summary.</Text>

      <Row gutter={16} style={{ margin: "16px 0" }}>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Book Titles" value={summary.totalTitles} loading={booksLoading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Total Copies" value={summary.totalCopies} loading={booksLoading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Available Copies" value={summary.availableCopies} loading={booksLoading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic title="Currently Issued" value={summary.issuedActive} loading={issuedLoading} />
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Text strong>Utilization</Text>
        <Progress percent={summary.utilization} status="active" />
      </Card>

      <Table
        columns={[
          { title: "Book", dataIndex: "title" },
          {
            title: "Times Issued",
            dataIndex: "count",
            render: (count) => <Tag color="blue">{count}</Tag>,
          },
        ]}
        dataSource={topIssued}
        pagination={false}
        loading={issuedLoading}
        locale={{ emptyText: "No issue records available" }}
      />
    </Card>
  );
};

export default LibraryReports;
