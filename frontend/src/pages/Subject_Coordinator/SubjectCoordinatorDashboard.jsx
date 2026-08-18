import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Statistic, Space, Table, Tag, Progress, Typography, Button, Spin } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { getAllSubjects } from "../../features/subjectSlice";
import { getExams } from "../../features/examSlice";
import apiClient from "../../api/httpClient";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const SubjectCoordinatorDashboard = () => {
  const navigate      = useNavigate();
  const reduxDispatch = useDispatch();

  const { subjects, loading: subLoading } = useSelector((s) => s.subject || { subjects: [], loading: false });
  const { exams,    loading: examLoading } = useSelector((s) => s.exams   || { exams: [],    loading: false });

  const [plans, setPlans]             = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  useEffect(() => {
    reduxDispatch(getAllSubjects({ limit: 200 }));
    reduxDispatch(getExams({ limit: 100 }));
    setPlansLoading(true);
    apiClient
      .get("/lesson-plans", { params: { limit: 500 } })
      .then((r) => setPlans(r.data?.data?.items || r.data?.data || []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [reduxDispatch]);

  const now       = dayjs();
  const monthStart = now.startOf("month");
  const monthEnd   = now.endOf("month");

  const subjectList = useMemo(() => Array.isArray(subjects) ? subjects : [], [subjects]);
  const examList    = useMemo(() => Array.isArray(exams)    ? exams    : [], [exams]);

  const thisMonthExams = useMemo(
    () => examList.filter((e) => dayjs(e.examDate).isAfter(monthStart) && dayjs(e.examDate).isBefore(monthEnd)),
    [examList, monthStart, monthEnd]
  );

  /* Compute per-subject syllabus progress from lesson plans */
  const subjectProgress = useMemo(() => {
    return subjectList.map((sub) => {
      const subId  = sub._id;
      const subPlans = plans.filter(
        (p) => (p.subjectId?._id || p.subjectId) === subId
      );
      const total     = subPlans.length;
      const completed = subPlans.filter((p) => p.status === "completed").length;
      const pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

      const teacherIds = [...new Set(
        subPlans.map((p) => (p.teacherId?._id || p.teacherId)?.toString()).filter(Boolean)
      )];

      const classIds = [...new Set(
        subPlans.map((p) => (p.schoolClassId?._id || p.schoolClassId)?.toString()).filter(Boolean)
      )];

      return {
        key:       subId,
        subject:   sub.name,
        teachers:  teacherIds.length,
        classes:   classIds.length,
        plans:     total,
        syllabus:  pct,
        status:    pct >= 75 ? "On Track" : pct >= 40 ? "In Progress" : total === 0 ? "Not Started" : "Delayed",
      };
    });
  }, [subjectList, plans]);

  const loading = subLoading || examLoading || plansLoading;

  const totalTeachers = useMemo(() => {
    const ids = [...new Set(plans.map((p) => (p.teacherId?._id || p.teacherId)?.toString()).filter(Boolean))];
    return ids.length;
  }, [plans]);

  const stats = [
    { title: "Assigned Subjects",       value: subjectList.length,   color: "var(--purple)", icon: <BookOutlined /> },
    { title: "Teachers (Active Plans)", value: totalTeachers,         color: "var(--primary)", icon: <TeamOutlined /> },
    { title: "Assessments This Month",  value: thisMonthExams.length, color: "var(--warning)", icon: <FileTextOutlined /> },
    { title: "Lesson Plans (Total)",    value: plans.length,          color: "var(--success)", icon: <ScheduleOutlined /> },
  ];

  const columns = [
    { title: "Subject",   dataIndex: "subject",   key: "subject" },
    { title: "Teachers",  dataIndex: "teachers",  key: "teachers",  render: (v) => <Tag color="blue">{v}</Tag> },
    { title: "Classes",   dataIndex: "classes",   key: "classes",   render: (v) => <Tag color="cyan">{v}</Tag> },
    { title: "Plans",     dataIndex: "plans",     key: "plans" },
    {
      title: "Syllabus %",
      dataIndex: "syllabus",
      key: "syllabus",
      render: (v) => (
        <Progress
          percent={v}
          size="small"
          strokeColor={v >= 75 ? "var(--success)" : v >= 40 ? "var(--warning)" : "var(--danger)"}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag color={v === "On Track" ? "green" : v === "In Progress" ? "blue" : v === "Delayed" ? "orange" : "default"}>
          {v}
        </Tag>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>Subject Coordinator Dashboard</Title>
            <Text type="secondary">Curriculum oversight — subjects, teachers, syllabus progress, and assessments.</Text>
          </Col>
          <Col>
            <Space>
              <Button onClick={() => navigate("subjects")}>View Subjects</Button>
              <Button type="primary" onClick={() => navigate("assessments")}>Assessments</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {stats.map((s) => (
            <Col xs={24} sm={12} md={6} key={s.title}>
              <Card style={{ borderTop: `4px solid ${s.color}` }}>
                <Statistic
                  title={s.title}
                  value={s.value}
                  prefix={s.icon}
                  valueStyle={{ color: s.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card
            title="Subject Syllabus Progress"
            extra={<Button size="small" onClick={() => navigate("subjects")}>Manage Subjects</Button>}
          >
            <Table
              size="small"
              loading={loading}
              pagination={{ pageSize: 8 }}
              dataSource={subjectProgress}
              columns={columns}
              locale={{ emptyText: "No subjects found for this school" }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card title="Quick Links">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button block onClick={() => navigate("subjects")}>
                  <BookOutlined /> Subject Overview
                </Button>
                <Button block onClick={() => navigate("teachers")}>
                  <TeamOutlined /> Teacher Assignments
                </Button>
                <Button block onClick={() => navigate("classes")}>
                  <ScheduleOutlined /> Class Assignments
                </Button>
                <Button block onClick={() => navigate("assessments")}>
                  <FileTextOutlined /> Assessments
                </Button>
                <Button block onClick={() => navigate("reports")}>
                  <CheckCircleOutlined /> Reports
                </Button>
              </Space>
            </Card>

            <Card title="This Month's Exams">
              {thisMonthExams.length === 0 ? (
                <Text type="secondary">No exams scheduled this month.</Text>
              ) : (
                <Space direction="vertical" style={{ width: "100%" }}>
                  {thisMonthExams.slice(0, 5).map((e) => (
                    <Row key={e._id} justify="space-between" align="middle">
                      <Col>
                        <Text strong style={{ fontSize: 13 }}>{e.title || e.name || "Exam"}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {dayjs(e.examDate).format("DD MMM")}
                        </Text>
                      </Col>
                      <Col>
                        <Tag color={dayjs(e.examDate).isAfter(now) ? "blue" : "green"}>
                          {dayjs(e.examDate).isAfter(now) ? "Upcoming" : "Done"}
                        </Tag>
                      </Col>
                    </Row>
                  ))}
                  {thisMonthExams.length > 5 && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      +{thisMonthExams.length - 5} more
                    </Text>
                  )}
                </Space>
              )}
            </Card>

            <Card title="Lesson Plan Summary">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Row justify="space-between">
                  <Text>Total Plans</Text><Tag>{plans.length}</Tag>
                </Row>
                <Row justify="space-between">
                  <Text>Completed</Text>
                  <Tag color="green">{plans.filter((p) => p.status === "completed").length}</Tag>
                </Row>
                <Row justify="space-between">
                  <Text>Approved</Text>
                  <Tag color="blue">{plans.filter((p) => p.status === "approved").length}</Tag>
                </Row>
                <Row justify="space-between">
                  <Text>Draft</Text>
                  <Tag color="orange">{plans.filter((p) => p.status === "draft").length}</Tag>
                </Row>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </Space>
  );
};

export default SubjectCoordinatorDashboard;
