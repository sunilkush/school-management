import React, { useEffect ,useState} from "react";
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

import { getExams } from "../../../features/examSlice.js";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from "antd";
import EditExamForm from "./EditExamForm";
const { Title, Text } = Typography;

const TeacherExamsPage = () => {
  const dispatch = useDispatch();
 
const [editModalOpen, setEditModalOpen] = useState(false);
const [selectedExamId, setSelectedExamId] = useState(null);
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
  const handleEdit = (examId) => {
  setSelectedExamId(examId);
  setEditModalOpen(true);
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
              onClick={() => handleEdit(record._id)}
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
          <Modal
  title="Edit Exam"
  open={editModalOpen}
  onCancel={() => setEditModalOpen(false)}
  footer={null}
  width={900}
  destroyOnClose
>
  {selectedExamId && (
    <EditExamForm examId={selectedExamId} />
  )}
</Modal>
    </Card>

  );
};

export default TeacherExamsPage;
