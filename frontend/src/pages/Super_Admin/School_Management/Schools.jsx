import React, { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools, deleteSchool } from "../../../features/schoolSlice";
import { fetchSubscriptionPlans } from "../../../features/subscriptionPlanSlice";
import {
  fetchSchoolSubscription, renewSchoolSubscription,
  cancelSchoolSubscription, suspendSchoolSubscription,
  reactivateSchoolSubscription, changeSchoolPlan,
  clearBillingMessages,
} from "../../../features/superAdminBillingSlice";
import AddSchoolForm from "../../../components/forms/AddSchoolForm";
import apiClient from "../../../api/httpClient";
import {
  Button,
  Modal,
  Spin,
  Tag,
  Empty,
  Popconfirm,
  message,
  Typography,
  Space,
  Input,
  Row,
  Col,
  Statistic,
  Segmented,
  Tooltip,
  Badge,
  Divider,
  Card,
  Form,
  Select,
  Pagination,
  Drawer,
  Alert,
  Descriptions,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
  SearchOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  CrownOutlined,
  BookOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  TeamOutlined,
  ApartmentOutlined,
  EditOutlined,
  ReloadOutlined,
  StopOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SwapOutlined,
  SettingOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";


const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// ─── Color tokens ──────────────────────────────────────────────────────────────
const COLOR = {
  primary: "#2563EB",
  primaryLight: "#DBEAFE",
  primaryMid: "#2563EB",
  primaryBorder: "#DBEAFE",
  surface: "#ffffff",
  bg: "#F8FAFC",
  border: "rgba(219,234,254,0.35)",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  danger: "#EF4444",
  dangerLight: "rgba(254,226,226,0.2)",
  dangerBorder: "rgba(254,226,226,0.5)",
  gold: "#F59E0B",
  goldLight: "rgba(254,243,199,0.25)",
  blue: "#2563EB",
  blueLight: "#DBEAFE",
  purple: "#14B8A6",
  purpleLight: "rgba(20,184,166,0.2)",
};

// ─── SchoolCard ────────────────────────────────────────────────────────────────
const SchoolCard = ({ school, onDelete, onEdit, onManageSub }) => {
  const dateStr = school.createdAt
    ? new Date(school.createdAt).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <Card
      hoverable
      style={{
        borderRadius: 16,
        border: `1px solid ${COLOR.border}`,
        background: COLOR.surface,
        height: "100%",
        overflow: "hidden",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        },
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.12)";
        e.currentTarget.style.borderColor = COLOR.primaryBorder;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
        e.currentTarget.style.borderColor = COLOR.border;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* ── TOP ACCENT BAR ── */}
      <div
        style={{
          height: 4,
          background: school.isActive
            ? `linear-gradient(90deg, ${COLOR.primaryMid}, ${COLOR.primaryBorder})`
            : `linear-gradient(90deg, #D1D5DB, #E5E7EB)`,
          borderRadius: "16px 16px 0 0",
        }}
      />

      {/* ── CARD BODY ── */}
      <div style={{ padding: "16px 18px 0", flex: 1 }}>

        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <Space align="start" size={10}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: COLOR.primaryLight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: `1px solid ${COLOR.primaryBorder}`,
              }}
            >
              <BankOutlined style={{ color: COLOR.primary, fontSize: 18 }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <Text
                strong
                style={{
                  display: "block",
                  fontSize: 14,
                  color: COLOR.textPrimary,
                  lineHeight: 1.3,
                  letterSpacing: "-0.2px",
                }}
                ellipsis
              >
                {school.name}
              </Text>
              <Space size={4} style={{ marginTop: 2 }}>
                <EnvironmentOutlined style={{ color: COLOR.textMuted, fontSize: 11 }} />
                <Text
                  style={{ fontSize: 11, color: COLOR.textSecondary }}
                  ellipsis
                >
                  {school.address || "No address provided"}
                </Text>
              </Space>
            </div>
          </Space>

          <Space size={4}>
            <Tooltip title="Edit school">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(school)}
                style={{
                  color: COLOR.primary,
                  borderRadius: 8,
                  flexShrink: 0,
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete this school?"
              description="This action cannot be undone."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(school._id)}
              placement="topRight"
            >
              <Tooltip title="Delete school">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  style={{
                    color: COLOR.textMuted,
                    borderRadius: 8,
                    flexShrink: 0,
                  }}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>

        <Divider style={{ margin: "10px 0", borderColor: COLOR.border }} />

        {/* Boards */}
        <div style={{ marginBottom: 10 }}>
          <Space size={6} align="center" style={{ marginBottom: 6 }}>
            <BookOutlined style={{ fontSize: 11, color: COLOR.textMuted }} />
            <Text style={{ fontSize: 11, color: COLOR.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              Boards
            </Text>
          </Space>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {school.boards?.length ? (
              school.boards.map((board) => (
                <Tag
                  key={board._id}
                  style={{
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    background: COLOR.blueLight,
                    color: COLOR.blue,
                    border: "1px solid rgba(219,234,254,0.5)",
                    margin: 0,
                    padding: "1px 8px",
                  }}
                >
                  {board.name}
                </Tag>
              ))
            ) : (
              <Text style={{ fontSize: 11, color: COLOR.textMuted }}>—</Text>
            )}
          </div>
        </div>

        {/* Subscription Plan */}
        <div style={{ marginBottom: 10 }}>
          <Space size={6} align="center" style={{ marginBottom: 6 }}>
            <CrownOutlined style={{ fontSize: 11, color: COLOR.textMuted }} />
            <Text style={{ fontSize: 11, color: COLOR.textMuted, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              Plan
            </Text>
          </Space>
          {school.subscriptionPlan ? (
            <Space size={5} wrap>
              <Tag
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: COLOR.purpleLight,
                  color: COLOR.purple,
                  border: "1px solid #DDD6FE",
                  margin: 0,
                  padding: "1px 8px",
                }}
              >
                {school.subscriptionPlan.name}
              </Tag>
              <Tag
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: COLOR.goldLight,
                  color: COLOR.gold,
                  border: "1px solid #FDE68A",
                  margin: 0,
                  padding: "1px 8px",
                }}
              >
                ₹{school.subscriptionPlan.price}
              </Tag>
              <Tag
                style={{
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  background: COLOR.primaryLight,
                  color: COLOR.primary,
                  border: `1px solid ${COLOR.primaryBorder}`,
                  margin: 0,
                  padding: "1px 8px",
                }}
              >
                {school.subscriptionPlan.durationInDays}d
              </Tag>
            </Space>
          ) : (
            <Text style={{ fontSize: 11, color: COLOR.textMuted }}>No plan assigned</Text>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: "10px 18px 14px",
          marginTop: "auto",
          background: "#FAFAFA",
          borderTop: `1px solid ${COLOR.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size={6} align="center">
          {school.isActive ? (
            <CheckCircleFilled style={{ color: COLOR.primaryMid, fontSize: 13 }} />
          ) : (
            <CloseCircleFilled style={{ color: "#EF4444", fontSize: 13 }} />
          )}
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: school.isActive ? COLOR.primary : "#EF4444",
            }}
          >
            {school.isActive ? "Active" : "Inactive"}
          </Text>
        </Space>

        <Space size={4}>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => onManageSub(school)}
            style={{
              fontSize: 11, borderRadius: 7, height: 26,
              borderColor: COLOR.primaryBorder, color: COLOR.primary,
              background: COLOR.primaryLight,
            }}
          >
            Manage Subscription
          </Button>
        </Space>
      </div>
    </Card>
  );
};

// ─── Schools Page ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 9;

const STATUS_COLOR = {
  active:    { color: "#15803D", bg: "#DCFCE7", border: "#86EFAC" },
  trial:     { color: "#1D4ED8", bg: "#DBEAFE", border: "#93C5FD" },
  expired:   { color: "#DC2626", bg: "#FEE2E2", border: "#FCA5A5" },
  suspended: { color: "#D97706", bg: "#FEF3C7", border: "#FCD34D" },
  cancelled: { color: "#64748B", bg: "#F1F5F9", border: "#CBD5E1" },
};

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const { plans = [] } = useSelector((state) => state.subscriptionPlans);
  const { schoolSubscription, actionLoading, successMessage, error: billingError } =
    useSelector((state) => state.superAdminBilling);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm] = Form.useForm();

  // Subscription drawer state
  const [subDrawerOpen, setSubDrawerOpen] = useState(false);
  const [subSchool, setSubSchool] = useState(null);
  const [changePlanId, setChangePlanId] = useState(null);
  const [changePlanAction, setChangePlanAction] = useState("upgrade");

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchSubscriptionPlans());
  }, [dispatch]);

  // Show billing success/error messages
  useEffect(() => {
    if (successMessage) {
      message.success(successMessage);
      dispatch(clearBillingMessages());
    }
    if (billingError) {
      message.error(billingError);
      dispatch(clearBillingMessages());
    }
  }, [successMessage, billingError, dispatch]);

  const handleManageSub = useCallback((school) => {
    setSubSchool(school);
    setSubDrawerOpen(true);
    dispatch(fetchSchoolSubscription(school._id));
  }, [dispatch]);

  const handleSubDrawerClose = useCallback(() => {
    setSubDrawerOpen(false);
    setSubSchool(null);
    setChangePlanId(null);
  }, []);

  const handleRenew = useCallback(async () => {
    if (!subSchool?._id) return;
    await dispatch(renewSchoolSubscription(subSchool._id));
    dispatch(fetchSchools());
  }, [subSchool, dispatch]);

  const handleSuspend = useCallback(async () => {
    if (!subSchool?._id) return;
    await dispatch(suspendSchoolSubscription(subSchool._id));
    dispatch(fetchSchools());
  }, [subSchool, dispatch]);

  const handleReactivate = useCallback(async () => {
    if (!subSchool?._id) return;
    await dispatch(reactivateSchoolSubscription(subSchool._id));
    dispatch(fetchSchools());
  }, [subSchool, dispatch]);

  const handleCancel = useCallback(async () => {
    if (!subSchool?._id) return;
    await dispatch(cancelSchoolSubscription(subSchool._id));
    dispatch(fetchSchools());
  }, [subSchool, dispatch]);

  const handleChangePlan = useCallback(async () => {
    if (!subSchool?._id || !changePlanId) return;
    await dispatch(changeSchoolPlan({ schoolId: subSchool._id, planId: changePlanId, action: changePlanAction }));
    dispatch(fetchSchools());
  }, [subSchool, changePlanId, changePlanAction, dispatch]);

  const handleDeleteSchool = useCallback(
    async (id) => {
      try {
        await dispatch(deleteSchool(id)).unwrap();
        message.success("School deleted successfully");
        dispatch(fetchSchools());
      } catch (err) {
        message.error(typeof err === "string" ? err : "Failed to delete school");
      }
    },
    [dispatch]
  );

  const handleOpenEdit = useCallback((school) => {
    setEditingSchool(school);
    editForm.setFieldsValue({
      name: school.name || "",
      address: school.address || "",
      email: school.email || "",
      phone: school.phone || "",
      website: school.website || "",
      isActive: school.isActive ? "active" : "inactive",
    });
    setEditModalOpen(true);
  }, [editForm]);

  const handleCloseEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingSchool(null);
    editForm.resetFields();
  }, [editForm]);

  const handleEditSubmit = useCallback(async (values) => {
    if (!editingSchool?._id) return;
    try {
      setEditSaving(true);
      const payload = {
        ...values,
        isActive: values.isActive === "active",
      };
      await apiClient.post(`/school/update/${editingSchool._id}`, payload);
      message.success("School updated successfully");
      dispatch(fetchSchools());
      handleCloseEdit();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update school");
    } finally {
      setEditSaving(false);
    }
  }, [editingSchool, dispatch, handleCloseEdit]);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  // Derived stats
  const totalSchools = schools?.length || 0;
  const activeSchools = schools?.filter((s) => s.isActive).length || 0;
  const inactiveSchools = totalSchools - activeSchools;
  const totalBoards = new Set(schools?.flatMap((s) => s.boards?.map((b) => b.name) || [])).size;

  // Filtered list
  const filteredSchools = schools?.filter((school) => {
    const matchSearch =
      !searchText ||
      school.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (school.address || "").toLowerCase().includes(searchText.toLowerCase());
    const matchStatus =
      filterStatus === "All" ||
      (filterStatus === "Active" ? school.isActive : !school.isActive);
    return matchSearch && matchStatus;
  });

  // Paginated list
  const paginatedSchools = filteredSchools?.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when filters change
  const handleSearch = (e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  };
  const handleFilterStatus = (val) => {
    setFilterStatus(val);
    setCurrentPage(1);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLOR.bg,
        padding: "28px 24px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >

      {/* ══════════ PAGE HEADER ══════════ */}
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
                background: COLOR.primaryLight,
                border: `1px solid ${COLOR.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexFlow: "column ",
              }}
            >
              <ApartmentOutlined style={{ color: COLOR.primary, fontSize: 16 }} />
            </div>
            <Title
              level={3}
              style={{ margin: 0, color: COLOR.textPrimary, fontWeight: 700, letterSpacing: "-0.5px" }}
            >
              Schools Management
            </Title>
             <Text style={{ color: COLOR.textSecondary, fontSize: 13 }}>
            Manage all registered institutions and their subscriptions
          </Text>
          </Space>

        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={openModal}
          style={{
            background: COLOR.primary,
            borderColor: COLOR.primary,
            borderRadius: 10,
            fontWeight: 600,
            height: 40,
            paddingInline: 20,
            boxShadow: "0 2px 8px rgba(37,99,235,0.2)",
          }}
        >
          Add School
        </Button>
      </div>

      {/* ══════════ STATS ROW ══════════ */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {[
          {
            title: "Total Schools",
            value: totalSchools,
            icon: <TeamOutlined />,
            color: COLOR.primary,
            bg: COLOR.primaryLight,
            border: COLOR.primaryBorder,
          },
          {
            title: "Active",
            value: activeSchools,
            icon: <CheckCircleFilled />,
            color: "#22C55E",
            bg: "rgba(220,252,231,0.2)",
            border: "rgba(220,252,231,0.5)",
          },
          {
            title: "Inactive",
            value: inactiveSchools,
            icon: <CloseCircleFilled />,
            color: "#EF4444",
            bg: "rgba(254,226,226,0.2)",
            border: "rgba(254,226,226,0.5)",
          },
          {
            title: "Board Types",
            value: totalBoards,
            icon: <BookOutlined />,
            color: COLOR.blue,
            bg: COLOR.blueLight,
            border: "#BFDBFE",
          },
        ].map((stat) => (
          <Col key={stat.title} xs={12} sm={12} md={6}>
            <div
              style={{
                background: COLOR.surface,
                border: `1px solid ${COLOR.border}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: stat.bg,
                  border: `1px solid ${stat.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: stat.color,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {stat.icon}
              </div>
              <div>
                <Text
                  style={{
                    display: "block",
                    fontSize: 10,
                    color: COLOR.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    fontWeight: 600,
                    marginBottom: 2,
                  }}
                >
                  {stat.title}
                </Text>
                <Text
                  strong
                  style={{ fontSize: 22, color: COLOR.textPrimary, lineHeight: 1, letterSpacing: "-0.5px" }}
                >
                  {stat.value}
                </Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* ══════════ TOOLBAR ══════════ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Input
          prefix={<SearchOutlined style={{ color: COLOR.textMuted }} />}
          placeholder="Search schools by name or city..."
          value={searchText}
          onChange={handleSearch}
          allowClear
          style={{
            maxWidth: 320,
            borderRadius: 10,
            borderColor: COLOR.border,
            height: 36,
            fontSize: 13,
          }}
        />

        <Segmented
          options={["All", "Active", "Inactive"]}
          value={filterStatus}
          onChange={handleFilterStatus}
          style={{
            background: "rgba(219,234,254,0.15)",
            borderRadius: 10,
            padding: 3,
          }}
        />
      </div>

      {/* ══════════ CONTENT ══════════ */}
      {loading ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "96px 0",
            gap: 16,
          }}
        >
          <Spin size="large" style={{ color: COLOR.primary }} />
          <Text style={{ color: COLOR.textMuted, fontSize: 13 }}>Loading schools...</Text>
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
          }}
        >
          <div
            style={{
              background: COLOR.dangerLight,
              border: `1px solid ${COLOR.dangerBorder}`,
              borderRadius: 12,
              padding: "16px 24px",
              textAlign: "center",
            }}
          >
            <CloseCircleFilled style={{ color: COLOR.danger, fontSize: 28, marginBottom: 8 }} />
            <Text style={{ display: "block", color: COLOR.danger, fontWeight: 600 }}>
              {typeof error === "string" ? error : "Something went wrong. Please try again."}
            </Text>
          </div>
        </div>
      ) : !filteredSchools?.length ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 0",
          }}
        >
          <Empty
            description={
              <Text style={{ color: COLOR.textSecondary }}>
                {searchText || filterStatus !== "All"
                  ? "No schools match your filters"
                  : "No schools added yet"}
              </Text>
            }
          >
            {!searchText && filterStatus === "All" && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openModal}
                style={{
                  background: COLOR.primary,
                  borderColor: COLOR.primary,
                  borderRadius: 8,
                }}
              >
                Add your first school
              </Button>
            )}
          </Empty>
        </div>
      ) : (
        <>
          <Text style={{ fontSize: 12, color: COLOR.textMuted, display: "block", marginBottom: 12 }}>
            Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredSchools.length)}–{Math.min(currentPage * PAGE_SIZE, filteredSchools.length)} of {filteredSchools.length} schools
          </Text>
          <Row gutter={[14, 14]}>
            {paginatedSchools.map((school) => (
              <Col key={school._id} xs={24} sm={12} lg={8}>
                <SchoolCard
                  school={school}
                  onDelete={handleDeleteSchool}
                  onEdit={handleOpenEdit}
                  onManageSub={handleManageSub}
                />
              </Col>
            ))}
          </Row>

          {filteredSchools.length > PAGE_SIZE && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
              <Pagination
                current={currentPage}
                pageSize={PAGE_SIZE}
                total={filteredSchools.length}
                onChange={setCurrentPage}
                showSizeChanger={false}
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              />
            </div>
          )}
        </>
      )}

      {/* ══════════ ADD SCHOOL MODAL ══════════ */}
      <Modal
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        centered
        width={600}
        destroyOnClose
        styles={{
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
          header: {
            background: COLOR.primaryLight,
            borderBottom: `1px solid ${COLOR.primaryBorder}`,
            borderRadius: "16px 16px 0 0",
            padding: "16px 24px",
            margin: 0,
          },
          body: { padding: 24 },
        }}
        title={
          <Space align="center" size={10}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: COLOR.surface,
                border: `1px solid ${COLOR.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <PlusOutlined style={{ color: COLOR.primary, fontSize: 13 }} />
            </div>
            <Title level={4} style={{ margin: 0, color: COLOR.primary, fontSize: 16 }}>
              Add New School
            </Title>
          </Space>
        }
      >
        <AddSchoolForm onClose={closeModal} />
      </Modal>

      {/* ══════════ EDIT SCHOOL MODAL ══════════ */}
      <Modal
        open={editModalOpen}
        onCancel={handleCloseEdit}
        onOk={() => editForm.submit()}
        okText="Save Changes"
        okButtonProps={{
          loading: editSaving,
          style: {
            background: COLOR.primary,
            borderColor: COLOR.primary,
            borderRadius: 8,
            fontWeight: 600,
          },
        }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        centered
        width={560}
        destroyOnClose
        styles={{
          content: { borderRadius: 16, padding: 0, overflow: "hidden" },
          header: {
            background: COLOR.primaryLight,
            borderBottom: `1px solid ${COLOR.primaryBorder}`,
            borderRadius: "16px 16px 0 0",
            padding: "16px 24px",
            margin: 0,
          },
          body: { padding: 24 },
        }}
        title={
          <Space align="center" size={10}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: COLOR.surface,
                border: `1px solid ${COLOR.primaryBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <EditOutlined style={{ color: COLOR.primary, fontSize: 13 }} />
            </div>
            <Title level={4} style={{ margin: 0, color: COLOR.primary, fontSize: 16 }}>
              Edit School
            </Title>
          </Space>
        }
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          style={{ marginTop: 4 }}
        >
          <Row gutter={[14, 0]}>
            <Col xs={24}>
              <Form.Item
                name="name"
                label={<Text strong style={{ fontSize: 13 }}>School Name</Text>}
                rules={[{ required: true, message: "School name is required" }]}
              >
                <Input
                  placeholder="e.g. Sunrise Public School"
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="address"
                label={<Text strong style={{ fontSize: 13 }}>Address</Text>}
              >
                <Input
                  placeholder="e.g. 123 Main Street, Mumbai"
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="email"
                label={<Text strong style={{ fontSize: 13 }}>Email</Text>}
                rules={[{ type: "email", message: "Enter a valid email" }]}
              >
                <Input
                  placeholder="school@example.com"
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phone"
                label={<Text strong style={{ fontSize: 13 }}>Phone</Text>}
              >
                <Input
                  placeholder="+91 9XXXXXXXXX"
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="website"
                label={<Text strong style={{ fontSize: 13 }}>Website</Text>}
              >
                <Input
                  placeholder="https://school.edu"
                  style={{ borderRadius: 8, height: 38 }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="isActive"
                label={<Text strong style={{ fontSize: 13 }}>Status</Text>}
              >
                <Select style={{ borderRadius: 8, height: 38 }}>
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ══════════ SUBSCRIPTION MANAGEMENT DRAWER ══════════ */}
      <Drawer
        open={subDrawerOpen}
        onClose={handleSubDrawerClose}
        title={
          <Space>
            <CrownOutlined style={{ color: COLOR.primary }} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Manage Subscription — {subSchool?.name}
            </span>
          </Space>
        }
        width={440}
        destroyOnClose
      >
        {actionLoading && !schoolSubscription ? (
          <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>
        ) : !schoolSubscription ? (
          <Alert
            type="warning"
            showIcon
            message="No subscription found"
            description="This school has no subscription assigned. Go to Subscription Plans to assign one."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* ── Status badge ── */}
            {(() => {
              const sc = STATUS_COLOR[schoolSubscription.status] || STATUS_COLOR.cancelled;
              const end = new Date(schoolSubscription.endDate);
              const daysLeft = Math.ceil((end - new Date()) / 86400000);
              return (
                <div style={{
                  background: sc.bg, border: `1px solid ${sc.border}`,
                  borderRadius: 12, padding: "14px 16px",
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: sc.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      {schoolSubscription.status}
                    </div>
                    <div style={{ fontSize: 13, color: "#0F172A", fontWeight: 600 }}>
                      {schoolSubscription.planId?.name || "—"}
                    </div>
                  </div>
                  {["active", "trial"].includes(schoolSubscription.status) && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: daysLeft <= 7 ? "#DC2626" : daysLeft <= 30 ? "#D97706" : sc.color }}>
                        {daysLeft > 0 ? daysLeft : 0}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>days left</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ── Details ── */}
            <Descriptions column={1} size="small" bordered
              styles={{ label: { fontWeight: 600, fontSize: 12, width: 130 }, content: { fontSize: 12 } }}>
              <Descriptions.Item label="Plan">
                {schoolSubscription.planId?.name || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                ₹{schoolSubscription.snapshot?.price?.toLocaleString("en-IN") || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {new Date(schoolSubscription.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {new Date(schoolSubscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {schoolSubscription.snapshot?.durationInDays} days
              </Descriptions.Item>
              <Descriptions.Item label="Payment">
                <Tag color={schoolSubscription.paymentStatus === "completed" ? "success" : schoolSubscription.paymentStatus === "failed" ? "error" : "warning"}>
                  {schoolSubscription.paymentStatus}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {/* ── Actions ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Renew */}
              <Popconfirm
                title="Renew subscription?"
                description={`Extends by ${schoolSubscription.snapshot?.durationInDays} days from the current end date.`}
                onConfirm={handleRenew}
                okText="Renew"
                icon={<ReloadOutlined style={{ color: COLOR.primary }} />}
              >
                <Button
                  block icon={<ReloadOutlined />}
                  loading={actionLoading}
                  style={{ borderRadius: 8, height: 38, fontWeight: 600, borderColor: COLOR.primaryBorder, color: COLOR.primary, background: COLOR.primaryLight }}
                >
                  Renew Subscription
                </Button>
              </Popconfirm>

              {/* Suspend / Reactivate */}
              {["active", "trial"].includes(schoolSubscription.status) ? (
                <Popconfirm
                  title="Suspend subscription?"
                  description="School admins will be blocked from logging in."
                  onConfirm={handleSuspend}
                  okText="Suspend" okButtonProps={{ danger: true }}
                  icon={<ExclamationCircleOutlined style={{ color: "#D97706" }} />}
                >
                  <Button block danger icon={<PauseCircleOutlined />} loading={actionLoading}
                    style={{ borderRadius: 8, height: 38, fontWeight: 600, background: "#FEF3C7", borderColor: "#FCD34D", color: "#92400E" }}>
                    Suspend
                  </Button>
                </Popconfirm>
              ) : schoolSubscription.status === "suspended" ? (
                <Popconfirm
                  title="Reactivate subscription?"
                  onConfirm={handleReactivate}
                  okText="Reactivate"
                  icon={<PlayCircleOutlined style={{ color: "#15803D" }} />}
                >
                  <Button block icon={<PlayCircleOutlined />} loading={actionLoading}
                    style={{ borderRadius: 8, height: 38, fontWeight: 600, background: "#DCFCE7", borderColor: "#86EFAC", color: "#15803D" }}>
                    Reactivate
                  </Button>
                </Popconfirm>
              ) : null}

              {/* Cancel */}
              {schoolSubscription.status !== "cancelled" && (
                <Popconfirm
                  title="Cancel subscription?"
                  description="This will permanently cancel the school's subscription."
                  onConfirm={handleCancel}
                  okText="Yes, Cancel" okButtonProps={{ danger: true }}
                  icon={<ExclamationCircleOutlined style={{ color: "#DC2626" }} />}
                >
                  <Button block danger icon={<StopOutlined />} loading={actionLoading}
                    style={{ borderRadius: 8, height: 38, fontWeight: 600 }}>
                    Cancel Subscription
                  </Button>
                </Popconfirm>
              )}
            </div>

            {/* ── Change Plan ── */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <SwapOutlined style={{ color: COLOR.primary }} />
                Change Plan
              </div>
              <Space.Compact style={{ width: "100%", marginBottom: 10 }}>
                <Select
                  placeholder="Select new plan"
                  style={{ flex: 1 }}
                  value={changePlanId}
                  onChange={setChangePlanId}
                  options={plans.filter(p => p.isActive !== false && p._id !== schoolSubscription.planId?._id).map(p => ({
                    value: p._id,
                    label: `${p.name} — ₹${p.price} / ${p.durationInDays}d`,
                  }))}
                />
                <Select
                  value={changePlanAction}
                  onChange={setChangePlanAction}
                  style={{ width: 130 }}
                  options={[
                    { value: "upgrade", label: "Upgrade" },
                    { value: "downgrade", label: "Downgrade" },
                  ]}
                />
              </Space.Compact>
              <Popconfirm
                title={`${changePlanAction === "upgrade" ? "Upgrade" : "Downgrade"} plan?`}
                description="This will reset the subscription start/end dates."
                onConfirm={handleChangePlan}
                disabled={!changePlanId}
                okText="Confirm"
              >
                <Button
                  block icon={<SwapOutlined />}
                  disabled={!changePlanId}
                  loading={actionLoading}
                  style={{ borderRadius: 8, height: 36, fontWeight: 600, borderColor: COLOR.primaryBorder, color: COLOR.primary }}
                >
                  Apply Plan Change
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Schools;
