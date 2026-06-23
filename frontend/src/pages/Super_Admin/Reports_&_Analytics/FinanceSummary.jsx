import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Select,
  Button,
  Spin,
  Empty,
  Table,
} from "antd";
import {
  BankOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import { fetchFinanceSummary } from "../../../features/analyticsSlice";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper,
  toolbarRow,
  statGrid,
  iconWell,
  tableContainer,
  tableHeadCss,
} from "../../../styles/pageStyles";

const TABLE_CLS = "finance-tbl";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

const formatCurrency = (val) => {
  if (val == null) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    background: "var(--surface)",
    border: "1px solid var(--border-muted)",
    borderRadius: 14,
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    boxShadow: "var(--shadow-soft)",
  }}>
    <div style={iconWell(color, 44)}>
      {icon}
    </div>
    <div>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  </div>
);

const FinanceSummary = () => {
  const dispatch = useDispatch();
  const { finance, loading: loadingMap, error } = useSelector((s) => s.analytics || {});
  const loading = loadingMap?.finance || false;

  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  const doFetch = useCallback(
    (year) => {
      const params = {};
      if (year) params.year = year;
      dispatch(fetchFinanceSummary(params));
    },
    [dispatch]
  );

  useEffect(() => {
    doFetch(selectedYear);
  }, [dispatch]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
    doFetch(year);
  };

  const handleRefresh = () => doFetch(selectedYear);

  /* ── Derive stats ── */
  const stats = finance || {};
  const totalIncome   = formatCurrency(stats.totalIncome);
  const paymentCount  = stats.paymentCount  != null ? Number(stats.paymentCount).toLocaleString("en-IN") : "—";
  const totalSchools  = stats.totalSchools  != null ? stats.totalSchools : "—";
  const topSchools    = stats.topSchools    || [];

  /* ── Top schools table ── */
  const schoolColumns = [
    {
      title: "#",
      key: "rank",
      width: 50,
      render: (_, __, i) => (
        <span style={{ fontWeight: 700, color: "var(--text-muted)" }}>{i + 1}</span>
      ),
    },
    {
      title: "School",
      dataIndex: "schoolName",
      render: (n) => <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{n || "—"}</span>,
    },
    {
      title: "Total Collected",
      dataIndex: "totalCollected",
      align: "right",
      render: (v) => <span style={{ color: "var(--success)", fontWeight: 700 }}>{formatCurrency(v)}</span>,
    },
    {
      title: "Transactions",
      dataIndex: "transactions",
      align: "right",
      render: (v) => v != null ? Number(v).toLocaleString("en-IN") : "—",
    },
    {
      title: "Pending",
      dataIndex: "pending",
      align: "right",
      render: (v) => v != null
        ? <span style={{ color: "var(--warning)", fontWeight: 600 }}>{formatCurrency(v)}</span>
        : "—",
    },
  ];

  return (
    <div style={pageWrapper}>
      <style>{tableHeadCss(TABLE_CLS)}</style>

      <PageHeader
        title="Finance Summary"
        subtitle="Overview of income, payments, and financial performance across schools"
        icon={<RupeeIcon />}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
            style={{ borderColor: "var(--border-muted)" }}
          >
            Refresh
          </Button>
        }
      />

      {/* Toolbar */}
      <div style={{ ...toolbarRow, marginTop: 20 }}>
        <Select
          value={selectedYear}
          onChange={handleYearChange}
          style={{ width: 140 }}
        >
          {YEAR_OPTIONS.map((y) => (
            <Select.Option key={y} value={y}>{y}</Select.Option>
          ))}
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "14px 18px",
          background: "var(--danger)10",
          border: "1px solid var(--danger)30",
          borderRadius: 10,
          color: "var(--danger)",
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span>{error}</span>
          <Button size="small" danger onClick={handleRefresh}>Retry</Button>
        </div>
      )}

      <Spin spinning={loading}>
        {/* Stat Cards */}
        <div style={statGrid(180)}>
          <StatCard
            icon={<BankOutlined />}
            label="Total Income"
            value={totalIncome}
            color="var(--success)"
          />
          <StatCard
            icon={<ShoppingCartOutlined />}
            label="Total Payments"
            value={paymentCount}
            color="var(--primary)"
          />
          <StatCard
            icon={<RiseOutlined />}
            label="Schools Covered"
            value={totalSchools}
            color="var(--warning)"
          />
        </div>

        {/* Top Schools Table */}
        {topSchools.length > 0 ? (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            overflow: "hidden",
            marginTop: 8,
          }}>
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid var(--border-muted)",
              fontWeight: 700,
              fontSize: 14,
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
              <span style={iconWell("var(--warning)", 28)}><RiseOutlined /></span>
              Top Performing Schools — {selectedYear}
            </div>
            <div style={tableContainer}>
              <Table
                className={TABLE_CLS}
                rowKey={(r) => r.schoolId || r.schoolName}
                columns={schoolColumns}
                dataSource={topSchools}
                pagination={false}
                scroll={{ x: 600 }}
              />
            </div>
          </div>
        ) : !loading && finance && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "40px 24px",
            textAlign: "center",
            marginTop: 8,
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: "var(--text-muted)" }}>
                  No school-wise breakdown available for {selectedYear}
                </span>
              }
            />
          </div>
        )}

        {/* Empty state when no data at all */}
        {!loading && !finance && !error && (
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border-muted)",
            borderRadius: 14,
            padding: "56px 24px",
            textAlign: "center",
          }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "var(--text-muted)" }}>No finance data available</span>}
            >
              <Button type="primary" onClick={handleRefresh}>Load Data</Button>
            </Empty>
          </div>
        )}
      </Spin>
    </div>
  );
};

export default FinanceSummary;
