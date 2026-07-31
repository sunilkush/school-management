import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";

const { Text } = Typography;

const PRIORITY_COLOR = { low: "green", medium: "orange", high: "red" };
const TASK_STATUS_COLOR = { pending: "orange", in_progress: "blue", done: "green" };

const SystemMaintenance = () => {
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form]                    = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/maintenance-tasks");
      setTasks(res.data.data || []);
    } catch {
      message.error("Failed to load maintenance tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit   = (t) => {
    setEditing(t);
    form.setFieldsValue({ ...t, dueDate: t.dueDate ? dayjs(t.dueDate) : null });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = { ...values, dueDate: values.dueDate ? values.dueDate.toISOString() : null };
    try {
      if (editing) {
        await apiClient.patch(`/maintenance-tasks/${editing._id}`, payload);
        message.success("Task updated");
      } else {
        await apiClient.post("/maintenance-tasks", payload);
        message.success("Task created");
      }
      setModalOpen(false);
      load();
    } catch {
      message.error("Failed to save task");
    }
  };

  const toggleStatus = async (task) => {
    const next = task.status === "done" ? "pending" : task.status === "pending" ? "in_progress" : "done";
    try {
      await apiClient.patch(`/maintenance-tasks/${task._id}`, { status: next });
      load();
    } catch {
      message.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/maintenance-tasks/${id}`);
      message.success("Task deleted");
      load();
    } catch {
      message.error("Failed to delete task");
    }
  };

  return (
    <>
      <Card
        title="System Maintenance Tasks"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Add Task</Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          <List
            dataSource={tasks}
            locale={{ emptyText: "No maintenance tasks. Add one to get started." }}
            renderItem={(task) => (
              <List.Item
                actions={[
                  <Tooltip title="Cycle status" key="toggle">
                    <Button size="small" onClick={() => toggleStatus(task)}>
                      <Tag color={TASK_STATUS_COLOR[task.status]}>{task.status.replace("_", " ")}</Tag>
                    </Button>
                  </Tooltip>,
                  <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(task)} key="edit" />,
                  <Popconfirm title="Delete this task?" onConfirm={() => handleDelete(task._id)} key="del">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" size={0}>
                  <Text strong>{task.title}</Text>
                  <Space size={4}>
                    <Tag color={PRIORITY_COLOR[task.priority]}>{task.priority}</Tag>
                    {task.dueDate && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Due: {dayjs(task.dueDate).format("DD MMM YYYY")}
                      </Text>
                    )}
                  </Space>
                  {task.description && <Text type="secondary" style={{ fontSize: 12 }}>{task.description}</Text>}
                </Space>
              </List.Item>
            )}
          />
        </Spin>
      </Card>

      <Modal
        title={editing ? "Edit Task" : "New Maintenance Task"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Backup database" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue="medium">
                <Select options={[
                  { value: "low",    label: "Low" },
                  { value: "medium", label: "Medium" },
                  { value: "high",   label: "High" },
                ]} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">{editing ? "Update" : "Create"}</Button>
          </Space>
        </Form>
      </Modal>
    </>
  );
};

export default SystemMaintenance;
