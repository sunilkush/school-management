import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchAllClasses as fetchClasses,
  deleteClass,
} from "../../../features/classSlice.js";

import {
  Table,
  Tag,
  Input,
  Button,
  Space,
  Modal,
  Card,
  Typography,
  Row,
  Col,
  Tooltip,
  Grid,
  Empty,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

import ClassFormSA from "../../../components/forms/ClassSectionFormSA.jsx";

const { Search } = Input;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Classes = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const { classList = [], loading } = useSelector((state) => state.class || {});
  const { user } = useSelector((state) => state.auth || {});

  const [isOpen, setIsOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (schoolId) dispatch(fetchClasses({ schoolId }));
  }, [dispatch, schoolId]);

  const handleEdit = (cls) => {
    setEditingClass(cls);
    setIsOpen(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Class",
      content: "This action cannot be undone. Are you sure?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        await dispatch(deleteClass(id));
        dispatch(fetchClasses({ schoolId }));
      },
    });
  };

  /* ================= FILTER ================= */
 const filteredItems = classList
  .filter(item =>
    (item?.name ?? "").toLowerCase().includes(filterText.toLowerCase())
  )
  .sort((a, b) => {
    // Extract the number from "Class X"
    const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
    return numA - numB; // numeric ascending
  });

  /* ================= TABLE ================= */
  const columns = [
 {
    title: "S.No",
    render: (_, __, index) => index + 1,
    width: 60,
  },
  {
    title: "Class",
    dataIndex: "name",
    
    render: (name) => (
      <Space>
        <ApartmentOutlined />
        <Text strong>{name}</Text>
      </Space>
    ),
  },

    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status) => (
        <Tag color={status === "inactive" ? "red" : "green"}>
          {status === "inactive" ? "Inactive" : "Active"}
        </Tag>
      ),
    },
    {
      title: "Academic Year",
      dataIndex: "academicYearId",
      render: (year) => year?.name || "—",
    },
    {
  title: "Sections",
  dataIndex: "sections",
  render: (sections = []) =>
    sections.length ? (
      <Space wrap>
        {sections.map((s) => (
          <Tag key={s._id} color="blue">
            {s.sectionId?.name || "—"}{" "}
            {s.inChargeId?.name ? `(${s.inChargeId.name})` : ""}
          </Tag>
        ))}
      </Space>
    ) : (
      <Text type="secondary">—</Text>
    ),
},
    
    {
      title: "Subjects",
      dataIndex: "subjects",
      render: (subjects = []) =>
        subjects.length ? (
          <Space wrap>
            {subjects.map((sub) => (
              <Tag key={sub._id} color="purple">
                {sub.subjectId?.name || "—"}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Class Teacher",
      dataIndex: "teacherId",
      sorter: (a, b) =>
        (a?.teacherId?.name || "").localeCompare(
          b?.teacherId?.name || ""
        ),
      render: (teacher) => teacher?.name || "—",
    },
    {
      title: "Actions",
      align: "center",
      render: (_, cls) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(cls)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(cls._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={editingClass ? "Edit Class" : "Add Class"}
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        destroyOnClose
        width={screens.md ? 900 : "100%"}
      >
        <ClassFormSA
          initialData={editingClass}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            dispatch(fetchClasses({ schoolId }));
            setIsOpen(false);
          }}
        />
      </Modal>

      <Card>
        <Row justify="space-between" gutter={[16, 16]}>
          <Col>
            <Title level={4}>Class Management</Title>
          </Col>
          <Col xs={24} md={8}>
            <Search
              placeholder="Search class"
              allowClear
              onChange={(e) => setFilterText(e.target.value)}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          {screens.md ? (
            <Table
              columns={columns}
              dataSource={filteredItems}
              rowKey="_id"
              loading={loading}
              bordered
            />
          ) : (
            <Empty description="Use desktop for table view" />
          )}
        </div>
      </Card>
    </>
  );
};

export default Classes;
