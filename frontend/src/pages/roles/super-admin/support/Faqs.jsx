import React, { useState, useMemo } from "react";
import {
  Card,
  Input,
  Tabs,
  Collapse,
  Typography,
  Row,
  Col,
} from "antd";

const { Search } = Input;
const { Panel } = Collapse;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Faqs = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // ===== FAQ DATA =====
  const faqData = {
    general: [
      {
        q: "What is this platform?",
        a: "This is a school management SaaS platform.",
      },
      {
        q: "How to create account?",
        a: "Contact admin to register your school.",
      },
    ],
    billing: [
      {
        q: "How to upgrade plan?",
        a: "Go to billing section and select upgrade.",
      },
      {
        q: "Refund policy?",
        a: "Refund is available within 7 days.",
      },
    ],
    technical: [
      {
        q: "App not loading?",
        a: "Clear cache or contact support.",
      },
      {
        q: "Login issue?",
        a: "Reset password or check credentials.",
      },
    ],
  };

  // ===== FILTERED FAQs =====
  const filteredFaqs = useMemo(() => {
    const list = faqData[activeTab] || [];

    return list.filter((item) =>
      item.q.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeTab]);

  return (
    <div style={{ padding: 24, background: "#f5f6fa", minHeight: "100vh" }}>
      
      {/* HEADER */}
      <Title level={3}>❓ Help & FAQs</Title>
      <Text type="secondary">Find answers to common questions</Text>

      {/* SEARCH */}
      <Card style={{ marginTop: 20, marginBottom: 20 }}>
        <Search
          placeholder="Search your question..."
          allowClear
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Row gutter={16}>
        
        {/* LEFT - TABS */}
        <Col xs={24} md={6}>
          <Card>
            <Tabs
              tabPosition="left"
              activeKey={activeTab}
              onChange={setActiveTab}
            >
              <TabPane tab="General" key="general" />
              <TabPane tab="Billing" key="billing" />
              <TabPane tab="Technical" key="technical" />
            </Tabs>
          </Card>
        </Col>

        {/* RIGHT - FAQ CONTENT */}
        <Col xs={24} md={18}>
          <Card title="FAQs">
            <Collapse accordion>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((item, index) => (
                  <Panel header={item.q} key={index}>
                    <Text>{item.a}</Text>
                  </Panel>
                ))
              ) : (
                <Text>No results found</Text>
              )}
            </Collapse>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Faqs;