import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  HistoryOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  approveRestoreJob,
  clearSystemBackupMessages,
  createBackupSchedule,
  createManualBackup,
  deleteBackup,
  fetchBackupAuditLogs,
  fetchBackups,
  fetchBackupSchedules,
  fetchBackupSummary,
  fetchRestoreJobs,
  downloadBackup,
  requestRestoreJob,
  runRestoreJob,
  toggleBackupSchedule,
  deleteBackupSchedule,
} from "../../../features/systemBackupSlice";
import PageHeader from "../../../components/layout/PageHeader.jsx";
import { iconWell, pageWrapper, sectionPanel, tableHeadCss } from "../../../styles/pageStyles.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const { Text } = Typography;

/* ─── Constants ──────────────────────────────────────────────────── */
const MODULE_OPTIONS = [
  "users_roles", "students", "fees", "exams", "documents", "audit_logs",
];

const STATUS_META = {
  queued:           { color: "#94A3B8", bg: "var(--surface-soft)",              label: "Queued"           },
  running:          { color: "#2563EB", bg: "var(--primary-light)",             label: "Running"          },
  success:          { color: "#16A34A", bg: "var(--success-light)",             label: "Success"          },
  failed:           { color: "#DC2626", bg: "var(--danger-light)",              label: "Failed"           },
  cancelled:        { color: "#D97706", bg: "var(--warning-light)",             label: "Cancelled"        },
  pending_approval: { color: "#7C3AED", bg: "rgba(var(--purple-rgb), 0.08)",    label: "Pending Approval" },
};

const StatusTag = ({ status }) => {
  const m = STATUS_META[status] || { color: "#94A3B8", bg: "var(--surface-soft)", label: status || "--" };
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      color: m.color, background: m.bg, border: `1px solid ${m.color}30`,
      display: "inline-block",
    }}>
      {m.label}
    </span>
  );
};

const bytesToReadable = (bytes = 0) => {
  const size = Number(bytes || 0);
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const idx = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** idx;
  return `${value.toFixed(value > 10 ? 1 : 2)} ${units[idx]}`;
};

const fmtDate = (v) => (v ? dayjs(v).format("DD MMM YYYY, HH:mm") : "--");

/* ─── Component ──────────────────────────────────────────────────── */
export default function Backups() {
  const dispatch = useDispatch();

  const {
    summary     = {},
    backups     = [],
    schedules   = [],
    restoreJobs = [],
    auditLogs   = [],
    loading        = false,
    actionLoading  = false,
    error          = null,
    successMessage = "",
  } = useSelector((s) => s.systemBackup || {});

  const [manualForm]   = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [restoreForm]  = Form.useForm();

  const [mfaToken,         setMfaToken]         = useState("");
  const [approveModalOpen, setApproveModalOpen]  = useState(false);
  const [pendingApproveId, setPendingApproveId]  = useState(null);
  const [activeTab,        setActiveTab]         = useState("manual");
  const [downloadingId,    setDownloadingId]     = useState(null);

  /* ── Bootstrap ──────────────────────────────────────────────────── */
  const bootstrap = useCallback(() => {
    dispatch(fetchBackupSummary());
    dispatch(fetchBackups());
    dispatch(fetchBackupSchedules());
    dispatch(fetchRestoreJobs());
    dispatch(fetchBackupAuditLogs());
  }, [dispatch]);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  useEffect(() => {
    if (!successMessage) return;
    message.success(successMessage);
    dispatch(clearSystemBackupMessages());
  }, [dispatch, successMessage]);

  useEffect(() => {
    if (!error) return;
    message.error(typeof error === "string" ? error : "Something went wrong");
    dispatch(clearSystemBackupMessages());
  }, [dispatch, error]);

  const handleDownload = async (row) => {
    setDownloadingId(row._id);
    const res = await dispatch(downloadBackup({ backupId: row._id, backupNo: row.backupNo }));
    setDownloadingId(null);
    if (res.meta.requestStatus === "rejected") {
      message.error(res.payload || "Download failed");
    }
  };

  /* ── Handlers ───────────────────────────────────────────────────── */
  const onManualSubmit = async (values) => {
    await dispatch(createManualBackup(values));
    dispatch(fetchBackups());
    dispatch(fetchBackupSummary());
    manualForm.resetFields();
    setActiveTab("history");
  };

  const onScheduleSubmit = async (values) => {
    await dispatch(createBackupSchedule(values));
    scheduleForm.resetFields();
    dispatch(fetchBackupSchedules());
    dispatch(fetchBackupSummary());
  };

  const onRestoreSubmit = async (values) => {
    await dispatch(requestRestoreJob(values));
    restoreForm.resetFields();
    dispatch(fetchRestoreJobs());
    dispatch(fetchBackupSummary());
  };

  const openApproveModal = (id) => {
    setPendingApproveId(id);
    setMfaToken("");
    setApproveModalOpen(true);
  };

  const submitApproval = () => {
    if (!mfaToken || mfaToken.trim().length < 6) {
      message.warning("Enter a valid MFA verification code (min 6 digits).");
      return;
    }
    dispatch(approveRestoreJob({ id: pendingApproveId, mfaToken: mfaToken.trim() }));
    setApproveModalOpen(false);
    setPendingApproveId(null);
    setMfaToken("");
    dispatch(fetchRestoreJobs());
  };

  /* ── Stat cards ─────────────────────────────────────────────────── */
  const statCards = useMemo(() => [
    { label: "Total Backups",   value: summary.totalBackups     || 0,                         color: "var(--primary)", icon: <DatabaseOutlined />,        emoji: "🗄️" },
    { label: "Successful",      value: summary.successfulBackups || 0,                         color: "var(--success)", icon: <CheckCircleOutlined />,      emoji: "✅" },
    { label: "Failed",          value: summary.failedBackups     || 0,                         color: "var(--danger-hover)", icon: <ExclamationCircleOutlined />, emoji: "❌" },
    { label: "Storage Used",    value: bytesToReadable(summary.storageUsed),                   color: "var(--purple)", icon: <CloudDownloadOutlined />,     emoji: "💾" },
    { label: "Last Backup",     value: summary.lastBackupTime    ? dayjs(summary.lastBackupTime).fromNow() : "--",    color: "var(--info)", icon: <HistoryOutlined />,          emoji: "🕐" },
    { label: "Next Scheduled",  value: summary.nextScheduledBackup ? fmtDate(summary.nextScheduledBackup) : "--",     color: "var(--warning)", icon: <ScheduleOutlined />,         emoji: "📅" },
    { label: "Pending Restores",value: summary.pendingRestores   || 0,                         color: "var(--warning-hover)", icon: <ClockCircleOutlined />,      emoji: "⏳" },
    {
      label: "Backup Health",
      value: (summary.backupHealthStatus || "unknown").toUpperCase(),
      color: summary.backupHealthStatus === "healthy" ? "var(--success)" : "var(--warning-hover)",
      icon: <SafetyCertificateOutlined />,
      emoji: summary.backupHealthStatus === "healthy" ? "🟢" : "🟡",
    },
  ], [summary]);

  /* ── Columns ────────────────────────────────────────────────────── */
  const backupColumns = [
    { title: "Backup ID",  dataIndex: "backupNo",  width: 180, render: (v) => <Text code style={{ fontSize: 12 }}>{v || "--"}</Text> },
    { title: "Type",       dataIndex: "type",       width: 100, render: (v) => <Tag style={{ borderRadius: 99 }}>{v || "--"}</Tag> },
    { title: "Scope",      dataIndex: "scope",      width: 100, render: (v) => v || "--" },
    { title: "Status",     dataIndex: "status",     width: 140, render: (v) => <StatusTag status={v} /> },
    { title: "File Size",  dataIndex: "fileSize",   width: 100, render: (v) => bytesToReadable(v) },
    { title: "Created At", dataIndex: "createdAt",  width: 160, render: fmtDate },
    {
      title: "Actions", width: 120,
      render: (_, row) => (
        <Space size={4}>
          <Button
            size="small" type="link" icon={<CloudDownloadOutlined />}
            disabled={!row?._id || row.status !== "success"}
            loading={downloadingId === row._id}
            title="Download backup file"
            onClick={() => handleDownload(row)}
          />
          <Popconfirm title="Delete backup permanently?" onConfirm={() => dispatch(deleteBackup(row._id))} disabled={!row?._id}>
            <Button size="small" danger type="link" icon={<DeleteOutlined />} disabled={!row?._id} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    { title: "Name",      dataIndex: "name",          render: (v) => v || "--" },
    { title: "Type",      dataIndex: "type",           render: (v) => <Tag style={{ borderRadius: 99 }}>{v || "--"}</Tag> },
    { title: "Frequency", dataIndex: "frequency",      render: (v) => v || "--" },
    { title: "Time (UTC)",dataIndex: "time",           render: (v) => v || "--" },
    { title: "Retention", dataIndex: "retentionDays",  render: (v) => `${v || 0} days` },
    {
      title: "Active", dataIndex: "isActive",
      render: (value, row) => (
        <Switch
          checked={Boolean(value)} size="small"
          disabled={!row?._id}
          onChange={(checked) => dispatch(toggleBackupSchedule({ id: row._id, isActive: checked }))}
        />
      ),
    },
    { title: "Created", dataIndex: "createdAt", render: fmtDate },
    {
      title: "Actions", width: 80,
      render: (_, row) => (
        <Popconfirm
          title="Delete this schedule?"
          disabled={!row?._id}
          okButtonProps={{ danger: true }}
          onConfirm={() => dispatch(deleteBackupSchedule(row._id))}
        >
          <Button size="small" danger type="link" icon={<DeleteOutlined />} disabled={!row?._id} />
        </Popconfirm>
      ),
    },
  ];

  const restoreColumns = [
    {
      title: "Backup", dataIndex: ["backupId", "backupNo"],
      render: (v, r) => <Text code style={{ fontSize: 12 }}>{v || r?.backupId?._id?.slice(-8) || "--"}</Text>,
    },
    { title: "Type",    dataIndex: "restoreType", render: (v) => v || "--" },
    { title: "Dry Run", dataIndex: "dryRun",      render: (v) => (v ? <Tag color="orange">Dry Run</Tag> : <Tag color="green">Live</Tag>) },
    { title: "Status",  dataIndex: "status",      render: (v) => <StatusTag status={v} /> },
    { title: "Requested", dataIndex: "createdAt", render: fmtDate },
    {
      title: "Actions", width: 160,
      render: (_, row) => {
        const canApprove = row?.status === "pending_approval";
        const canRun     = row?.status === "running";
        return (
          <Space size={4}>
            <Button
              size="small" icon={<SafetyCertificateOutlined />}
              disabled={!row?._id || !canApprove}
              title={canApprove ? "Approve restore (requires MFA)" : "Already approved or not pending"}
              onClick={() => openApproveModal(row._id)}
            >
              Approve
            </Button>
            <Popconfirm
              title="Execute restore job? This is irreversible."
              disabled={!row?._id || !canRun}
              onConfirm={() => { dispatch(runRestoreJob(row._id)); dispatch(fetchRestoreJobs()); }}
            >
              <Button
                size="small" type="primary" icon={<PlayCircleOutlined />}
                disabled={!row?._id || !canRun}
                title={canRun ? "Run restore" : "Approve first before running"}
              >
                Run
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const auditColumns = [
    { title: "Action",   dataIndex: "action",               render: (v) => <Tag style={{ borderRadius: 99 }}>{v || "--"}</Tag> },
    { title: "Actor",    dataIndex: ["actorId", "name"],    render: (v) => v || "System" },
    { title: "Message",  dataIndex: "message",              render: (v) => v || "--", ellipsis: true },
    { title: "IP",       dataIndex: "ipAddress",            render: (v) => v || "--" },
    { title: "Time",     dataIndex: "createdAt",            render: fmtDate },
  ];

  /* ── Section divider label ──────────────────────────────────────── */
  const SectionLabel = ({ children }) => (
    <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {children}
    </Text>
  );

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <>
      <style>{tableHeadCss("bkp-tbl")}</style>

      <PageHeader
        title="System Backups"
        subtitle="Manage platform backups, schedules, restore operations, and audit logs"
        icon={<DatabaseOutlined />}
        extra={
          <Button icon={<ReloadOutlined />} onClick={bootstrap} loading={loading}>
            Refresh
          </Button>
        }
      />

      <div style={pageWrapper}>

        {error && (
          <Alert type="error" showIcon message={typeof error === "string" ? error : "Something went wrong"} style={{ borderRadius: 12, marginBottom: 16 }} />
        )}

        {/* ── Stat cards ──────────────────────────────────────────── */}
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {statCards.map((s) => (
            <Col xs={12} sm={8} md={6} lg={3} key={s.label}>
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border-muted)",
                borderTop: `4px solid ${s.color}`,
                borderRadius: 14, padding: "14px 16px",
              }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1, marginBottom: 3 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.label}
                </div>
              </div>
            </Col>
          ))}
        </Row>

        {/* ── Main tabs ───────────────────────────────────────────── */}
        <div style={sectionPanel}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            size="small"
            items={[
              /* ── Create Manual Backup ── */
              {
                key: "manual",
                label: (
                  <span>
                    <PlusOutlined /> Create Backup
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                      <div style={iconWell("var(--primary)", 38)}>
                        <DatabaseOutlined style={{ fontSize: 17 }} />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                          Create Manual Backup
                        </Text>
                        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Trigger an immediate backup of selected data
                        </Text>
                      </div>
                    </Flex>

                    <Form
                      form={manualForm}
                      layout="vertical"
                      onFinish={onManualSubmit}
                      requiredMark="optional"
                      initialValues={{
                        type: "full",
                        scope: "platform",
                        storageProvider: "local",
                        encryptionEnabled: true,
                        retentionDays: 30,
                      }}
                    >
                      <Row gutter={[14, 0]}>
                        <Col xs={12} md={6}>
                          <Form.Item name="type" label="Backup Type">
                            <Select options={["full", "school", "module", "academic_year"].map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item name="scope" label="Scope">
                            <Select options={["platform", "school", "module"].map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item name="storageProvider" label="Storage Provider">
                            <Select options={["local", "s3", "spaces", "cloudinary"].map((v) => ({ value: v, label: v.toUpperCase() }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={6}>
                          <Form.Item name="retentionDays" label="Retention (days)">
                            <InputNumber min={1} max={365} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="modules" label="Modules (optional)">
                            <Select
                              mode="multiple" allowClear
                              placeholder="All modules included if empty"
                              options={MODULE_OPTIONS.map((v) => ({ value: v, label: v }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                          <Form.Item name="notes" label="Notes (optional)">
                            <Input placeholder="Reason for this backup" maxLength={300} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={actionLoading} icon={<DatabaseOutlined />}>
                        Create Backup
                      </Button>
                    </Form>
                  </div>
                ),
              },

              /* ── Backup History ── */
              {
                key: "history",
                label: (
                  <span>
                    <HistoryOutlined /> History
                    {backups.length > 0 && (
                      <span style={{ marginLeft: 6, background: "var(--primary)", color: "#fff", fontSize: 10, borderRadius: 99, padding: "1px 6px" }}>
                        {backups.length}
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Table
                      className="bkp-tbl"
                      rowKey={(r) => r?._id || r?.backupNo}
                      loading={loading}
                      columns={backupColumns}
                      dataSource={backups}
                      scroll={{ x: 900 }}
                      size="small"
                      pagination={{ pageSize: 10, showTotal: (t) => `${t} backups` }}
                    />
                  </div>
                ),
              },

              /* ── Schedules ── */
              {
                key: "schedule",
                label: (
                  <span>
                    <ScheduleOutlined /> Schedules
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Flex align="center" gap={10} style={{ marginBottom: 20 }}>
                      <div style={iconWell("var(--purple)", 38)}>
                        <CalendarOutlined style={{ fontSize: 17 }} />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                          Create Backup Schedule
                        </Text>
                        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Automate recurring backups on a set frequency
                        </Text>
                      </div>
                    </Flex>

                    <Form
                      layout="vertical"
                      form={scheduleForm}
                      onFinish={onScheduleSubmit}
                      requiredMark="optional"
                      initialValues={{ frequency: "daily", type: "full", retentionDays: 30, time: "02:00", timezone: "UTC", isActive: true }}
                    >
                      <Row gutter={[14, 0]}>
                        <Col xs={24} md={6}>
                          <Form.Item name="name" label="Schedule Name" rules={[{ required: true, message: "Name required" }]}>
                            <Input placeholder="e.g. Nightly Full Backup" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item name="type" label="Type">
                            <Select options={["full", "school", "module"].map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item name="frequency" label="Frequency">
                            <Select options={["daily", "weekly", "monthly", "custom"].map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item name="time" label="Time (HH:mm)">
                            <Input placeholder="02:00" maxLength={5} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item name="timezone" label="Timezone">
                            <Input placeholder="UTC" />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={3}>
                          <Form.Item name="retentionDays" label="Retention (days)">
                            <InputNumber min={1} max={365} style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button type="primary" htmlType="submit" loading={actionLoading} icon={<ScheduleOutlined />}>
                        Create Schedule
                      </Button>
                    </Form>

                    <div style={{ marginTop: 24 }}>
                      <SectionLabel>Existing Schedules</SectionLabel>
                      <Table
                        className="bkp-tbl"
                        rowKey={(r) => r?._id || r?.name}
                        columns={scheduleColumns}
                        dataSource={schedules}
                        style={{ marginTop: 10 }}
                        scroll={{ x: 800 }}
                        size="small"
                        pagination={{ pageSize: 10 }}
                      />
                    </div>
                  </div>
                ),
              },

              /* ── Restore Center ── */
              {
                key: "restore",
                label: (
                  <span>
                    <SafetyCertificateOutlined /> Restore
                    {restoreJobs.filter((j) => j.status === "pending_approval").length > 0 && (
                      <span style={{ marginLeft: 6, background: "var(--warning-hover)", color: "#fff", fontSize: 10, borderRadius: 99, padding: "1px 6px" }}>
                        {restoreJobs.filter((j) => j.status === "pending_approval").length}
                      </span>
                    )}
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    {/* Security notice */}
                    <div style={{ background: "var(--warning-light)", border: "1px solid var(--warning-light)", borderRadius: 12, padding: "12px 16px", marginBottom: 20 }}>
                      <Flex align="flex-start" gap={10}>
                        <WarningOutlined style={{ color: "var(--warning-hover)", fontSize: 18, marginTop: 2 }} />
                        <div>
                          <Text strong style={{ color: "var(--warning-hover)", display: "block", marginBottom: 4 }}>Restore Security Policy</Text>
                          <Text style={{ fontSize: 12, color: "var(--warning-hover)" }}>
                            Only Super Admins can restore backups. Each restore requires MFA approval before execution. All operations are logged.
                          </Text>
                        </div>
                      </Flex>
                    </div>

                    {/* Request form */}
                    <Flex align="center" gap={10} style={{ marginBottom: 16 }}>
                      <div style={iconWell("var(--danger-hover)", 38)}>
                        <PlayCircleOutlined style={{ fontSize: 17 }} />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>
                          Request Restore
                        </Text>
                        <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          Select a backup and submit for MFA approval
                        </Text>
                      </div>
                    </Flex>

                    <Form
                      layout="vertical"
                      form={restoreForm}
                      onFinish={onRestoreSubmit}
                      requiredMark="optional"
                      initialValues={{ restoreType: "full", dryRun: true }}
                    >
                      <Row gutter={[14, 0]}>
                        <Col xs={24} md={8}>
                          <Form.Item name="backupId" label="Select Backup" rules={[{ required: true, message: "Select a backup" }]}>
                            <Select
                              showSearch
                              placeholder="Choose backup…"
                              optionFilterProp="label"
                              options={backups
                                .filter((b) => b.status === "success")
                                .map((b) => ({
                                  value: b._id,
                                  label: `${b.backupNo || "Backup"} — ${b.type} (${fmtDate(b.createdAt)})`,
                                }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={5}>
                          <Form.Item name="restoreType" label="Restore Type">
                            <Select options={["full", "school", "module"].map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={7}>
                          <Form.Item name="modules" label="Modules (optional)">
                            <Select mode="multiple" allowClear options={MODULE_OPTIONS.map((v) => ({ value: v, label: v }))} />
                          </Form.Item>
                        </Col>
                        <Col xs={12} md={4}>
                          <Form.Item name="dryRun" label="Mode" valuePropName="checked">
                            <Switch checkedChildren="Dry Run" unCheckedChildren="Live" />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Button htmlType="submit" type="primary" danger loading={actionLoading} icon={<PlayCircleOutlined />}>
                        Request Restore
                      </Button>
                    </Form>

                    <div style={{ marginTop: 24 }}>
                      <SectionLabel>Restore Jobs</SectionLabel>
                      <Table
                        className="bkp-tbl"
                        rowKey={(r) => r?._id || r?.backupId?._id}
                        columns={restoreColumns}
                        dataSource={restoreJobs}
                        style={{ marginTop: 10 }}
                        scroll={{ x: 800 }}
                        size="small"
                        pagination={{ pageSize: 10 }}
                      />
                    </div>
                  </div>
                ),
              },

              /* ── Audit Logs ── */
              {
                key: "audit",
                label: (
                  <span>
                    <HistoryOutlined /> Audit Logs
                  </span>
                ),
                children: (
                  <div style={{ paddingTop: 16 }}>
                    <Table
                      className="bkp-tbl"
                      rowKey={(r) => r?._id || r?.createdAt}
                      columns={auditColumns}
                      dataSource={auditLogs}
                      scroll={{ x: 800 }}
                      size="small"
                      pagination={{ pageSize: 20, showTotal: (t) => `${t} log entries` }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* ── MFA Approval Modal ───────────────────────────────────────── */}
      <Modal
        open={approveModalOpen}
        title={
          <Flex align="center" gap={10}>
            <div style={iconWell("var(--warning-hover)", 36)}>
              <SafetyCertificateOutlined style={{ fontSize: 16 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>MFA Verification Required</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>Confirm your identity to approve restore</div>
            </div>
          </Flex>
        }
        okText="Confirm Approval"
        okButtonProps={{ danger: true }}
        onOk={submitApproval}
        onCancel={() => { setApproveModalOpen(false); setPendingApproveId(null); setMfaToken(""); }}
        destroyOnClose
      >
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <Alert
            type="warning" showIcon
            message="Restore operations are irreversible and will overwrite current data."
            description="Make sure you have read the restore policy before proceeding."
          />
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 13 }}>
              MFA Verification Code
            </label>
            <Input.Password
              placeholder="Enter 6-digit verification code"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              onPressEnter={submitApproval}
              autoFocus
              maxLength={8}
              size="large"
            />
          </div>
        </Space>
      </Modal>
    </>
  );
}
