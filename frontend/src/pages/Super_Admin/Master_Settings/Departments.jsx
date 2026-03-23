import React, { useState } from "react";
import {
  Table,
  Modal,
  Form,
  Input,
  Select,
  Button,
  Tag,
  Popconfirm,
} from "antd";
import { Building2, Edit, Trash2, Plus } from "lucide-react";

const { Option } = Select;

const Departments = () => {
  const [departments, setDepartments] = useState([
    { id: 1, name: "Science", head: "Mr. Sharma", status: "Active" },
    { id: 2, name: "Mathematics", head: "Ms. Gupta", status: "Active" },
    { id: 3, name: "Commerce", head: "Mr. Singh", status: "Inactive" },
  ]);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [form] = Form.useForm();

  // -------------------------
  // MODAL HANDLERS
  // -------------------------
  const openAddModal = () => {
    setIsEdit(false);
    setSelectedId(null);
    form.resetFields();
    setOpen(true);
  };

  const openEditModal = (record) => {
    setIsEdit(true);
    setSelectedId(record.id);

    form.setFieldsValue({
      name: record.name,
      head: record.head,
      status: record.status,
    });

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    form.resetFields();
  };

  // -------------------------
  // SAVE / UPDATE
  // -------------------------
  const onFinish = (values) => {
    if (isEdit) {
      setDepartments((prev) =>
        prev.map((d) =>
          d.id === selectedId ? { ...values, id: selectedId } : d
        )
      );
    } else {
      setDepartments((prev) => [
        ...prev,
        { ...values, id: Date.now() },
      ]);
    }
    closeModal();
  };

  // -------------------------
  // DELETE
  // -------------------------
  const handleDelete = (id) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  // -------------------------
  // TABLE COLUMNS
  // -------------------------
  const columns = [
    {
      title: "#",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Department",
      dataIndex: "name",
    },
    {
      title: "Head",
      dataIndex: "head",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "Active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      align: "center",
      width: 120,
      render: (_, record) => (
        <div className="flex justify-center gap-3">
          <button
            onClick={() => openEditModal(record)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit size={18} />
          </button>

          <Popconfirm
            title="Delete Department?"
            description="Are you sure you want to delete this department?"
            onConfirm={() => handleDelete(record.id)}
          >
            <button className="text-red-600 hover:text-red-800">
              <Trash2 size={18} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Building2 />
          Departments
        </h1>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={openAddModal}
          className="!flex !items-center"
        >
          Add Department
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={departments}
          pagination={{ pageSize: 5 }}
          bordered
        />
      </div>

      {/* MODAL FORM */}
      <Modal
        open={open}
        title={isEdit ? "Update Department" : "Add Department"}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          className="space-y-3"
          initialValues={{
            status: "Active",
          }}
        >
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: "Department is required" }]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>

          <Form.Item
            name="head"
            label="Department Head"
            rules={[{ required: true, message: "Head name is required" }]}
          >
            <Input placeholder="Enter department head" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={closeModal}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {isEdit ? "Update" : "Save"}
            </Button>
          </div>
        </Form>
      </Modal>

    </div>
  );
};

export default Departments;
