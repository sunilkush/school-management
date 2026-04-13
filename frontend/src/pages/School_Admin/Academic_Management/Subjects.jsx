import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Tag,
  Space,
  Input,
  Card,
  Typography,
  Row,
  Col,
  Avatar,
  Empty,
  ConfigProvider,
  Grid,
  Spin,
  Alert,
} from "antd";

import { Search, BookOpen, Users } from "lucide-react";


import { getAllSubjects } from "../../../features/subjectSlice.js";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const toDisplayText = (value, fallback = "-") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text.length ? text : fallback;
};

const Subjects = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [searchText, setSearchText] = useState("");

  const { user } = useSelector((state) => state.auth || {});
  const { selectedAcademicYear } = useSelector((state) => state.academicYear || {});
  const academicYearId = selectedAcademicYear?._id;
  const { subjects = [] } = useSelector(
    (state) => state.subject || {}
  );

  const page = 1;
  const limit = 50;
  const schoolId = user?.school?._id;

  useEffect(() => {
    if (!schoolId) return;
    dispatch(getAllSubjects({ page, limit, schoolId, academicYearId }));
  }, [dispatch, schoolId, academicYearId]);

  const safeSubjects = useMemo(
    () => (Array.isArray(subjects) ? subjects : []),
    [subjects]
  );

  const filteredSubjects = useMemo(() => {
    const normalizedSearch = searchText.toLowerCase().trim();
    if (!normalizedSearch) return safeSubjects;

    return safeSubjects.filter((s) =>
      toDisplayText(s?.name, "").toLowerCase().includes(normalizedSearch)
    );
  }, [safeSubjects, searchText]);

  const stats = useMemo(
    () => ({
      total: safeSubjects.length,
      active: safeSubjects.filter((s) => s?.isActive).length,
      global: safeSubjects.filter((s) => s?.isGlobal).length,
    }),
    [safeSubjects]
  );

  const columns = [
    {
      title: "Subject",
      render: (_, record) => {
        const subjectName = toDisplayText(record?.name, "Unnamed");
        return (
          <Space>
            <Avatar
              size={36}
              style={{
                background: "#eef2ff",
                color: "#6366f1",
                fontWeight: 600,
              }}
            >
              {subjectName.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong>{subjectName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {toDisplayText(record?.category)} • {toDisplayText(record?.type)}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Marks",
      render: (_, r) => (
        <Text>
          {toDisplayText(r?.passMarks, "0")}/{toDisplayText(r?.maxMarks, "0")}
        </Text>
      ),
    },
    {
      title: "Scope",
      render: (_, r) =>
        r?.isGlobal ? (
          <Tag color="blue">Global</Tag>
        ) : (
          <Tag color="purple">{toDisplayText(r?.schoolId?.name, "School")}</Tag>
        ),
    },
    {
      title: "Status",
      render: (_, r) => (
        <Tag color={r?.isActive ? "green" : "red"}>
          {r?.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
  ];

  const MobileView = () => {
    

    if (!filteredSubjects.length) {
      return <Empty description="No subjects found" />;
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredSubjects.map((item) => {
          const subjectName = toDisplayText(item?.name, "Unnamed");
          return (
            <Card key={item?._id || subjectName} style={{ borderRadius: 12 }}>
              <Space align="start">
                <Avatar>{subjectName.charAt(0).toUpperCase()}</Avatar>
                <div>
                  <Text strong>{subjectName}</Text>
                  <div style={{ fontSize: 12, color: "#888" }}>
                    {toDisplayText(item?.category)} • {toDisplayText(item?.type)}
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <Tag color="blue">
                      {toDisplayText(item?.passMarks, "0")}/{toDisplayText(item?.maxMarks, "0")}
                    </Tag>
                    <Tag color={item?.isActive ? "green" : "red"}>
                      {item?.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>
                </div>
              </Space>
            </Card>
          );
        })}
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
        <div style={{ marginBottom: 20 }}>
          <Title level={4}>Subjects</Title>
          <Text type="secondary">Manage curriculum subjects</Text>
        </div>

        

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
              
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>

        
      </div>
    </ConfigProvider>
  );
};

export default Subjects;