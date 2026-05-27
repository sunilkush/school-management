import React, { useState, useMemo } from "react";
import {
  Layout,
  Menu,
  Input,
  Typography,
  Card,
  Divider,
  List,
} from "antd";

const { Sider, Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

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
  payrollGuide: {
    title: "Payroll Module Guide (Super Admin & Accountant)",
    content:
      "Payroll module me month-wise salary cycle run hota hai: pehle structure set karein, phir monthly run generate karein, cycle lock karein, payment mark karein aur payslip/report nikalein.",
    stepsByRole: [
      {
        role: "Super Admin (Control & Audit)",
        steps: [
          "Login karein aur School Management > School List se school ki basic setup readiness verify karein (employees, designations, departments).",
          "Modules section me ensure karein ki Payroll module active ho.",
          "Roles & Permissions me Accountant/School Admin ko payroll actions ka access verify karein (monthly run, lock, pay, payslip, reports).",
          "Support/Documentation aur audit policies share karein taaki payroll cycle standard process follow ho.",
          "Month close ke baad Reports & Analytics / audit screens se payroll summary aur process compliance review karein.",
        ],
      },
      {
        role: "Accountant (Daily Operations)",
        steps: [
          "Sidebar me Payroll > Salary Structures open karein.",
          "Har employee/role ke liye earnings (basic, allowances) aur deductions (PF, tax, advance) configure karein.",
          "Payroll > Monthly Run par jaake month select karein aur cycle generate karein.",
          "Generated entries verify karein: gross pay, deductions, net pay. Kisi mismatch par structure update karke cycle refresh karein.",
          "Final verification ke baad cycle lock karein, phir payment mode (bank/cash/reference) ke saath Mark as Paid karein.",
          "Payroll > Payslips me employee + month select karke preview/print karein.",
          "Payroll > Monthly Reports se salary expense summary export/download karein for records.",
        ],
      },
    ],
    checklist: [
      "Cycle generate se pehle salary structure update hona chahiye.",
      "Lock ke baad changes avoid karein; correction ho to controlled re-run process use karein.",
      "Payment mark karne se pehle net pay aur employee mapping cross-check karein.",
      "Har month ka report aur payslip archive maintain karein (audit ke liye).",
    ],
  },
  api: {
    title: "API Documentation",
    content: "Use our REST APIs: /auth, /users, /subjects, /classes, /chapters",
  },
};

const Documentation = () => {
  const [activeKey, setActiveKey] = useState("intro");
  const [search, setSearch] = useState("");

  // ===== FILTER MENU =====
  const filteredMenu = useMemo(() => {
    // eslint-disable-next-line no-unused-vars
    return Object.entries(docs).filter(([key, value]) =>
      value.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <Layout className="docs-layout-shell">
      
      {/* SIDEBAR */}
      <Sider width={260} className="docs-sider">
        <Search
          placeholder="Search docs..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
          className="docs-search"
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
        <Content className="docs-content">
          <Card className="docs-main-card">
            <Title level={3}>{docs[activeKey].title}</Title>
            <Paragraph>{docs[activeKey].content}</Paragraph>

            {docs[activeKey].stepsByRole?.map((section) => (
              <div key={section.role} className="docs-role-section">
                <Title level={5}>{section.role}</Title>
                <List
                  size="small"
                  bordered
                  dataSource={section.steps}
                  renderItem={(item, index) => (
                    <List.Item>
                      <Text strong>Step {index + 1}:</Text>&nbsp;{item}
                    </List.Item>
                  )}
                />
              </div>
            ))}

            {docs[activeKey].checklist?.length ? (
              <>
                <Divider />
                <Title level={5}>Checklist (Before closing payroll month)</Title>
                <List
                  size="small"
                  dataSource={docs[activeKey].checklist}
                  renderItem={(item) => <List.Item>✅ {item}</List.Item>}
                />
              </>
            ) : null}

            {/* EXTRA UI */}
            <div className="docs-extra">
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
