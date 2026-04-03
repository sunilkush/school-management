/* eslint-disable no-unused-vars */
import React, { useState, useMemo } from "react";
import {
  Layout,
  Menu,
  Input,
  Typography,
  Card,
} from "antd";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;
const { Search } = Input;

const Documentation = () => {
  const [activeKey, setActiveKey] = useState("intro");
  const [search, setSearch] = useState("");

  // ===== DOC DATA =====
  const docs = {
    intro: {
      title: "Introduction",
      content: "Welcome to our School Management SaaS platform. This guide helps you understand features and usage.",
    },
    gettingStarted: {
      title: "Getting Started",
      content: "Create your school, add classes, assign teachers, and manage students easily.",
    },
    subjects: {
      title: "Subjects Management",
      content: "You can create subjects, assign teachers, and manage marks structure.",
    },
    chapters: {
      title: "Chapters & Topics",
      content: "Create chapters, assign them to subjects and classes with full hierarchy.",
    },
    billing: {
      title: "Billing & Subscription",
      content: "Manage subscription plans, invoices, and payments.",
    },
    api: {
      title: "API Documentation",
      content: "Use our REST APIs: /auth, /users, /subjects, /classes, /chapters",
    },
  };

  // ===== FILTER MENU =====
  const filteredMenu = useMemo(() => {
    return Object.entries(docs).filter(([key, value]) =>
      value.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f6fa" }}>
      
      {/* SIDEBAR */}
      <Sider width={260} style={{ background: "#fff", padding: 16 }}>
        <Search
          placeholder="Search docs..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={(e) => setActiveKey(e.key)}
        >
          {filteredMenu.map(([key, item]) => (
            <Menu.Item key={key}>{item.title}</Menu.Item>
          ))}
        </Menu>
      </Sider>

      {/* CONTENT */}
      <Layout>
        <Content style={{ padding: 24 }}>
          <Card style={{ borderRadius: 12 }}>
            <Title level={3}>{docs[activeKey].title}</Title>
            <Paragraph>{docs[activeKey].content}</Paragraph>

            {/* EXTRA UI */}
            <div style={{ marginTop: 30 }}>
              <Title level={5}>💡 Tips</Title>
              <Paragraph>
                Use proper role-based access and keep your data secure.
              </Paragraph>

              <Title level={5}>⚡ Example</Title>
              <Paragraph code>
                GET /api/subjects <br />
                POST /api/classes
              </Paragraph>
            </div>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
};

export default Documentation;