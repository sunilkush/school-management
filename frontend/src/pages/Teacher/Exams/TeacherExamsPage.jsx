import React, { useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Card,
  Tag,
  Typography,
  Empty,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getExams } from "../../../features/examSlice.js";
import { useDispatch, useSelector } from "react-redux";

const { Title, Text } = Typography;

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ✅ Redux State */
  const { exams = [], loading } = useSelector((state) => state.exams || {});

  /* ✅ Academic Year + School */
  const storeAcadmicYear = localStorage.getItem("selectedAcademicYear");
  const selectedAcademicYear = storeAcadmicYear
    ? JSON.parse(storeAcadmicYear)
    : null;

  const academicYearId = selectedAcademicYear?._id || null;
  const schoolId = selectedAcademicYear?.schoolId || null;

  /* ✅ Fetch Exams */
  useEffect(() => {
    if (schoolId) {
      dispatch(getExams({ schoolId, academicYearId }));
    }
  }, [schoolId, academicYearId, dispatch]);

  /* ✅ Delete Handler (Frontend Only Example) */
  const handleDelete = () => {
    message.success("Exam deleted");
    // ⭐ If backend delete API hai to dispatch(deleteExam(id))
  };

  /* ✅ Table Columns */
  const columns = [
    {
      title: "Exam Title",
      dataIndex: "title",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Type",
      dataIndex: "examType",
      render: (type) => (
        <Tag color="blue">{type?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Start Time",
      dataIndex: "startTime",
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: "End Time",
      dataIndex: "endTime",
      render: (time) => new Date(time).toLocaleString(),
    },
    {
      title: "Total Marks",
      dataIndex: "totalMarks",
    },
    {
      title: "Passing Marks",
      dataIndex: "passingMarks",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const color =
          status === "published"
            ? "green"
            : status === "completed"
            ? "purple"
            : "orange";
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      align: "center",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/teacher/exams/edit/${record._id}`)
            }
          />
          <Popconfirm
            title="Delete this exam?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card bordered={false} style={{ borderRadius: 12 }}>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          📘 Exams Management
        </Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            navigate("/dashboard/teacher/exams/create-exam")
          }
        >
          Create Exam
        </Button>
      </Space>

      <Table
        loading={loading}
        columns={columns}
        dataSource={exams}
        rowKey="_id"
        bordered
        pagination={{ pageSize: 5 }}
        locale={{
          emptyText: (
            <Empty
              description="No exams found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
      />
    </Card>
  );
};

export default TeacherExamsPage;
