import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Collapse, Empty, Space, Table, Tag, Typography } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { fetchStudentGrades } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pageCard, tableHeadCss, pill } from "../../../styles/pageStyles";

const { Text } = Typography;

const StudentGrades = () => {
  const dispatch = useDispatch();
  const { grades, loading } = useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentGrades());
  }, [dispatch]);

  const subjectColumns = [
    { title: "Subject", dataIndex: "subjectName", key: "subjectName" },
    { title: "Obtained", dataIndex: "obtainedMarks", key: "obtainedMarks" },
    { title: "Total", dataIndex: "totalMarks", key: "totalMarks" },
    {
      title: "Result",
      key: "isPassed",
      render: (_, row) => (
        <span style={pill(row.isPassed ? "#22C55E" : "#EF4444", row.isPassed ? "rgba(220,252,231,0.15)" : "#fff1f2")}>
          {row.isPassed ? "PASS" : "FAIL"}
        </span>
      ),
    },
  ];

  const summary = useMemo(() => {
    if (!grades.length) return null;
    const passCount = grades.filter((grade) => grade.resultStatus === "PASS").length;
    return {
      total: grades.length,
      passCount,
      failCount: grades.length - passCount,
    };
  }, [grades]);

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss("grades-tbl")}</style>
      <PageHeader
        title="My Grades"
        subtitle="View published exam results and subject-wise marks"
        icon={<TrophyOutlined />}
      />
      <div style={{ ...pageCard, margin: "16px 0" }}>
        <div style={{ padding: "16px 20px" }}>
          {summary && (
            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color="blue">Total Exams: {summary.total}</Tag>
              <Tag color="green">Passed: {summary.passCount}</Tag>
              <Tag color="red">Failed: {summary.failCount}</Tag>
            </Space>
          )}

          {!grades.length ? (
            <Empty description="No published grades found" />
          ) : (
            <Collapse
              loading={loading}
              items={grades.map((grade) => ({
                key: grade._id,
                label: `${grade.examId?.title || "Exam"} • ${grade.percentage}% • Grade ${grade.grade}`,
                children: (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Table
                      className="grades-tbl"
                      rowKey={(row) => `${row.subjectId || row.subjectName}`}
                      columns={subjectColumns}
                      dataSource={grade.subjects || []}
                      pagination={false}
                      size="small"
                      scroll={{ x: "max-content" }}
                    />
                    <Text>
                      Status:{" "}
                      <span style={pill(grade.resultStatus === "PASS" ? "#22C55E" : "#EF4444", grade.resultStatus === "PASS" ? "rgba(220,252,231,0.15)" : "#fff1f2")}>
                        {grade.resultStatus}
                      </span>
                    </Text>
                  </Space>
                ),
              }))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentGrades;
