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
  Grid,
  Spin,
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
  getAllSubjects
} from "../../../features/subjectSlice.js";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Subjects = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;
  const { subjects = [], loading = false } = useSelector(
    (state) => state.subject || {}
  );

  const page = 1;
  const limit = 50;
  const schoolId = user?.school?._id;

  /* ── FETCH ── */
  useEffect(() => {
    if (schoolId) {
      dispatch(getAllSubjects({ page, limit, schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  /* ── FILTER ── */
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) =>
      s.name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [subjects, searchText]);

  /* ── STATS ── */
  const stats = useMemo(() => {
    return {
      total: subjects.length,
      active: subjects.filter((s) => s.isActive).length,
      global: subjects.filter((s) => s.isGlobal).length,
    };
  }, [subjects]);

 

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
      title: "Status",
      render: (_, r) => (
        <Tag color={r.isActive ? "green" : "red"}>
          {r.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    
  ];

  /* ── MOBILE VIEW ── */
  const MobileView = () => {
    if (loading) return <Spin />;

    if (!filteredSubjects.length) {
      return <Empty description="No subjects found" />;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredSubjects.map((item) => (
          <Card key={item._id} style={{ borderRadius: 12 }}>
            <Space align="start">
              <Avatar>{item.name?.charAt(0)}</Avatar>
              <div>
                <Text strong>{item.name}</Text>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {item.category} • {item.type}
                </div>

                <div style={{ marginTop: 6 }}>
                  <Tag color="blue">
                    {item.passMarks}/{item.maxMarks}
                  </Tag>
                  <Tag color={item.isActive ? "green" : "red"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </Tag>
                </div>
              </div>
            </Space>

            
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 12,
        },
      }}
    >
      <div>
        {/* HEADER */}
        <div style={{ marginBottom: 20 }}>
          <Title level={4}>Subjects</Title>
          <Text type="secondary">Manage curriculum subjects</Text>
        </div>

        {/* STATS */}
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
                    <Text strong>{s.value}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* MAIN */}
        <Card>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
            <Input
              prefix={<Search size={14} />}
              placeholder="Search subjects..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />

          
          </div>

          {isMobile ? (
            <MobileView />
          ) : (
            <Table
              rowKey="_id"
              columns={columns}
              dataSource={filteredSubjects}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>

        {/* MODAL */}
        <SubjectForm
          isOpen={isModalOpen}
          editData={selectedSubject}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubject(null);
            dispatch(getAllSubjects({ page, limit, schoolId }));
          }}
        />
      </div>
    </ConfigProvider>
  );
};

export default Subjects;