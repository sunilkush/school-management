import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchSubscriptionPlans,
  deleteSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  fetchPlanLogs,
} from "../../../features/subscriptionPlanSlice.js";

import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Popconfirm,
  Modal,
  Typography,
  Tooltip,
  Empty,
  Badge,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  BarChartOutlined,
  CheckOutlined,
} from "@ant-design/icons";

import PlanForm from "../../../components/forms/PlanForm.jsx";
import PlanLogs from "./PlanLogs.jsx";

const { Text, Title } = Typography;

// ─── Color tokens (same system) ───────────────────────────────
const C = {
  primary: "#0F6E56",
  primaryLight: "#E1F5EE",
  primaryMid: "#1D9E75",
  primaryBorder: "#9FE1CB",
  surface: "#ffffff",
  bg: "#F4F6F5",
  border: "#E8EDEB",
  text: "#111827",
  textSec: "#6B7280",
  textMuted: "#9CA3AF",
  blue: "#1D4ED8",
  blueLight: "#EFF6FF",
  blueBorder: "#BFDBFE",
  purple: "#6D28D9",
  purpleLight: "#F5F3FF",
  purpleBorder: "#DDD6FE",
  gold: "#B45309",
  goldLight: "#FFFBEB",
  goldBorder: "#FDE68A",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  dangerBorder: "#FECACA",
};

// ─── Plan tier colors by index ────────────────────────────────
const TIER_COLORS = [
  { bg: C.primaryLight, color: C.primary, border: C.primaryBorder },
  { bg: C.blueLight, color: C.blue, border: C.blueBorder },
  { bg: C.purpleLight, color: C.purple, border: C.purpleBorder },
  { bg: C.goldLight, color: C.gold, border: C.goldBorder },
];

// ─── Plan Card (Mobile) ───────────────────────────────────────
const PlanCard = ({ plan, index, onEdit, onDelete, onViewLogs }) => {
  const tier = TIER_COLORS[index % TIER_COLORS.length];
  const modules = plan.features?.map((f) => f.module || "").filter(Boolean) || [];
  const displayModules = modules.slice(0, 3);
  const extra = modules.length - 3;

  return (
    <Card
      style={{
        borderRadius: 14,
        border: `1px solid ${C.border}`,
        background: C.surface,
        marginBottom: 10,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      styles={{ body: { padding: 0 } }}
    >
      {/* Accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tier.color}, ${tier.border})` }} />

      <div style={{ padding: "14px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <Space size={8} align="center">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tier.color,
                fontSize: 15,
              }}
            >
              <CrownOutlined />
            </div>
            <Text strong style={{ fontSize: 15, color: C.text, letterSpacing: "-0.2px" }}>
              {plan.name}
            </Text>
          </Space>
          <Space size={5}>
            <Tooltip title="Edit plan">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(plan)}
                style={{
                  borderRadius: 7,
                  borderColor: C.border,
                  color: C.primary,
                  fontSize: 12,
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this plan?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(plan._id)}
            >
              <Tooltip title="Delete plan">
                <Button
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    borderRadius: 7,
                    borderColor: C.dangerBorder,
                    color: C.danger,
                    background: C.dangerLight,
                  }}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>

        {/* Price + Duration */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <Tag
            icon={<span style={{ marginRight: 3, fontWeight: 700 }}>₹</span>}
            style={{
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              background: C.goldLight,
              color: C.gold,
              border: `1px solid ${C.goldBorder}`,
              padding: "2px 10px",
              margin: 0,
            }}
          >
            {plan.price}
          </Tag>
          <Tag
            icon={<ClockCircleOutlined style={{ fontSize: 10 }} />}
            style={{
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
              background: C.blueLight,
              color: C.blue,
              border: `1px solid ${C.blueBorder}`,
              padding: "2px 10px",
              margin: 0,
            }}
          >
            {plan.durationInDays} days
          </Tag>
        </div>

        {/* Features */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {displayModules.map((mod) => (
            <Tag
              key={mod}
              icon={<CheckOutlined style={{ fontSize: 9 }} />}
              style={{
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: C.primaryLight,
                color: C.primary,
                border: `1px solid ${C.primaryBorder}`,
                padding: "1px 8px",
                margin: 0,
              }}
            >
              {mod}
            </Tag>
          ))}
          {extra > 0 && (
            <Tag
              style={{
                borderRadius: 6,
                fontSize: 11,
                background: C.purpleLight,
                color: C.purple,
                border: `1px solid ${C.purpleBorder}`,
                padding: "1px 8px",
                margin: 0,
              }}
            >
              +{extra} more
            </Tag>
          )}
        </div>

        {/* Logs button */}
        <Button
          type="text"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => onViewLogs(plan._id)}
          style={{ color: C.textSec, fontSize: 12, padding: "0 4px" }}
        >
          View logs
        </Button>
      </div>
    </Card>
  );
};

// ─── Main Component ───────────────────────────────────────────
const SubscriptionPlans = () => {
  const dispatch = useDispatch();
  const { plans, loading } = useSelector((state) => state.subscriptionPlans);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  const openAddModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const openLogsPopup = (id) => {
    setSelectedPlanId(id);
    dispatch(fetchPlanLogs(id));
    setIsLogsOpen(true);
  };

  const handleSubmit = (data) => {
    if (editingPlan) {
      dispatch(updateSubscriptionPlan({ id: editingPlan._id, formData: data }));
    } else {
      dispatch(createSubscriptionPlan(data));
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Plan Name
        </Text>
      ),
      dataIndex: "name",
      render: (name, _, index) => {
        const tier = TIER_COLORS[index % TIER_COLORS.length];
        return (
          <Space size={9} align="center">
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                background: tier.bg,
                border: `1px solid ${tier.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: tier.color,
                fontSize: 13,
              }}
            >
              <CrownOutlined />
            </div>
            <Text strong style={{ fontSize: 13, color: C.text, letterSpacing: "-0.1px" }}>
              {name}
            </Text>
          </Space>
        );
      },
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Price
        </Text>
      ),
      dataIndex: "price",
      align: "center",
      render: (p) => (
        <Tag
          style={{
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            background: C.goldLight,
            color: C.gold,
            border: `1px solid ${C.goldBorder}`,
            padding: "2px 10px",
            margin: 0,
          }}
        >
          ₹{p}
        </Tag>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Duration
        </Text>
      ),
      dataIndex: "durationInDays",
      align: "center",
      render: (d) => (
        <Tag
          icon={<ClockCircleOutlined style={{ fontSize: 10 }} />}
          style={{
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            background: C.blueLight,
            color: C.blue,
            border: `1px solid ${C.blueBorder}`,
            padding: "2px 10px",
            margin: 0,
          }}
        >
          {d} days
        </Tag>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Features
        </Text>
      ),
      dataIndex: "features",
      render: (features) => {
        if (!features?.length) return <Text style={{ color: C.textMuted, fontSize: 12 }}>—</Text>;
        const modules = features.map((f) => f.module || "").filter(Boolean);
        const first = modules.slice(0, 2);
        const extra = modules.length - 2;
        return (
          <Space size={5} wrap>
            {first.map((mod) => (
              <Tag
                key={mod}
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: C.primaryLight,
                  color: C.primary,
                  border: `1px solid ${C.primaryBorder}`,
                  padding: "1px 8px",
                  margin: 0,
                }}
              >
                {mod}
              </Tag>
            ))}
            {extra > 0 && (
              <Tag
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  background: C.purpleLight,
                  color: C.purple,
                  border: `1px solid ${C.purpleBorder}`,
                  padding: "1px 8px",
                  margin: 0,
                }}
              >
                +{extra} more
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Logs
        </Text>
      ),
      align: "center",
      render: (_, row) => (
        <Tooltip title="View change history">
          <Button
            type="text"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => openLogsPopup(row._id)}
            style={{ color: C.textSec, borderRadius: 7, fontSize: 12 }}
          >
            View logs
          </Button>
        </Tooltip>
      ),
    },
    {
      title: (
        <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>
          Actions
        </Text>
      ),
      align: "center",
      render: (_, row) => (
        <Space size={6}>
          <Tooltip title="Edit plan">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(row)}
              style={{
                borderRadius: 7,
                borderColor: C.primaryBorder,
                color: C.primary,
                background: C.primaryLight,
                fontWeight: 500,
                fontSize: 12,
              }}
            >
              Edit
            </Button>
          </Tooltip>
          <Popconfirm
            title="Delete this plan?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => dispatch(deleteSubscriptionPlan(row._id))}
            placement="topRight"
          >
            <Tooltip title="Delete plan">
              <Button
                size="small"
                icon={<DeleteOutlined />}
                style={{
                  borderRadius: 7,
                  borderColor: C.dangerBorder,
                  color: C.danger,
                  background: C.dangerLight,
                }}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, padding: "28px 24px" }}>

      {/* ══ PAGE HEADER ══ */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <Space align="center" size={10} style={{ marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: C.primaryLight,
                border: `1px solid ${C.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppstoreOutlined style={{ color: C.primary, fontSize: 16 }} />
            </div>
            <Title level={3} style={{ margin: 0, color: C.text, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Subscription Plans
            </Title>
          </Space>
          <Text style={{ color: C.textSec, fontSize: 13 }}>
            Manage pricing tiers and feature access for schools
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          size="large"
          style={{
            background: C.primary,
            borderColor: C.primary,
            borderRadius: 10,
            fontWeight: 600,
            height: 40,
            paddingInline: 20,
            boxShadow: "0 2px 8px rgba(15,110,86,0.25)",
          }}
        >
          Add Plan
        </Button>
      </div>

      {/* ══ STATS STRIP ══ */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "Total Plans", value: plans?.length ?? 0, color: C.primary, bg: C.primaryLight, border: C.primaryBorder, icon: <AppstoreOutlined /> },
          { label: "Avg. Price", value: plans?.length ? `₹${Math.round(plans.reduce((s, p) => s + (p.price || 0), 0) / plans.length)}` : "—", color: C.gold, bg: C.goldLight, border: C.goldBorder, icon: <CrownOutlined /> },
          { label: "Avg. Duration", value: plans?.length ? `${Math.round(plans.reduce((s, p) => s + (p.durationInDays || 0), 0) / plans.length)}d` : "—", color: C.blue, bg: C.blueLight, border: C.blueBorder, icon: <ClockCircleOutlined /> },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              flex: "1 1 140px",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: C.surface,
                border: `1px solid ${stat.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: stat.color,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <Text style={{ display: "block", fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, lineHeight: 1.4 }}>
                {stat.label}
              </Text>
              <Text strong style={{ fontSize: 20, color: C.text, letterSpacing: "-0.5px", lineHeight: 1 }}>
                {stat.value}
              </Text>
            </div>
          </div>
        ))}
      </div>

      {/* ══ DESKTOP TABLE ══ */}
      <div style={{ display: "block" }} className="hidden-mobile">
        <Card
          style={{
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            background: C.surface,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: C.text }}>All Plans</Text>
            <Badge
              count={plans?.length ?? 0}
              style={{ background: C.primaryLight, color: C.primary, border: `1px solid ${C.primaryBorder}`, boxShadow: "none", fontWeight: 600 }}
            />
          </div>
          <Table
            columns={columns}
            dataSource={plans}
            loading={loading}
            rowKey="_id"
            pagination={{ pageSize: 10, size: "small" }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={<Text style={{ color: C.textMuted, fontSize: 13 }}>No subscription plans yet</Text>}
                  style={{ padding: "32px 0" }}
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openAddModal}
                    style={{ background: C.primary, borderColor: C.primary, borderRadius: 8 }}
                  >
                    Add first plan
                  </Button>
                </Empty>
              ),
            }}
            onRow={() => ({
              style: { fontSize: 13 },
            })}
          />
        </Card>
      </div>

      {/* ══ MOBILE CARDS ══ */}
      <div className="visible-mobile" style={{ display: "none" }}>
        {plans?.map((plan, index) => (
          <PlanCard
            key={plan._id}
            plan={plan}
            index={index}
            onEdit={openEditModal}
            onDelete={(id) => dispatch(deleteSubscriptionPlan(id))}
            onViewLogs={openLogsPopup}
          />
        ))}
        {!plans?.length && !loading && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text style={{ color: C.textMuted }}>No plans found</Text>}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openAddModal}
              style={{ background: C.primary, borderColor: C.primary, borderRadius: 8 }}
            >
              Add first plan
            </Button>
          </Empty>
        )}
      </div>

      {/* ══ ADD / EDIT MODAL ══ */}
      <Modal
        title={
          <Space align="center" size={10}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.primaryLight,
                border: `1px solid ${C.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {editingPlan ? (
                <EditOutlined style={{ color: C.primary, fontSize: 13 }} />
              ) : (
                <PlusOutlined style={{ color: C.primary, fontSize: 13 }} />
              )}
            </div>
            <Title level={4} style={{ margin: 0, color: C.primary, fontSize: 16 }}>
              {editingPlan ? "Edit Subscription Plan" : "Add New Plan"}
            </Title>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
        styles={{
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
          header: {
            background: C.primaryLight,
            borderBottom: `1px solid ${C.primaryBorder}`,
            borderRadius: "16px 16px 0 0",
            padding: "14px 20px",
            margin: 0,
          },
          body: { padding: 20 },
        }}
      >
        <PlanForm
          initialValues={editingPlan}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      {/* ══ LOGS MODAL ══ */}
      <Modal
        title={
          <Space align="center" size={10}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: C.blueLight,
                border: `1px solid ${C.blueBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HistoryOutlined style={{ color: C.blue, fontSize: 13 }} />
            </div>
            <Title level={4} style={{ margin: 0, color: C.blue, fontSize: 16 }}>
              Plan Update Logs
            </Title>
          </Space>
        }
        width={850}
        open={isLogsOpen}
        onCancel={() => setIsLogsOpen(false)}
        footer={null}
        centered
        styles={{
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
          header: {
            background: C.blueLight,
            borderBottom: `1px solid ${C.blueBorder}`,
            borderRadius: "16px 16px 0 0",
            padding: "14px 20px",
            margin: 0,
          },
          body: { padding: 20 },
        }}
      >
        {selectedPlanId && <PlanLogs planId={selectedPlanId} />}
      </Modal>

      <style>{`
        .ant-table-thead > tr > th {
          background: #F9FAFB !important;
          border-bottom: 1px solid ${C.border} !important;
          padding: 12px 16px !important;
        }
        .ant-table-tbody > tr > td {
          padding: 13px 16px !important;
          border-bottom: 1px solid ${C.border} !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: ${C.primaryLight} !important;
        }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionPlans;