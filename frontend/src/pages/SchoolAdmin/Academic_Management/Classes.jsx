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
  Grid,
  Empty,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
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
    .filter((item) =>
      (item?.name ?? "").toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      const numA = parseInt(a.name.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.name.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "S.No",
      render: (_, __, index) => index + 1,
      width: 70,
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
      render: (sections = []) => (
        <Space wrap>
          {sections.map((s) => (
            <Tag key={s._id} color="blue">
              {s.sectionId?.name}
              {s.teacherId?.name ? ` (${s.teacherId.name})` : ""}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Subjects",
      dataIndex: "subjects",
      render: (subjects = []) => (
        <Space wrap>
          {subjects.map((s) => (
            <Tag key={s._id} color="purple">
              {s.subjectId?.name}
              {s.teacherId?.name ? ` (${s.teacherId.name})` : ""}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Actions",
      render: (_, cls) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(cls)} />
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

  /* ================= MOBILE CARD VIEW ================= */
  const MobileCards = () => {
    if (!filteredItems.length) return <Empty />;

    return (
      <Row gutter={[12, 12]}>
         {filteredItems.map((cls) => (
          <Col xs={24} key={cls._id}>
            <Card size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Space>
                    <ApartmentOutlined />
                    <Text strong>{cls.name}</Text>
                  </Space>

                  <Tag color={cls.status === "inactive" ? "red" : "green"}>
                    {cls.status === "inactive" ? "Inactive" : "Active"}
                  </Tag>
                </Space>

                <Text type="secondary">
                  Academic Year: {cls.academicYearId?.name || "—"}
                </Text>

                <div>
                  <Text strong>Sections:</Text>
                  <br />
                  <Space wrap>
                    {cls.sections?.map((s) => (
                      <Tag key={s._id} color="blue">
                        {s.sectionId?.name}
                        {s.teacherId?.name ? ` (${s.teacherId.name})` : ""}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <div>
                  <Text strong>Subjects:</Text>
                  <br />
                  <Space wrap>
                    {cls.subjects?.map((s) => (
                      <Tag key={s._id} color="purple">
                        {s.subjectId?.name}
                        {s.teacherId?.name ? ` (${s.teacherId.name})` : ""}
                      </Tag>
                    ))}
                  </Space>
                </div>

                <Space>
                  <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(cls)} />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(cls._id)}
                  />
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <>
      <Modal
        title={editingClass ? "Edit Class" : "Add Class"}
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        destroyOnClose
        width={screens.lg ? 900 : screens.md ? 700 : "100%"}
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
        <Row gutter={[16, 16]} justify="space-between">
          <Col xs={24} md={12}>
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
              scroll={{ x: 900 }}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <MobileCards />
          )}
        </div>
      </Card>
    </>
  );
};

export default Classes;
