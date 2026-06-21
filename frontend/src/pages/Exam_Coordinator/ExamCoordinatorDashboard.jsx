import React from "react";
import { Card, Row, Col, Statistic, Space, Table, Tag, Typography } from "antd";
import {
  FileTextOutlined, QuestionCircleOutlined, CheckCircleOutlined,
  ClockCircleOutlined, ScheduleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

const ExamCoordinatorDashboard = () => {
  const stats = [
    { title: "Upcoming Exams",     value: 5,   color: "#7C3AED", icon: <ScheduleOutlined /> },
    { title: "Questions in Bank",  value: 342, color: "#2563EB", icon: <QuestionCircleOutlined /> },
    { title: "Pending Evaluation", value: 8,   color: "#F59E0B", icon: <ClockCircleOutlined /> },
    { title: "Exams Completed",    value: 12,  color: "#10B981", icon: <CheckCircleOutlined /> },
  ];

  const upcoming = [
    { key: 1, exam: "Mid-Term Mathematics",  class: "10-A, 10-B", date: "2026-06-25", type: "Written"  },
    { key: 2, exam: "Science Unit Test",     class: "8-A",        date: "2026-06-27", type: "Written"  },
    { key: 3, exam: "English Comprehension", class: "9-A, 9-B",   date: "2026-06-30", type: "Written"  },
    { key: 4, exam: "Hindi Oral",            class: "7-A",        date: "2026-07-02", type: "Oral"     },
    { key: 5, exam: "SST Final",             class: "10-A",       date: "2026-07-05", type: "Written"  },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 24 }}>
      <Card>
        <Title level={3} style={{ marginBottom: 4 }}>Exam Coordinator Dashboard</Title>
        <Text type="secondary">Exam operations overview — scheduling, question bank, and evaluation status.</Text>
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

      <Card title="Upcoming Exams">
        <Table
          size="small"
          pagination={false}
          dataSource={upcoming}
          columns={[
            { title: "Exam",       dataIndex: "exam" },
            { title: "Class",      dataIndex: "class" },
            { title: "Date",       dataIndex: "date" },
            { title: "Type",       dataIndex: "type", render: v => <Tag color="purple">{v}</Tag> },
          ]}
        />
      </Card>
    </Space>
  );
};

export default ExamCoordinatorDashboard;
