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
  Button,
  Tag,
  Space,
  Popconfirm,
  Modal,
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
  WalletOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { Form, Select, Switch, message } from "antd";
import { assignSchoolPlan } from "../../../features/superAdminBillingSlice.js";
import { fetchSchools } from "../../../features/schoolSlice";

import PlanForm from "../../../components/forms/PlanForm.jsx";
import PlanLogs from "./PlanLogs.jsx";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  tableContainer, tableHeadCss, modalTitle, emptyState,
} from "../../../styles/pageStyles";

// ─── Plan tier accent colors (by index) ───────────────────────
const TIER_COLORS = [
  { bg: "rgba(219,234,254,0.4)", color: "#2563EB", border: "rgba(219,234,254,0.7)" },
  { bg: "rgba(219,234,254,0.4)", color: "#2563EB", border: "rgba(219,234,254,0.7)" },
  { bg: "rgba(20,184,166,0.15)", color: "#14B8A6", border: "rgba(20,184,166,0.4)" },
  { bg: "rgba(254,243,199,0.4)", color: "#F59E0B", border: "rgba(254,243,199,0.7)" },
];

// ─── Plan Card (Mobile) ───────────────────────────────────────
const PlanCard = ({ plan, index, onEdit, onDelete, onViewLogs }) => {
  const tier = TIER_COLORS[index % TIER_COLORS.length];
  const modules = plan.features?.map((f) => f.module || "").filter(Boolean) || [];
  const displayModules = modules.slice(0, 3);
  const extra = modules.length - 3;

  return (
    <div style={{ ...sectionPanel, marginBottom: 10, padding: 0, overflow: "hidden" }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${tier.color}, ${tier.border})` }} />

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <Space size={8} align="center">
            <div style={iconWell(tier.color, 32)}><CrownOutlined /></div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>{plan.name}</span>
          </Space>
          <Space size={5}>
            <Tooltip title="Edit plan">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(plan)} style={{ borderRadius: 7 }} />
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
                <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 7 }} />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <span style={pill("#B45309", "rgba(254,243,199,0.5)")}>₹{plan.price}</span>
          <span style={pill("#2563EB", "rgba(219,234,254,0.4)")}>{plan.durationInDays} days</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {displayModules.map((mod) => (
            <span key={mod} style={pill("#2563EB", "rgba(219,234,254,0.4)")}>{mod}</span>
          ))}
          {extra > 0 && <span style={pill("#14B8A6", "rgba(20,184,166,0.15)")}>+{extra} more</span>}
        </div>

        <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => onViewLogs(plan._id)} style={{ color: "var(--text-muted)", fontSize: 12, padding: "0 4px" }}>
          View logs
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

  const columns = [
    {
      title: "Plan Name",
      dataIndex: "name",
      render: (name, _, index) => {
        const tier = TIER_COLORS[index % TIER_COLORS.length];
        return (
          <Space size={9} align="center">
            <div style={iconWell(tier.color, 30)}><CrownOutlined /></div>
            <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{name}</span>
          </Space>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      align: "center",
      render: (p) => <span style={pill("#B45309", "rgba(254,243,199,0.5)")}>₹{p}</span>,
    },
    {
      title: "Duration",
      dataIndex: "durationInDays",
      align: "center",
      render: (d) => <span style={pill("#2563EB", "rgba(219,234,254,0.4)")}>{d} days</span>,
    },
    {
      title: "Features",
      dataIndex: "features",
      render: (features) => {
        if (!features?.length) return <span style={{ color: "var(--text-muted)", fontSize: 12 }}>—</span>;
        const modules = features.map((f) => f.module || "").filter(Boolean);
        const first = modules.slice(0, 2);
        const extra = modules.length - 2;
        return (
          <Space size={5} wrap>
            {first.map((mod) => <span key={mod} style={pill("#2563EB", "rgba(219,234,254,0.4)")}>{mod}</span>)}
            {extra > 0 && <span style={pill("#14B8A6", "rgba(20,184,166,0.15)")}>+{extra} more</span>}
          </Space>
        );
      },
    },
    {
      title: "Logs",
      align: "center",
      render: (_, row) => (
        <Tooltip title="View change history">
          <Button type="text" size="small" icon={<HistoryOutlined />} onClick={() => openLogsPopup(row._id)} style={{ color: "var(--text-muted)" }}>
            View logs
          </Button>
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      align: "center",
      render: (_, row) => (
        <Space size={6}>
          <Tooltip title="Edit plan">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(row)}>Edit</Button>
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
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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

      <style>{`
        ${tableHeadCss("plans-tbl")}
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: block !important; }
        }
      `}</style>

      {/* ══ DESKTOP TABLE ══ */}
      <div className="hidden-mobile" style={{ ...sectionPanel, padding: 0 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>All Plans</span>
          <Badge count={plans?.length ?? 0} color="var(--primary)" />
        </div>
        <div className="plans-tbl" style={{ ...tableContainer, border: "none", borderRadius: 0 }}>
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
                  description={<span style={{ color: "var(--text-muted)", fontSize: 13 }}>No subscription plans yet</span>}
                  style={{ padding: "32px 0" }}
                >
                  <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add first plan</Button>
                </Empty>
              ),
            }}
          />
        </div>
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
          <div style={emptyState}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "var(--text-muted)" }}>No plans found</span>}
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>Add first plan</Button>
            </Empty>
          </div>
        )}
      </div>

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
