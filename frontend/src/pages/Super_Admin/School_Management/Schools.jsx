import React, { useEffect, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools, deleteSchool } from "../../../features/schoolSlice";
import { fetchSubscriptionPlans } from "../../../features/subscriptionPlanSlice";
import {
  fetchSchoolSubscription, renewSchoolSubscription,
  cancelSchoolSubscription, suspendSchoolSubscription,
  reactivateSchoolSubscription, changeSchoolPlan, assignSchoolPlan,
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
  Segmented,
  Tooltip,
  Divider,
  Form,
  Select,
  Pagination,
  Drawer,
  Alert,
  Descriptions,
  Upload,
  Switch,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
  SearchOutlined,
  EnvironmentOutlined,
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
  UploadOutlined,
} from "@ant-design/icons";
import PageHeader from "../../../components/layout/PageHeader";
import {
  pageWrapper, sectionPanel, statGrid, iconWell, pill,
  toolbarRow, modalTitle, emptyState,
} from "../../../styles/pageStyles";

const { Text } = Typography;
const { Option } = Select;

// ─── SchoolCard ────────────────────────────────────────────────────────────────
const SchoolCard = ({ school, onDelete, onEdit, onManageSub }) => {
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
      <div
        style={{
          height: 4,
          background: school.isActive
            ? "linear-gradient(90deg, var(--primary), rgba(var(--primary-rgb), 0.4))"
            : "linear-gradient(90deg, var(--text-disabled), var(--border))",
        }}
      />

      {/* ── CARD BODY ── */}
      <div style={{ padding: "16px 18px 0", flex: 1 }}>
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <Space align="start" size={10}>
            <div style={iconWell("var(--primary)", 40)}>
              <BankOutlined />
            </div>
            <div style={{ minWidth: 0 }}>
              <Text
                strong
                style={{ display: "block", fontSize: 14, color: "var(--text-primary)", lineHeight: 1.3, letterSpacing: "-0.2px" }}
                ellipsis
              >
                {school.name}
              </Text>
              <Space size={4} style={{ marginTop: 2 }}>
                <EnvironmentOutlined style={{ color: "var(--text-muted)", fontSize: 11 }} />
                <Text style={{ fontSize: 11, color: "var(--text-secondary)" }} ellipsis>
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
                style={{ color: "var(--primary)", borderRadius: 8, flexShrink: 0 }}
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
                  style={{ color: "var(--text-muted)", borderRadius: 8, flexShrink: 0 }}
                  danger
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>

        <Divider style={{ margin: "10px 0" }} />

        {/* Boards */}
        <div style={{ marginBottom: 10 }}>
          <Space size={6} align="center" style={{ marginBottom: 6 }}>
            <BookOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Text style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              Boards
            </Text>
          </Space>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {school.boards?.length ? (
              school.boards.map((board) => (
                <span key={board._id} style={pill("var(--primary)", "var(--primary-light-rgb)")}>
                  {board.name}
                </span>
              ))
            ) : (
              <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>—</Text>
            )}
          </div>
        </div>

        {/* Subscription Plan */}
        <div style={{ marginBottom: 10 }}>
          <Space size={6} align="center" style={{ marginBottom: 6 }}>
            <CrownOutlined style={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Text style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
              Plan
            </Text>
          </Space>
          {school.subscriptionPlan ? (
            <Space size={5} wrap>
              <span style={pill("var(--accent)", "rgba(var(--accent-rgb), 0.15)")}>{school.subscriptionPlan.name}</span>
              <span style={pill("var(--warning-hover)", "var(--warning-light)")}>₹{school.subscriptionPlan.price}</span>
              <span style={pill("var(--primary)", "var(--primary-light-rgb)")}>{school.subscriptionPlan.durationInDays}d</span>
            </Space>
          ) : (
            <Text style={{ fontSize: 11, color: "var(--text-muted)" }}>No plan assigned</Text>
          )}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        style={{
          padding: "10px 18px 14px",
          marginTop: "auto",
          background: "var(--surface-soft)",
          borderTop: "1px solid var(--border-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space size={6} align="center">
          {school.isActive ? (
            <CheckCircleFilled style={{ color: "var(--primary)", fontSize: 13 }} />
          ) : (
            <CloseCircleFilled style={{ color: "var(--danger)", fontSize: 13 }} />
          )}
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: school.isActive ? "var(--primary)" : "var(--danger)",
            }}
          >
            {school.isActive ? "Active" : "Inactive"}
          </Text>
        </Space>

        <Button
          size="small"
          icon={<SettingOutlined />}
          onClick={() => onManageSub(school)}
          style={{ fontSize: 11, borderRadius: 7, height: 26 }}
        >
          Manage Subscription
        </Button>
      </div>
    </div>
  );
};

// ─── Schools Page ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 9;

const STATUS_COLOR = {
  active:    { color: "var(--success-hover)", bg: "var(--success-light)", border: "rgba(var(--success-rgb), 0.4)" },
  trial:     { color: "var(--primary-hover)", bg: "var(--primary-light)", border: "rgba(var(--primary-rgb), 0.4)" },
  expired:   { color: "var(--danger-hover)", bg: "var(--danger-light)", border: "var(--danger-light)" },
  suspended: { color: "var(--warning-hover)", bg: "var(--warning-light)", border: "var(--warning)" },
  cancelled: { color: "var(--text-secondary)", bg: "var(--surface-soft)", border: "var(--border)" },
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
  const [editLogoFile, setEditLogoFile] = useState(null);
  const [editLogoPreview, setEditLogoPreview] = useState(null);

  // Subscription drawer state
  const [subDrawerOpen, setSubDrawerOpen] = useState(false);
  const [subSchool, setSubSchool] = useState(null);
  const [changePlanId, setChangePlanId] = useState(null);
  const [changePlanAction, setChangePlanAction] = useState("upgrade");
  const [assignPlanId, setAssignPlanId] = useState(null);
  const [assignAsTrial, setAssignAsTrial] = useState(false);

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
    setAssignPlanId(null);
    setAssignAsTrial(false);
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

  const handleAssignPlan = useCallback(async () => {
    if (!subSchool?._id || !assignPlanId) return;
    await dispatch(assignSchoolPlan({ schoolId: subSchool._id, payload: { planId: assignPlanId, isTrial: assignAsTrial } }));
    dispatch(fetchSchoolSubscription(subSchool._id));
    dispatch(fetchSchools());
    setAssignPlanId(null);
    setAssignAsTrial(false);
  }, [subSchool, assignPlanId, assignAsTrial, dispatch]);

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
    setEditLogoFile(null);
    setEditLogoPreview(school.logo || null);
    setEditModalOpen(true);
  }, [editForm]);

  const handleCloseEdit = useCallback(() => {
    setEditModalOpen(false);
    setEditingSchool(null);
    setEditLogoFile(null);
    setEditLogoPreview(null);
    editForm.resetFields();
  }, [editForm]);

  const handleEditLogoChange = useCallback(({ file }) => {
    if (!file) return;

    if (file.size > 50 * 1024) {
      message.error("Logo size must be less than or equal to 50KB");
      return;
    }

    setEditLogoFile(file);
    setEditLogoPreview(URL.createObjectURL(file));
  }, []);

  const handleEditSubmit = useCallback(async (values) => {
    if (!editingSchool?._id) return;
    try {
      setEditSaving(true);
      const formData = new FormData();
      formData.append("name", values.name || "");
      formData.append("address", values.address || "");
      formData.append("email", values.email || "");
      formData.append("phone", values.phone || "");
      formData.append("website", values.website || "");
      formData.append("isActive", values.isActive === "active" ? "true" : "false");
      if (editLogoFile) formData.append("logo", editLogoFile);

      await apiClient.post(`/school/update/${editingSchool._id}`, formData);
      message.success("School updated successfully");
      dispatch(fetchSchools());
      handleCloseEdit();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to update school");
    } finally {
      setEditSaving(false);
    }
  }, [editingSchool, editLogoFile, dispatch, handleCloseEdit]);

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
    <>
      <PageHeader
        title="Schools Management"
        subtitle="Manage all registered institutions and their subscriptions"
        icon={<ApartmentOutlined />}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
            Add School
          </Button>
        }
      />
      <div style={pageWrapper}>
        {/* ══════════ STATS ROW ══════════ */}
        <div className="stat-grid" style={statGrid(170)}>
          {[
            { title: "Total Schools", value: totalSchools, icon: <TeamOutlined />, color: "var(--primary)" },
            { title: "Active", value: activeSchools, icon: <CheckCircleFilled />, color: "var(--success)" },
            { title: "Inactive", value: inactiveSchools, icon: <CloseCircleFilled />, color: "var(--danger)" },
            { title: "Board Types", value: totalBoards, icon: <BookOutlined />, color: "var(--primary)" },
          ].map((stat) => (
            <div key={stat.title} style={{ ...sectionPanel, display: "flex", alignItems: "center", gap: 12, marginBottom: 0, padding: "16px 20px" }}>
              <div style={iconWell(stat.color, 38)}>{stat.icon}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {stat.title}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ TOOLBAR ══════════ */}
        <div style={toolbarRow}>
          <Input
            prefix={<SearchOutlined style={{ color: "var(--text-muted)" }} />}
            placeholder="Search schools by name or city..."
            value={searchText}
            onChange={handleSearch}
            allowClear
            style={{ maxWidth: 320 }}
          />

          <Segmented
            options={["All", "Active", "Inactive"]}
            value={filterStatus}
            onChange={handleFilterStatus}
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
            <Spin size="large" />
            <Text style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading schools...</Text>
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
                background: "var(--danger-light)",
                border: "1px solid rgba(var(--danger-rgb), 0.4)",
                borderRadius: 12,
                padding: "16px 24px",
                textAlign: "center",
              }}
            >
              <CloseCircleFilled style={{ color: "var(--danger)", fontSize: 28, marginBottom: 8 }} />
              <Text style={{ display: "block", color: "var(--danger)", fontWeight: 600 }}>
                {typeof error === "string" ? error : "Something went wrong. Please try again."}
              </Text>
            </div>
          </div>
        ) : !filteredSchools?.length ? (
          <div style={emptyState}>
            <Empty
              description={
                <Text style={{ color: "var(--text-secondary)" }}>
                  {searchText || filterStatus !== "All"
                    ? "No schools match your filters"
                    : "No schools added yet"}
                </Text>
              }
            >
              {!searchText && filterStatus === "All" && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openModal}>
                  Add your first school
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <>
            <Text style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 12 }}>
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
                />
              </div>
            )}
          </>
        )}

        {/* ══════════ ADD SCHOOL MODAL ══════════ */}
        <Modal
          title={modalTitle(<PlusOutlined />, "Add New School")}
          open={isModalOpen}
          onCancel={closeModal}
          footer={null}
          centered
          width={600}
          destroyOnClose
        >
          <AddSchoolForm onClose={closeModal} />
        </Modal>

        {/* ══════════ EDIT SCHOOL MODAL ══════════ */}
        <Modal
          title={modalTitle(<EditOutlined />, "Edit School")}
          open={editModalOpen}
          onCancel={handleCloseEdit}
          onOk={() => editForm.submit()}
          okText="Save Changes"
          okButtonProps={{ loading: editSaving }}
          centered
          width={560}
          destroyOnClose
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
                  label="School Name"
                  rules={[{ required: true, message: "School name is required" }]}
                >
                  <Input placeholder="e.g. Sunrise Public School" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item name="address" label="Address">
                  <Input placeholder="e.g. 123 Main Street, Mumbai" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[{ type: "email", message: "Enter a valid email" }]}
                >
                  <Input placeholder="school@example.com" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="phone" label="Phone">
                  <Input placeholder="+91 9XXXXXXXXX" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="website" label="Website">
                  <Input placeholder="https://school.edu" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item name="isActive" label="Status">
                  <Select>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="School Logo (Max 50 KB)">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleEditLogoChange}
                  >
                    <Button icon={<UploadOutlined />}>
                      {editLogoPreview ? "Change Logo" : "Upload Logo"}
                    </Button>
                  </Upload>

                  {editLogoPreview && (
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={editLogoPreview}
                        alt="Logo Preview"
                        width={56}
                        height={56}
                        style={{ borderRadius: 8, border: "1px solid var(--border-muted)", objectFit: "cover" }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {editLogoFile ? "New logo (unsaved)" : "Current logo"}
                      </Text>
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>

        {/* ══════════ SUBSCRIPTION MANAGEMENT DRAWER ══════════ */}
        <Drawer
          open={subDrawerOpen}
          onClose={handleSubDrawerClose}
          title={modalTitle(<CrownOutlined />, "Manage Subscription", subSchool?.name)}
          width={440}
          destroyOnClose
        >
          {actionLoading && !schoolSubscription ? (
            <div style={{ textAlign: "center", padding: 48 }}><Spin size="large" /></div>
          ) : !schoolSubscription ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Alert
                type="warning"
                showIcon
                message="No subscription assigned"
                description="Pick a plan below to activate a subscription for this school."
              />

              <div style={{ ...sectionPanel, marginBottom: 0, background: "var(--surface-soft)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <CrownOutlined style={{ color: "var(--primary)" }} />
                  Assign Plan
                </div>
                <Select
                  placeholder="Select a plan"
                  style={{ width: "100%", marginBottom: 10 }}
                  value={assignPlanId}
                  onChange={setAssignPlanId}
                  options={plans.filter(p => p.isActive !== false).map(p => ({
                    value: p._id,
                    label: `${p.name} — ₹${p.price} / ${p.durationInDays}d`,
                  }))}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <Switch size="small" checked={assignAsTrial} onChange={setAssignAsTrial} />
                  <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>Start as trial</Text>
                </div>
                <Popconfirm
                  title="Assign this plan?"
                  description="Activates a new subscription for this school starting today."
                  onConfirm={handleAssignPlan}
                  disabled={!assignPlanId}
                  okText="Assign"
                >
                  <Button
                    block type="primary" icon={<CrownOutlined />}
                    disabled={!assignPlanId}
                    loading={actionLoading}
                    style={{ borderRadius: 8, height: 38, fontWeight: 600 }}
                  >
                    Assign Plan
                  </Button>
                </Popconfirm>
              </div>
            </div>
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
                      <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 600 }}>
                        {schoolSubscription.planId?.name || "—"}
                      </div>
                    </div>
                    {["active", "trial"].includes(schoolSubscription.status) && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: daysLeft <= 7 ? "var(--danger-hover)" : daysLeft <= 30 ? "var(--warning-hover)" : sc.color }}>
                          {daysLeft > 0 ? daysLeft : 0}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>days left</div>
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
                  icon={<ReloadOutlined style={{ color: "var(--primary)" }} />}
                >
                  <Button
                    block icon={<ReloadOutlined />}
                    loading={actionLoading}
                    style={{ borderRadius: 8, height: 38, fontWeight: 600, borderColor: "var(--primary-light)", color: "var(--primary)", background: "var(--primary-light)" }}
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
                    icon={<ExclamationCircleOutlined style={{ color: "var(--warning-hover)" }} />}
                  >
                    <Button block danger icon={<PauseCircleOutlined />} loading={actionLoading}
                      style={{ borderRadius: 8, height: 38, fontWeight: 600, background: "var(--warning-light)", borderColor: "var(--warning)", color: "var(--warning-hover)" }}>
                      Suspend
                    </Button>
                  </Popconfirm>
                ) : schoolSubscription.status === "suspended" ? (
                  <Popconfirm
                    title="Reactivate subscription?"
                    onConfirm={handleReactivate}
                    okText="Reactivate"
                    icon={<PlayCircleOutlined style={{ color: "var(--success-hover)" }} />}
                  >
                    <Button block icon={<PlayCircleOutlined />} loading={actionLoading}
                      style={{ borderRadius: 8, height: 38, fontWeight: 600, background: "var(--success-light)", borderColor: "rgba(var(--success-rgb), 0.4)", color: "var(--success-hover)" }}>
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
                    icon={<ExclamationCircleOutlined style={{ color: "var(--danger-hover)" }} />}
                  >
                    <Button block danger icon={<StopOutlined />} loading={actionLoading}
                      style={{ borderRadius: 8, height: 38, fontWeight: 600 }}>
                      Cancel Subscription
                    </Button>
                  </Popconfirm>
                )}
              </div>

              {/* ── Change Plan ── */}
              <div style={{ ...sectionPanel, marginBottom: 0, background: "var(--surface-soft)" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <SwapOutlined style={{ color: "var(--primary)" }} />
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
                    style={{ borderRadius: 8, height: 36, fontWeight: 600, borderColor: "var(--primary-light)", color: "var(--primary)" }}
                  >
                    Apply Plan Change
                  </Button>
                </Popconfirm>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </>
  );
};

export default Schools;
