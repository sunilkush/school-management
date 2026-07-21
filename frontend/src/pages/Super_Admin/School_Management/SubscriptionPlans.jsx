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
  Row,
  Col,
  Button,
  Tag,
  Space,
  Popconfirm,
  Modal,
  Tooltip,
  Empty,
  Badge,
  Typography,
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
  WalletOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  BankOutlined,
  PlusCircleFilled,
  MinusCircleFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Form, Select, Switch, message } from "antd";
import { assignSchoolPlan } from "../../../features/superAdminBillingSlice.js";
import { fetchSchools } from "../../../features/schoolSlice";

import PlanForm from "../../../components/forms/PlanForm.jsx";
import PlanLogs from "./PlanLogs.jsx";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, emptyState, modalTitle,
} from "../../../styles/pageStyles";

const { Text } = Typography;

// ─── Plan tier accent colors (by index) ───────────────────────
const TIER_COLORS = [
  { color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  { color: "#14B8A6", bg: "rgba(20,184,166,0.08)" },
  { color: "#F59E0B", bg: "rgba(245,158,11,0.08)" },
  { color: "#8B5CF6", bg: "rgba(139,92,246,0.08)" },
];

const LIMIT_META = [
  { key: "maxStudents", label: "Students", icon: <TeamOutlined /> },
  { key: "maxTeachers", label: "Teachers", icon: <TeamOutlined /> },
  { key: "maxSchools", label: "Schools", icon: <BankOutlined /> },
];

// Full module catalog, same list/order as PlanForm.jsx's moduleOptions — shown
// in full on every card (with a +/- indicator) so a plan's gaps are as visible
// as its inclusions, not just whatever subset happens to be in plan.features.
const ALL_MODULES = [
  "Attendance", "Fees", "Exam", "Online Exam", "Transport",
  "Hostel", "Library", "Payroll", "Reports", "AI Features",
];

// One-line explanation of what each module actually covers — the backend only
// stores a bare module name per feature, so this is presentation-only context
// to answer "what do I actually get" on the pricing card.
const MODULE_DESCRIPTIONS = {
  "Attendance": "Daily attendance for students & staff",
  "Fees": "Fee collection, invoices & payment tracking",
  "Exam": "Exam scheduling, grading & report cards",
  "Online Exam": "Online tests with auto-evaluation",
  "Transport": "Bus routes, vehicles & driver tracking",
  "Hostel": "Room allocation & resident management",
  "Library": "Book catalog, issue & return tracking",
  "Payroll": "Staff salary processing & payslips",
  "Reports": "Academic & administrative analytics",
  "AI Features": "AI-powered insights & automation",
};

// ─── Plan Card ──────────────────────────────────────────────
const PlanCard = ({ plan, index, onEdit, onDelete, onViewLogs }) => {
  const tier = TIER_COLORS[index % TIER_COLORS.length];
  const limits = plan.limits || {};

  const featureMap = {};
  (plan.features || []).forEach((f) => { if (f.module) featureMap[f.module] = f; });
  const includedCount = ALL_MODULES.filter((m) => featureMap[m]?.allowed !== false && featureMap[m]).length;

  return (
    <div
      style={{
        ...sectionPanel,
        padding: 0,
        marginBottom: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}88)` }} />

      <div style={{ padding: "18px 20px 0", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <Space align="start" size={10}>
            <div style={iconWell(tier.color, 40)}><CrownOutlined /></div>
            <div style={{ minWidth: 0 }}>
              <Text strong style={{ display: "block", fontSize: 15, color: "var(--text-primary)", lineHeight: 1.3 }} ellipsis>
                {plan.name}
              </Text>
              <Space size={5} style={{ marginTop: 4 }} wrap>
                <Tag color="default" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>{plan.category || "Starter"}</Tag>
                {plan.isTrialPlan && <Tag color="blue" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>Trial</Tag>}
                {plan.isActive === false && <Tag color="red" style={{ margin: 0, borderRadius: 6, fontSize: 11 }}>Inactive</Tag>}
              </Space>
            </div>
          </Space>

          <Space size={4}>
            <Tooltip title="Edit plan">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(plan)}
                style={{ color: "var(--primary)", borderRadius: 8, flexShrink: 0 }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this plan?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(plan._id)}
              placement="topRight"
            >
              <Tooltip title="Delete plan">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{ color: "var(--text-muted)", borderRadius: 8, flexShrink: 0 }}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 30, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1 }}>
            {plan.price > 0 ? `₹${Number(plan.price).toLocaleString("en-IN")}` : "Free"}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/ {plan.durationInDays} days</span>
        </div>

        {/* Limits strip */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 16, padding: "10px 12px",
          background: "var(--surface-soft)", borderRadius: 10,
        }}>
          {LIMIT_META.map((m) => (
            <div key={m.key} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>
                {limits[m.key] != null ? Number(limits[m.key]).toLocaleString("en-IN") : "—"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Full module list — every module shown, + = included, − = not in this plan */}
        <div style={{ flex: 1, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Modules
            </Text>
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>{includedCount}/{ALL_MODULES.length} included</Text>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {ALL_MODULES.map((mod) => {
              const f = featureMap[mod];
              const included = !!f && f.allowed !== false;
              const moduleLimits = included && f.limits && typeof f.limits === "object" ? Object.entries(f.limits) : [];

              return (
                <div key={mod} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                  {included ? (
                    <PlusCircleFilled style={{ color: "#22C55E", fontSize: 13, marginTop: 2, flexShrink: 0 }} />
                  ) : (
                    <MinusCircleFilled style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2, flexShrink: 0, opacity: 0.6 }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text style={{
                        fontSize: 12.5, fontWeight: 600,
                        color: included ? "var(--text-primary)" : "var(--text-muted)",
                      }}>
                        {mod}
                      </Text>
                      {moduleLimits.map(([k, v]) => (
                        <Tag key={k} style={{ margin: 0, fontSize: 10, borderRadius: 5, lineHeight: "16px", padding: "0 6px" }}>
                          {k}: {v}
                        </Tag>
                      ))}
                    </div>
                    {included && MODULE_DESCRIPTIONS[mod] && (
                      <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {MODULE_DESCRIPTIONS[mod]}
                      </Text>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: "10px 20px 14px",
          marginTop: "auto",
          background: "var(--surface-soft)",
          borderTop: "1px solid var(--border-muted)",
        }}
      >
        <Button
          type="text"
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => onViewLogs(plan._id)}
          style={{ color: "var(--text-muted)", fontSize: 12, padding: "0 4px" }}
        >
          View change logs
        </Button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
const SubscriptionPlans = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { plans, loading } = useSelector((state) => state.subscriptionPlans);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignForm] = Form.useForm();
  const { schools } = useSelector((state) => state.school);

  useEffect(() => {
    dispatch(fetchSubscriptionPlans());
    dispatch(fetchSchools());
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

  const handleAssignPlan = async () => {
    try {
      const values = await assignForm.validateFields();
      setAssignLoading(true);
      await dispatch(
        assignSchoolPlan({
          schoolId: values.schoolId,
          payload: {
            planId: values.planId,
            isTrial: values.isTrial || false,
          },
        })
      ).unwrap();
      message.success("Plan assigned successfully");
      setAssignOpen(false);
      assignForm.resetFields();
    } catch (error) {
      message.error(error || "Failed to assign plan");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Subscription Plans"
        subtitle="Manage pricing tiers and feature access for schools"
        icon={<AppstoreOutlined />}
        extra={
          <Space wrap>
            <Button icon={<WalletOutlined />} onClick={() => navigate("/dashboard/superadmin/payments")}>Payments</Button>
            <Button icon={<BarChartOutlined />} onClick={() => navigate("/dashboard/superadmin/revenue")}>Revenue</Button>
            <Button onClick={() => setAssignOpen(true)}>Assign Plan</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add Plan</Button>
          </Space>
        }
      />

      <div style={{ ...statGrid(160), marginTop: 20 }}>
        {[
          { label: "Total Plans", value: plans?.length ?? 0, color: "#2563EB", icon: <AppstoreOutlined /> },
          { label: "Avg. Price", value: plans?.length ? `₹${Math.round(plans.reduce((s, p) => s + (p.price || 0), 0) / plans.length)}` : "—", color: "#F59E0B", icon: <CrownOutlined /> },
          { label: "Avg. Duration", value: plans?.length ? `${Math.round(plans.reduce((s, p) => s + (p.durationInDays || 0), 0) / plans.length)}d` : "—", color: "#14B8A6", icon: <ClockCircleOutlined /> },
        ].map((stat) => (
          <div key={stat.label} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, marginBottom: 0 }}>
            <div style={iconWell(stat.color, 38)}>{stat.icon}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ HEADER ROW ══ */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <ThunderboltOutlined style={{ color: "var(--primary)" }} />
        <Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>All Plans</Text>
        <Badge count={plans?.length ?? 0} color="var(--primary)" showZero />
      </div>

      {/* ══ PLAN CARDS ══ */}
      {loading && !plans?.length ? (
        <div style={{ ...statGrid(280) }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ ...sectionPanel, height: 320, background: "var(--surface-soft)" }} />
          ))}
        </div>
      ) : !plans?.length ? (
        <div style={emptyState}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span style={{ color: "var(--text-muted)" }}>No subscription plans yet</span>}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add first plan</Button>
          </Empty>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {plans.map((plan, index) => (
            <Col key={plan._id} xs={24} sm={12} lg={8} xl={6}>
              <PlanCard
                plan={plan}
                index={index}
                onEdit={openEditModal}
                onDelete={(id) => dispatch(deleteSubscriptionPlan(id))}
                onViewLogs={openLogsPopup}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* ══ ADD / EDIT MODAL ══ */}
      <Modal
        title={modalTitle(editingPlan ? <EditOutlined /> : <PlusOutlined />, editingPlan ? "Edit Subscription Plan" : "Add New Plan")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        centered
      >
        <PlanForm
          initialValues={editingPlan}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleSubmit}
        />
      </Modal>

      <Modal
        title="Assign plan to school"
        open={assignOpen}
        onCancel={() => setAssignOpen(false)}
        onOk={handleAssignPlan}
        confirmLoading={assignLoading}
      >
        <Form layout="vertical" form={assignForm}>
          <Form.Item name="schoolId" label="School" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(schools || []).map((school) => ({
                label: school.name,
                value: school._id,
              }))}
            />
          </Form.Item>
          <Form.Item name="planId" label="Subscription Plan" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(plans || [])
                .filter((plan) => plan.isActive !== false)
                .map((plan) => ({ label: `${plan.name} (₹${plan.price})`, value: plan._id }))}
            />
          </Form.Item>
          <Form.Item name="isTrial" label="Start as trial" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ LOGS MODAL ══ */}
      <Modal
        title={modalTitle(<HistoryOutlined />, "Plan Update Logs")}
        width={850}
        open={isLogsOpen}
        onCancel={() => setIsLogsOpen(false)}
        footer={null}
        centered
      >
        {selectedPlanId && <PlanLogs planId={selectedPlanId} />}
      </Modal>
    </div>
  );
};

export default SubscriptionPlans;
