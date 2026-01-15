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
const filteredItems = [...classList]
  .filter((item) =>
    item.name?.toLowerCase().includes(filterText.toLowerCase())
  )
  .sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  /* ================= TABLE VIEW (DESKTOP/TABLET) ================= */
  const columns = [
    {
      title: "S.No",
      width: 60,
      render: (_, __, index) => index + 1,
      responsive: ["md"],
    },
    {
      title: "Class",
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
      responsive: ["md"],
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
      responsive: ["lg"],
      render: (year) => year?.name || "—",
    },
    {
      title: "Sections",
      dataIndex: "sections",
      responsive: ["lg"],
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
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      responsive: ["lg"],
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
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Class Teacher",
      dataIndex: "teacherId",
      responsive: ["lg"],
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

  /* ================= MOBILE CARD VIEW ================= */
  const MobileView = () => {
    if (!filteredItems.length)
      return <Empty description="No Classes Found" />;

    return (
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {filteredItems.map((cls) => (
          <Card
            key={cls._id}
            size="small"
            title={
              <Space>
                <ApartmentOutlined />
                <Text strong>{cls.name}</Text>
              </Space>
            }
            extra={
              <Tag color={cls.status === "inactive" ? "red" : "green"}>
                {cls.status === "inactive" ? "Inactive" : "Active"}
              </Tag>
            }
          >
            <Space direction="vertical" size={6} style={{ width: "100%" }}>
              <Text>
                <CalendarOutlined /> <strong>Academic Year:</strong>{" "}
                {cls.academicYearId?.name || "—"}
              </Text>

              <Text>
                <TeamOutlined /> <strong>Class Teacher:</strong>{" "}
                {cls.teacherId?.name || "—"}
              </Text>

              <div>
                <Text strong>Sections:</Text>
                <br />
                {cls.sections?.length ? (
                  <Space wrap>
                    {cls.sections.map((s) => (
                      <Tag key={s._id} color="blue">
                        {s.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </div>

              <div>
                <Text strong>
                  <BookOutlined /> Subjects:
                </Text>
                <br />
                {cls.subjects?.length ? (
                  <Space wrap>
                    {cls.subjects.map((sub) => (
                      <Tag key={sub._id} color="purple">
                        {sub?.subjectId?.name}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </div>

              <Space>
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(cls)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(cls._id)}
                >
                  Delete
                </Button>
              </Space>
            </Space>
          </Card>
        ))}
      </Space>
    );
  };

  return (
    <>
      {/* MODAL */}
      <Modal
        title={editingClass ? "Edit Class" : "Add Class"}
        open={isOpen}
        onCancel={() => setIsOpen(false)}
        footer={null}
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

      {/* PAGE */}
      <Card bordered={false}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col>
            <Title level={4}>Class Management</Title>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search class"
              allowClear
              onChange={(e) => setFilterText(e.target.value)}
            />
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          {/* Mobile */}
          {!screens.md && <MobileView />}

          {/* Tablet / Desktop */}
          {screens.md && (
            <Table
              columns={columns}
              dataSource={filteredItems}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize: 10 }}
              bordered
            />
          )}
        </div>
      </Card>
    </>
  );
};

export default Classes;
