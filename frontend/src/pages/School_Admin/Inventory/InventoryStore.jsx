import React, { Suspense, lazy } from "react";
import { Tabs, Skeleton } from "antd";
import {
  AppstoreOutlined,
  ShopOutlined,
  FileTextOutlined,
  ExportOutlined,
  ImportOutlined,
  DesktopOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper } from "../../../styles/pageStyles";
import { useTheme } from "../../../context/ThemeContext";

const StockPage           = lazy(() => import("./StockPage"));
const VendorPage          = lazy(() => import("./VendorPage"));
const PurchaseOrderPage   = lazy(() => import("./PurchaseOrderPage"));
const IssuePage           = lazy(() => import("./IssuePage"));
const ReturnPage          = lazy(() => import("./ReturnPage"));
const AssetManagementPage = lazy(() => import("./AssetManagementPage"));
const AMCTrackingPage     = lazy(() => import("./AMCTrackingPage"));

const TabLoader = () => (
  <div style={{ padding: "24px 0" }}>
    <Skeleton active paragraph={{ rows: 4 }} />
  </div>
);

const TABS = [
  { key: "stock",   label: "Stock",           icon: <AppstoreOutlined />, component: <StockPage /> },
  { key: "vendor",  label: "Vendors",          icon: <ShopOutlined />,     component: <VendorPage /> },
  { key: "po",      label: "Purchase Orders",  icon: <FileTextOutlined />, component: <PurchaseOrderPage /> },
  { key: "issue",   label: "Issue",            icon: <ExportOutlined />,   component: <IssuePage /> },
  { key: "return",  label: "Return",           icon: <ImportOutlined />,   component: <ReturnPage /> },
  { key: "assets",  label: "Assets",           icon: <DesktopOutlined />,  component: <AssetManagementPage /> },
  { key: "amc",     label: "AMC Tracking",     icon: <ToolOutlined />,     component: <AMCTrackingPage /> },
];

export default function InventoryStore() {
  const { isDark } = useTheme();

  return (
    <>
      <PageHeader
        title="Inventory & Store"
        subtitle="Manage stock, vendors, purchase orders, and school assets"
        icon={<AppstoreOutlined />}
      />

      <div style={pageWrapper}>
        <style>{`
          .inv-tabs .ant-tabs-nav {
            margin-bottom: 20px !important;
          }
          .inv-tabs .ant-tabs-tab {
            font-size: 13px !important;
            padding: 8px 16px !important;
            gap: 6px;
            color: var(--text-muted) !important;
          }
          .inv-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--primary) !important;
            font-weight: 600 !important;
          }
          .inv-tabs .ant-tabs-ink-bar {
            background: var(--primary) !important;
          }
          .inv-tabs .ant-tabs-nav::before {
            border-color: var(--border-muted) !important;
          }
          @keyframes invFadeUp {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .inv-tab-content {
            animation: invFadeUp 0.25s ease both;
          }
        `}</style>

        <Tabs
          className="inv-tabs"
          defaultActiveKey="stock"
          items={TABS.map(({ key, label, icon, component }) => ({
            key,
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {icon}
                {label}
              </span>
            ),
            children: (
              <div className="inv-tab-content">
                <Suspense fallback={<TabLoader />}>{component}</Suspense>
              </div>
            ),
          }))}
        />
      </div>
    </>
  );
}
