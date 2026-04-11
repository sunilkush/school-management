import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Empty, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { fetchStudentLibraryBooks } from "../../../features/studentPortalSlice";

const { Title } = Typography;

const StudentAllowedBook = () => {
  const dispatch = useDispatch();
  const { libraryBooks, loading } = useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentLibraryBooks());
  }, [dispatch]);

  const columns = [
    { title: "Book", render: (_, row) => row.bookId?.title || "-" },
    { title: "Author", render: (_, row) => row.bookId?.author || "-" },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={status === "Overdue" ? "red" : "blue"}>{status}</Tag>
      ),
    },
  ];

  return (
    <Card loading={loading}>
      <Title level={4}>My Issued Books</Title>
      {libraryBooks.length ? (
        <Table rowKey="_id" columns={columns} dataSource={libraryBooks} pagination={false} />
      ) : (
        <Empty description="No books currently issued" />
      )}
    </Card>
  );
};

export default StudentAllowedBook;
