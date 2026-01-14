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
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

import ClassFormSA from "../../../components/forms/ClassSectionFormSA.jsx";

const { Search } = Input;
const { Title, Text } = Typography;

const Classes = () => {
  const dispatch = useDispatch();
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

/*   const handleAddNew = () => {
    setEditingClass(null);
    setIsOpen(true);
  }; */

  const filteredItems = [...classList]
    .filter((item) =>
      item.name?.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

  const columns = [
    {
      title: "S.No",
      width: 70,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Class Name",
      dataIndex: "name",
      render: (name) => (
        <Space>
          <ApartmentOutlined style={{ color: "#1677ff" }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status) =>
        status === "inactive" ? (
          <Tag color="red">Inactive</Tag>
        ) : (
          <Tag color="green">Active</Tag>
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
      render: (sections) =>
        sections?.length ? (
          <Space wrap>
            {sections.map((s) => (
              <Tag key={s._id} color="blue">
                {s.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">No Sections</Text>
        ),
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      render: (subjects) =>
        subjects?.length ? (
          <Space wrap>
            {subjects.map((sub) => (
              <Tag key={sub._id} color="purple">
                {sub?.subjectId?.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">No Subjects</Text>
        ),
    },
    {
      title: "Class Teacher",
      dataIndex: "teacherId",
      render: (teacher) => teacher?.name || "—",
    },
    {
      title: "Actions",
      align: "center",
      render: (_, cls) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(cls)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(cls._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Add / Edit Modal */}
      <Modal
        title={editingClass ? "Edit Class" : "Add New Class"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
        destroyOnClose
        style={{padding:"0px"}}
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

      {/* Main UI */}
      <Card bordered={false}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4}>Class Management</Title>
          </Col>

          <Col>
            <Space wrap>
              <Search
                placeholder="Search class"
                allowClear
                onChange={(e) => setFilterText(e.target.value)}
                style={{ width: 220 }}
              />

             {/*  <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddNew}
              >
                Add Class
              </Button> */}
            </Space>
          </Col>
        </Row>

        <Table
          className="mt-4"
          columns={columns}
          dataSource={filteredItems}
          loading={loading}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          bordered
        />
      </Card>
    </>
  );
};

export default Classes;
