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

  return (
    <>
      <PageHeader
        title="Inventory & Store"
        subtitle="Manage stock, vendors, purchase orders, and school assets"
        icon={<AppstoreOutlined />}
      />

      <div className="page-wrapper">
        
        <Tabs
          className="inv-tabs"
          defaultActiveKey="stock"
          items={TABS.map(({ key, label, icon, component }) => ({
            key,
            label: (
              <span className="u-row-sm">
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
