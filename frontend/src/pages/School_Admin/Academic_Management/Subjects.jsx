import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Input,
  Tooltip,
  Card,
  Typography,
  Row,
  Col,
  Avatar,
  Empty,
  ConfigProvider,
} from "antd";

import {
  Edit,
  Trash2,
  Plus,
  Search,
  BookOpen,
  Users,
} from "lucide-react";

import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import {
  getAllSubjects,
  deleteSubject,
} from "../../../features/subjectSlice.js";

const { Title, Text } = Typography;

const Subjects = () => {
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchText, setSearchText] = useState("");
 
  const { user } = useSelector((state) => state.auth || {});
  const { subjects = [], loading = false } = useSelector(
    (state) => state.subject || {}
  );
  console.log("Subjects data:", subjects); // Debugging log
  const page = "";
  const limit = "";
  const schoolId = user?.school?._id;

  /* ── FETCH ── */
  useEffect(() => {
    if (schoolId) {
      dispatch(getAllSubjects({ page, limit, search: searchText || undefined }));
    }
  }, [dispatch, schoolId, searchText]);

  /* ── STATS ── */
  const stats = useMemo(() => {
    return {
      total: subjects.length,
      active: subjects.filter((s) => s.isActive).length,
      global: subjects.filter((s) => s.isGlobal).length,
    };
  }, [subjects]);

  /* ── ACTIONS ── */
  const handleDelete = (id) => {
    Modal.confirm({
      title: "Delete Subject",
      content: "Are you sure?",
      onOk: async () => {
        await dispatch(deleteSubject(id)).unwrap();
        dispatch(getAllSubjects({ page, limit }));
      },
    });
  };

  /* ── TABLE ── */
  const columns = [
    {
      title: "Subject",
      render: (_, record) => (
        <Space>
          <Avatar
            size={36}
            style={{
              background: "#eef2ff",
              color: "#6366f1",
              fontWeight: 600,
            }}
          >
            {record.name?.charAt(0)}
          </Avatar>
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.category} • {record.type}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Marks",
      render: (_, r) => (
        <Text>{r.passMarks}/{r.maxMarks}</Text>
      ),
    },
    {
      title: "Scope",
      render: (_, r) =>
        r.isGlobal ? (
          <Tag color="blue">Global</Tag>
        ) : (
          <Tag color="purple">{r.schoolId?.name || "School"}</Tag>
        ),
    },
    {
      title: "Teachers",
      render: (_, r) =>
        r.assignedTeachers?.length ? (
          <Avatar.Group maxCount={3}>
            {r.assignedTeachers.map((t, i) => (
              <Tooltip key={i} title={t.teacherId?.name}>
                <Avatar>
                  {t.teacherId?.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={r.isActive ? "green" : "red"}>
          {r.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "",
      align: "right",
      render: (_, r) => (
        <Space>
          <Button type="text" icon={<Edit size={16} />} />
          <Button
            type="text"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(r._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
          fontFamily: "'Inter', sans-serif",
        },
      }}
    >
      <div style={{ padding: 0 }}>
        {/* ── HEADER ── */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>
            Subjects
          </Title>
          <Text type="secondary">
            Manage curriculum subjects
          </Text>
        </div>

        {/* ── STATS ── */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          {[
            { title: "Total", value: stats.total, icon: <BookOpen /> },
            { title: "Active", value: stats.active, icon: <Users /> },
            { title: "Global", value: stats.global, icon: <BookOpen /> },
          ].map((s) => (
            <Col xs={12} md={6} key={s.title}>
              <Card>
                <Space>
                  {s.icon}
                  <div>
                    <Text type="secondary">{s.title}</Text>
                    <br />
                    <Text strong style={{ fontSize: 18 }}>
                      {s.value}
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── MAIN CARD ── */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 16,
            border: "1px solid #e2e8f0",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: 16,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Input
              prefix={<Search size={14} />}
              placeholder="Search subjects..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
            />

            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Subject
            </Button>
          </div>

          {/* Table */}
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={subjects}
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: <Empty description="No subjects found" />,
            }}
          />
        </Card>
      </div>

      {/* Modal */}
      <SubjectForm
        isOpen={isModalOpen}
        editData={selectedSubject}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
          dispatch(getAllSubjects({ page, limit }));
        }}
      />
    </ConfigProvider>
  );
};

export default Subjects;