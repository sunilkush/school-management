import React, { lazy, Suspense, useState } from "react";
import { Card, Tabs, Spin, Steps } from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { TabPane } = Tabs;

// Lazy load
const SchoolClass = lazy(() => import("./SchoolClass.jsx"));
const SchoolBoard = lazy(() => import("./SchoolBoard.jsx"));
const SchoolAcadmicYear = lazy(() => import("./SchoolAcadmicYear.jsx"));
const SchoolClassSubject = lazy(() => import("./SchoolClassSubject.jsx"));

const Loader = () => (
  <div style={{ textAlign: "center", padding: 60 }}>
    <Spin size="large" />
  </div>
);

const SchoolSetup = () => {
  const [activeKey, setActiveKey] = useState("1");

  const steps = [
    { title: "Academic Year" },
    { title: "Boards" },
    { title: "Classes" },
    { title: "Subjects" },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h2>🏫 School Setup</h2>

        {/* ✅ Steps */}
        <Steps
          current={parseInt(activeKey) - 1}
          items={steps}
          style={{ marginBottom: 24 }}
        />

        {/* ✅ Tabs */}
        <Tabs activeKey={activeKey} onChange={setActiveKey}>
          <TabPane
            tab={<span><CalendarOutlined /> Academic Year</span>}
            key="1"
          >
            <Suspense fallback={<Loader />}>
              <SchoolAcadmicYear next={() => setActiveKey("2")} />
            </Suspense>
          </TabPane>

          <TabPane
            tab={<span><ApartmentOutlined /> Boards</span>}
            key="2"
          >
            <Suspense fallback={<Loader />}>
              <SchoolBoard next={() => setActiveKey("3")} />
            </Suspense>
          </TabPane>

          <TabPane
            tab={<span><AppstoreOutlined /> Classes</span>}
            key="3"
          >
            <Suspense fallback={<Loader />}>
              <SchoolClass next={() => setActiveKey("4")} />
            </Suspense>
          </TabPane>

          <TabPane
            tab={<span><PlusOutlined /> Subjects</span>}
            key="4"
          >
            <Suspense fallback={<Loader />}>
              <SchoolClassSubject />
            </Suspense>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SchoolSetup;