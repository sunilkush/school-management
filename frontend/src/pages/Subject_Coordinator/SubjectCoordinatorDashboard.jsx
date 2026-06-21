import React from "react";
import { Card, Row, Col, Statistic, Space, Table, Tag, Progress, Typography } from "antd";
import {
  BookOutlined, TeamOutlined, FileTextOutlined, ScheduleOutlined, CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const SubjectCoordinatorDashboard = () => {
  const stats = [
    { title: "Assigned Subjects",  value: 4,  color: "#7C3AED", icon: <BookOutlined /> },
    { title: "Teachers Under Me",  value: 9,  color: "#2563EB", icon: <TeamOutlined /> },
    { title: "Classes Managed",    value: 12, color: "#10B981", icon: <ScheduleOutlined /> },
    { title: "Assessments This Month", value: 6, color: "#F59E0B", icon: <FileTextOutlined /> },
  ];

  const subjects = [
    { key: 1, subject: "Mathematics", teachers: 3, classes: 4, syllabus: 78, status: "On Track"  },
    { key: 2, subject: "Science",     teachers: 2, classes: 3, syllabus: 65, status: "On Track"  },
    { key: 3, subject: "English",     teachers: 2, classes: 3, syllabus: 55, status: "Delayed"   },
    { key: 4, subject: "SST",         teachers: 2, classes: 2, syllabus: 82, status: "On Track"  },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Subject Coordinator Dashboard</Title>
        <Text type="secondary">Curriculum oversight — subjects, teachers, syllabus progress, and assessments.</Text>
      </Card>

      <Row gutter={[16, 16]}>
        {stats.map(s => (
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

      <Card title="Subject Syllabus Progress">
        <Table
          size="small"
          pagination={false}
          dataSource={subjects}
          columns={[
            { title: "Subject",   dataIndex: "subject" },
            { title: "Teachers",  dataIndex: "teachers" },
            { title: "Classes",   dataIndex: "classes" },
            { title: "Syllabus",  dataIndex: "syllabus",
              render: v => <Progress percent={v} size="small" strokeColor={v >= 75 ? "#10B981" : v >= 60 ? "#F59E0B" : "#EF4444"} /> },
            { title: "Status",    dataIndex: "status",
              render: v => <Tag color={v === "On Track" ? "green" : "orange"}>{v}</Tag> },
          ]}
        />
      </Card>
    </Space>
  );
};

export default SubjectCoordinatorDashboard;
