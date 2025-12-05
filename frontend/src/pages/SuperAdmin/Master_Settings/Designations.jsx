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
import { UserCog, Edit, Trash2, Plus } from "lucide-react";

const { Option } = Select;

const Designations = () => {
  const [designations, setDesignations] = useState([
    { id: 1, name: "Principal", level: "Senior", status: "Active" },
    { id: 2, name: "Teacher", level: "Mid", status: "Active" },
    { id: 3, name: "Accountant", level: "Junior", status: "Inactive" },
  ]);

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form] = Form.useForm();
  const [selectedId, setSelectedId] = useState(null);

  // -----------------------------
  // MODAL HANDLERS
  // -----------------------------
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
      level: record.level,
      status: record.status,
    });

    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    form.resetFields();
  };

  // -----------------------------
  // SAVE / UPDATE
  // -----------------------------
  const onFinish = (values) => {
    if (isEdit) {
      // UPDATE
      setDesignations((prev) =>
        prev.map((d) =>
          d.id === selectedId ? { ...values, id: selectedId } : d
        )
      );
    } else {
      // ADD
      setDesignations((prev) => [
        ...prev,
        { ...values, id: Date.now() },
      ]);
    }

    closeModal();
  };

  // -----------------------------
  // DELETE
  // -----------------------------
  const handleDelete = (id) => {
    setDesignations((prev) => prev.filter((d) => d.id !== id));
  };

  // -----------------------------
  // TABLE COLUMNS
  // -----------------------------
  const columns = [
    {
      title: "#",
      render: (_, __, index) => index + 1,
      width: 60,
    },
    {
      title: "Designation",
      dataIndex: "name",
    },
    {
      title: "Level",
      dataIndex: "level",
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
            title="Delete designation?"
            description="Are you sure to delete this designation?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <UserCog />
          Designations
        </h1>

        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={openAddModal}
          className="!flex !items-center"
        >
          Add Designation
        </Button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow p-4">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={designations}
          bordered
          pagination={{ pageSize: 5 }}
        />
      </div>

      {/* MODAL FORM */}
      <Modal
        open={open}
        title={isEdit ? "Update Designation" : "Add Designation"}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          className="mt-4 space-y-3"
        >
          <Form.Item
            name="name"
            label="Designation"
            rules={[{ required: true, message: "Please enter designation" }]}
          >
            <Input placeholder="Enter designation" />
          </Form.Item>

          <Form.Item
            name="level"
            label="Level"
            rules={[{ required: true, message: "Please enter level" }]}
          >
            <Input placeholder="Senior / Mid / Junior" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="Active"
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

export default Designations;
