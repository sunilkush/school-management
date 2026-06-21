import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button, Form, Input, Select, DatePicker, Tag, Modal, message,
  Table, Space, Tooltip, Popconfirm, Badge, Avatar, Empty,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined,
  CheckCircleOutlined, SyncOutlined, StopOutlined, UserOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  fetchTasks, fetchAssignableUsers, createTask, updateTask, deleteTask,
} from "../../../features/taskSlice";
import PageHeader from "../../../components/layout/PageHeader";

const { TextArea } = Input;
const { Option } = Select;

const PRIORITY_COLOR = { low: "green", medium: "blue", high: "orange", urgent: "red" };
const STATUS_COLOR   = { todo: "default", in_progress: "processing", done: "success", cancelled: "error" };
const STATUS_ICON    = {
  todo:        <ClockCircleOutlined />,
  in_progress: <SyncOutlined spin />,
  done:        <CheckCircleOutlined />,
  cancelled:   <StopOutlined />,
};
const STATUS_LABEL   = { todo: "To Do", in_progress: "In Progress", done: "Done", cancelled: "Cancelled" };
const PRIORITY_LABEL = { low: "Low", medium: "Medium", high: "High", urgent: "Urgent" };

const TaskManagement = () => {
  const dispatch = useDispatch();
  const { items: tasks = [], loading = false, assignableUsers = [], usersLoading = false } = useSelector((s) => s.tasks || {});

  const [modalOpen, setModalOpen]   = useState(false);
  const [editTask, setEditTask]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterPriority, setFilterPriority] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => { dispatch(fetchTasks()); }, [dispatch]);

  const openCreate = () => {
    setEditTask(null);
    form.resetFields();
    dispatch(fetchAssignableUsers());
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null,
      assignedTo: task.assignedTo?.map((u) => u._id) || [],
    });
    dispatch(fetchAssignableUsers());
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title,
        description: values.description || "",
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null,
        assignedTo: values.assignedTo || [],
      };
      if (editTask) {
        await dispatch(updateTask({ id: editTask._id, ...payload })).unwrap();
        message.success("Task updated");
      } else {
        await dispatch(createTask(payload)).unwrap();
        message.success("Task created");
      }
      setModalOpen(false);
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTask(id)).unwrap();
      message.success("Task deleted");
    } catch (err) {
      message.error(typeof err === "string" ? err : "Failed to delete task");
    }
  };

  const filtered = tasks.filter((t) => {
    if (filterStatus   && t.status   !== filterStatus)   return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return true;
  });

  const columns = [
    {
      title: "Task",
      dataIndex: "title",
      key: "title",
      render: (title, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{title}</div>
          {record.description && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (p) => <Tag color={PRIORITY_COLOR[p]}>{PRIORITY_LABEL[p]}</Tag>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (s) => (
        <Badge
          status={STATUS_COLOR[s]}
          text={<span style={{ fontSize: 12 }}>{STATUS_LABEL[s]}</span>}
        />
      ),
    },
    {
      title: "Assigned To",
      dataIndex: "assignedTo",
      key: "assignedTo",
      render: (users) =>
        users?.length ? (
          <Avatar.Group maxCount={3} size="small">
            {users.map((u) =>
              u?.avatar ? (
                <Tooltip key={u._id} title={u.name}>
                  <Avatar src={u.avatar} size="small" />
                </Tooltip>
              ) : (
                <Tooltip key={u._id} title={u.name}>
                  <Avatar size="small" style={{ background: "#7c3aed" }}>
                    {u.name?.[0]?.toUpperCase()}
                  </Avatar>
                </Tooltip>
              )
            )}
          </Avatar.Group>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Unassigned</span>
        ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 110,
      render: (d) =>
        d ? (
          <span style={{ fontSize: 12, color: dayjs(d).isBefore(dayjs()) ? "#ef4444" : "var(--text-secondary)" }}>
            {dayjs(d).format("DD MMM YYYY")}
          </span>
        ) : (
          <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Popconfirm title="Delete this task?" onConfirm={() => handleDelete(record._id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Stat cards ── */
  const counts = {
    total:       tasks.length,
    todo:        tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done:        tasks.filter((t) => t.status === "done").length,
  };

  return (
    <>
      <PageHeader
        title="Task Management"
        subtitle="Create and assign tasks to staff members"
        icon={<SnippetsOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Task
          </Button>
        }
      />

      <div style={{ padding: "0 24px 24px" }}>
        {/* Stat cards */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
          {[
            { label: "Total",       value: counts.total,       color: "#7c3aed", bg: "#ede9fe" },
            { label: "To Do",       value: counts.todo,        color: "#f59e0b", bg: "#fef3c7" },
            { label: "In Progress", value: counts.in_progress, color: "#2563eb", bg: "#dbeafe" },
            { label: "Done",        value: counts.done,        color: "#10b981", bg: "#d1fae5" },
          ].map((c) => (
            <div key={c.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "14px 20px", minWidth: 120, flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 160 }}
            value={filterStatus}
            onChange={setFilterStatus}
          >
            {Object.entries(STATUS_LABEL).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
          </Select>
          <Select
            allowClear
            placeholder="Filter by priority"
            style={{ width: 160 }}
            value={filterPriority}
            onChange={setFilterPriority}
          >
            {Object.entries(PRIORITY_LABEL).map(([k, v]) => <Option key={k} value={k}>{v}</Option>)}
          </Select>
        </div>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb" }}>
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 20, showTotal: (t) => `${t} tasks` }}
            locale={{ emptyText: <Empty description="No tasks yet. Create one!" /> }}
          />
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        title={editTask ? "Edit Task" : "Create New Task"}
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item label="Task Title" name="title" rules={[{ required: true, message: "Title is required" }]}>
            <Input placeholder="Enter task title" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Describe the task (optional)" />
          </Form.Item>

          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item label="Priority" name="priority" initialValue="medium" style={{ flex: 1 }}>
              <Select>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                  <Option key={k} value={k}><Tag color={PRIORITY_COLOR[k]}>{v}</Tag></Option>
                ))}
              </Select>
            </Form.Item>

            {editTask && (
              <Form.Item label="Status" name="status" style={{ flex: 1 }}>
                <Select>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <Option key={k} value={k}>{STATUS_ICON[k]} {v}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </div>

          <Form.Item label="Due Date" name="dueDate">
            <DatePicker style={{ width: "100%" }} format="DD MMM YYYY" />
          </Form.Item>

          <Form.Item label="Assign To" name="assignedTo">
            <Select
              mode="multiple"
              placeholder="Search and select users..."
              showSearch
              filterOption={(input, option) =>
                option?.label?.toLowerCase().includes(input.toLowerCase())
              }
              loading={usersLoading}
              optionLabelProp="label"
            >
              {assignableUsers.map((u) => (
                <Option
                  key={u._id}
                  value={u._id}
                  label={u.name}
                >
                  <Space>
                    {u.avatar ? (
                      <Avatar src={u.avatar} size="small" />
                    ) : (
                      <Avatar icon={<UserOutlined />} size="small" style={{ background: "#7c3aed" }} />
                    )}
                    <span>{u.name}</span>
                    <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{u.role}</span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button block onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button block type="primary" htmlType="submit" loading={saving}>
              {editTask ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default TaskManagement;
