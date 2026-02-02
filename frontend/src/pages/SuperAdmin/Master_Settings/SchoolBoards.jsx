import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Checkbox,
  message,
  Tag,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  createBoard,
  getBoards,
  updateBoard,
  deleteBoard,
  assignSchoolBoards
} from "../../../features/boardSlice.js";

import { fetchSchools } from "../../../features/schoolSlice.js";
 

const { Option } = Select;

const SchoolBoards = () => {
  const dispatch = useDispatch();

  // ==============================
  // Boards State
  // ==============================
  const boardsState = useSelector((state) => state.boards || {});
  const boards =
    boardsState?.boards?.boards ||
    boardsState?.boards ||
    [];

  const loading = boardsState?.loading || false;

  // ==============================
  // Schools State (Assuming schoolSlice hai)
  // ==============================
  const { schools = [] } = useSelector((state) => state.school || {});
  // ==============================
  // Local States
  // ==============================
  const [modalVisible, setModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  
  const [editingBoard, setEditingBoard] = useState(null);

  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  // ==============================
  // Safe User Parse
  // ==============================
  let createdByRole = null;
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    createdByRole = user?.role?.name || null;
  } catch {
    createdByRole = null;
  }

  // ==============================
  // Load Boards
  // ==============================
  useEffect(() => {
    dispatch(getBoards());
    dispatch(fetchSchools())
  }, [dispatch]);

  // ==============================
  // Board CRUD Handlers
  // ==============================
  const handleAddBoard = () => {
    setEditingBoard(null);
    form.resetFields();

    form.setFieldsValue({
      createdByRole,
      isActive: true,
    });

    setModalVisible(true);
  };

  const handleEditBoard = (board) => {
    setEditingBoard(board);

    form.setFieldsValue({
      name: board?.name,
      code: board?.code,
      description: board?.description,
      isActive: board?.isActive,
      createdByRole: board?.createdByRole || createdByRole,
    });

    setModalVisible(true);
  };

  const handleDeleteBoard = async (id) => {
    try {
      await dispatch(deleteBoard(id)).unwrap();
      message.success("Deleted Successfully");
      dispatch(getBoards());
    } catch (err) {
      message.error(err?.message || "Delete failed");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBoard) {
        await dispatch(
          updateBoard({
            id: editingBoard._id,
            boardData: values,
          })
        ).unwrap();
        message.success("Updated Successfully");
      } else {
        await dispatch(createBoard(values)).unwrap();
        message.success("Created Successfully");
      }

      setModalVisible(false);
      dispatch(getBoards());
    } catch (err) {
      message.error(err?.message || "Operation failed");
    }
  };

  // ==============================
  // ✅ Assign Modal Handlers
  // ==============================
  const handleOpenAssignModal = () => {
    assignForm.resetFields();
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async (values) => {
    try {
      console.log("Assign Data", values);

      // 👉 API Call (agar hai)
       await dispatch(assignSchoolBoards(values)).unwrap();

      message.success("Boards Assigned Successfully");
      setAssignModalVisible(false);
    } catch (err) {
      message.error(err?.message || "Assign Failed");
    }
  };

  // ==============================
  // Table Columns
  // ==============================
  const columns = [
    {
      title: "Board Name",
      dataIndex: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val) =>
        val ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"
            size="small"
            onClick={() => handleEditBoard(record)}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteBoard(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // ==============================
  // UI
  // ==============================
  return (
    <div className="p-4">
      <Card
        title="School Exam Boards"
        extra={
          <Space>
            <Button
              type="default"
              onClick={handleOpenAssignModal}
              loading={boardsState.loading}
            >
              Assign School Boards
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddBoard}
            >
              Add Board
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="_id"
          dataSource={Array.isArray(boards) ? boards : []}
          columns={columns}
          loading={loading}
        />
      </Card>

      {/* ================= Add/Edit Modal ================= */}
      <Modal
        title={editingBoard ? "Edit Board" : "Add Board"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="createdByRole" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            label="Board Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item label="Code" name="code">
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      {/* ================= Assign Modal ================= */}
      <Modal
        title="Assign School Boards"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={() => assignForm.submit()}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          {/* School Select */}
          <Form.Item
            label="Select School"
            name="schoolId"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select School">
              {schools.map((school) => (
                <Option key={school._id} value={school._id}>
                  {school.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Boards Multi Select */}
          <Form.Item
            label="Select Boards"
            name="boardIds"
            rules={[{ required: true }]}
          >
            <Select
              mode="multiple"
              placeholder="Select Boards"
            >
              {boards.map((board) => (
                <Option key={board._id} value={board._id}>
                  {board.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolBoards;
