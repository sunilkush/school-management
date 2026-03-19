import React, { lazy, Suspense } from "react";
import { Card, Tabs, Spin } from "antd";
import {
  AppstoreOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  PlusOutlined,
} from "@ant-design/icons";

const { TabPane } = Tabs;

// 🔥 Lazy Imports
const SchoolClass = lazy(() => import("./SchoolClass.jsx"));
const SchoolBoard = lazy(() => import("./SchoolBoard.jsx"));
const SchoolAcadmicYear = lazy(() => import("./SchoolAcadmicYear.jsx"));
const SchoolClassSubject = lazy(()=>import("./SchoolClassSubject.jsx"));

// 🔹 Loader UI
const Loader = () => (
  <div style={{ textAlign: "center", padding: "60px 0" }}>
    <Spin size="large" />
  </div>
);

const SchoolSetup = () => {
  return (
    <div style={{ padding: 16, margin: "auto" }}>
      
      {/* 🔹 Main Card */}
      <Card
        bordered={false}
        style={{
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h2 style={{ marginBottom: 20 }}>🏫 School Setup</h2>

        {/* 🔹 Tabs */}
        <Tabs
          defaultActiveKey="1"
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          {/* Academic Year */}
          <TabPane
            tab={
              <span>
                <CalendarOutlined /> Academic Year
              </span>
            }
            key="1"
          >
            <Suspense fallback={<Loader />}>
              <SchoolAcadmicYear />
            </Suspense>
          </TabPane>

          {/* Boards */}
          <TabPane
            tab={
              <span>
                <ApartmentOutlined /> Boards
              </span>
            }
            key="2"
          >
            <Suspense fallback={<Loader />}>
              <SchoolBoard />
            </Suspense>
          </TabPane>

          {/* Classes */}
          <TabPane
            tab={
              <span>
                <AppstoreOutlined /> Classes & Sections
              </span>
            }
            key="3"
          >
            <Suspense fallback={<Loader />}>
              <SchoolClass />
            </Suspense>
          </TabPane>
          {/* class subject maping */}
          <TabPane
              tab={
                <span>
                <PlusOutlined /> Classes & Subjects
              </span>
              }
          >
            <Suspense>
                <SchoolClassSubject/>
            </Suspense>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SchoolSetup;