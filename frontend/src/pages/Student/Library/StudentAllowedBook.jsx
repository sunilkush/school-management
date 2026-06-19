import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Empty, Table } from "antd";
import { ReadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchStudentLibraryBooks } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pageCard, tableHeadCss, pill } from "../../../styles/pageStyles";

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
        <span style={pill(status === "Overdue" ? "#D96B7A" : "#5B9EC9", status === "Overdue" ? "#fff1f2" : "#e0f2fe")}>
          {status}
        </span>
      ),
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("lib-tbl")}</style>
      <PageHeader
        title="My Issued Books"
        subtitle="Books currently borrowed from the school library"
        icon={<ReadOutlined />}
      />
      <div style={{ ...pageCard, marginTop: 16 }}>
        {libraryBooks.length ? (
          <Table
            className="lib-tbl"
            rowKey="_id"
            columns={columns}
            dataSource={libraryBooks}
            loading={loading}
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        ) : (
          <div style={{ padding: 40 }}>
            <Empty description="No books currently issued" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentAllowedBook;
