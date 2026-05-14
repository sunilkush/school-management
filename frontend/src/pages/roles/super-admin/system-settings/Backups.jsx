import React, { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
} from "antd";
import { Download, RefreshCw, ShieldCheck } from "lucide-react";
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
  getBackupDownloadLink,
  requestRestoreJob,
  runRestoreJob,
  toggleBackupSchedule,
} from "../../../../features/systemBackupSlice";

const moduleOptions = [
  "users_roles",
  "students",
  "fees",
  "exams",
  "documents",
  "audit_logs",
];

const statusColor = {
  queued: "default",
  running: "processing",
  success: "success",
  failed: "error",
  cancelled: "warning",
  pending_approval: "warning",
};

const bytesToReadable = (bytes = 0) => {
  const size = Number(bytes || 0);
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1
  );
  const value = size / 1024 ** index;

  return `${value.toFixed(value > 10 ? 1 : 2)} ${units[index]}`;
};

const Backups = () => {
  const dispatch = useDispatch();

  const {
    summary = {},
    backups = [],
    schedules = [],
    restoreJobs = [],
    auditLogs = [],
    loading = false,
    actionLoading = false,
    error = null,
    successMessage = "",
    downloadLink = null,
  } = useSelector((state) => state.systemBackup || {});

  const [manualForm] = Form.useForm();
  const [scheduleForm] = Form.useForm();
  const [restoreForm] = Form.useForm();

  const bootstrap = useCallback(() => {
    dispatch(fetchBackupSummary());
    dispatch(fetchBackups());
    dispatch(fetchBackupSchedules());
    dispatch(fetchRestoreJobs());
    dispatch(fetchBackupAuditLogs());
  }, [dispatch]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

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

  useEffect(() => {
    if (downloadLink?.downloadUrl) {
      window.open(downloadLink.downloadUrl, "_blank", "noopener,noreferrer");
    }
  }, [downloadLink]);

  const summaryCards = useMemo(
    () => [
      {
        title: "Total Backups",
        value: summary?.totalBackups || 0,
      },
      {
        title: "Successful Backups",
        value: summary?.successfulBackups || 0,
      },
      {
        title: "Failed Backups",
        value: summary?.failedBackups || 0,
      },
      {
        title: "Storage Used",
        value: bytesToReadable(summary?.storageUsed || 0),
      },
      {
        title: "Last Backup",
        value: summary?.lastBackupTime
          ? new Date(summary.lastBackupTime).toLocaleString()
          : "--",
      },
      {
        title: "Next Backup",
        value: summary?.nextScheduledBackup
          ? new Date(summary.nextScheduledBackup).toLocaleString()
          : "--",
      },
      {
        title: "Pending Restores",
        value: summary?.pendingRestores || 0,
      },
      {
        title: "Backup Health",
        value: summary?.backupHealthStatus || "unknown",
        formatter: (value) => (
          <Tag color={value === "healthy" ? "green" : "orange"}>
            {String(value || "unknown").toUpperCase()}
          </Tag>
        ),
      },
    ],
    [summary]
  );

  const backupColumns = [
    {
      title: "Backup ID",
      dataIndex: "backupNo",
      width: 180,
      render: (value) => value || "--",
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (value) => <Tag>{value || "--"}</Tag>,
    },
    {
      title: "Scope",
      dataIndex: "scope",
      render: (value) => value || "--",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => (
        <Tag color={statusColor[status] || "default"}>{status || "--"}</Tag>
      ),
    },
    {
      title: "File Size",
      dataIndex: "fileSize",
      render: (value) => bytesToReadable(value),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleString() : "--"),
    },
    {
      title: "Actions",
      width: 170,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            icon={<Download size={16} />}
            disabled={!row?._id}
            onClick={() => dispatch(getBackupDownloadLink(row._id))}
          />
          <Popconfirm
            title="Delete backup permanently?"
            onConfirm={() => dispatch(deleteBackup(row._id))}
            disabled={!row?._id}
          >
            <Button danger type="link" disabled={!row?._id}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const scheduleColumns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (value) => value || "--",
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (value) => <Tag>{value || "--"}</Tag>,
    },
    {
      title: "Frequency",
      dataIndex: "frequency",
      render: (value) => value || "--",
    },
    {
      title: "Time",
      dataIndex: "time",
      render: (value) => value || "--",
    },
    {
      title: "Retention",
      dataIndex: "retentionDays",
      render: (value) => `${value || 0} days`,
    },
    {
      title: "Active",
      dataIndex: "isActive",
      render: (value, row) => (
        <Switch
          checked={Boolean(value)}
          disabled={!row?._id}
          onChange={(checked) =>
            dispatch(toggleBackupSchedule({ id: row._id, isActive: checked }))
          }
        />
      ),
    },
  ];

  const restoreColumns = [
    {
      title: "Backup",
      dataIndex: ["backupId", "backupNo"],
      render: (value) => value || "--",
    },
    {
      title: "Type",
      dataIndex: "restoreType",
      render: (value) => value || "--",
    },
    {
      title: "Dry Run",
      dataIndex: "dryRun",
      render: (value) => (value ? "Yes" : "No"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (value) => (
        <Tag color={statusColor[value] || "default"}>{value || "--"}</Tag>
      ),
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            disabled={!row?._id || row.status === "success"}
            onClick={() =>
              dispatch(approveRestoreJob({ id: row._id, mfaToken: "123456" }))
            }
          >
            Approve
          </Button>
          <Button
            size="small"
            type="primary"
            disabled={!row?._id || row.status === "success"}
            onClick={() => dispatch(runRestoreJob(row._id))}
          >
            Run
          </Button>
        </Space>
      ),
    },
  ];

  const auditColumns = [
    {
      title: "Action",
      dataIndex: "action",
      render: (value) => <Tag>{value || "--"}</Tag>,
    },
    {
      title: "Actor",
      dataIndex: ["actorId", "name"],
      render: (value) => value || "System",
    },
    {
      title: "Message",
      dataIndex: "message",
      render: (value) => value || "--",
    },
    {
      title: "IP / Device",
      render: (_, row) => `${row?.ipAddress || "--"} / ${row?.userAgent || "--"}`,
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      render: (value) => (value ? new Date(value).toLocaleString() : "--"),
    },
  ];

  const onManualSubmit = async (values) => {
    await dispatch(createManualBackup(values));
    dispatch(fetchBackups());
    dispatch(fetchBackupSummary());
    manualForm.resetFields();
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

  return (
    <div className="p-6 space-y-4 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" />
          System Backups Module (Super Admin)
        </h1>

        <Button icon={<RefreshCw size={14} />} onClick={bootstrap} loading={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <Alert
          type="error"
          message={typeof error === "string" ? error : "Something went wrong"}
          showIcon
        />
      ) : null}

      <Row gutter={[16, 16]}>
        {summaryCards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <Card>
              <Statistic
                title={item.title}
                value={item.value}
                formatter={item.formatter}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        items={[
          {
            key: "manual",
            label: "Create Manual Backup",
            children: (
              <Card>
                <Form
                  form={manualForm}
                  layout="vertical"
                  onFinish={onManualSubmit}
                  initialValues={{
                    type: "full",
                    scope: "platform",
                    storageProvider: "local",
                    encryptionEnabled: true,
                    retentionDays: 30,
                  }}
                >
                  <Row gutter={16}>
                    <Col md={6} xs={24}>
                      <Form.Item name="type" label="Backup Type">
                        <Select
                          options={[
                            "full",
                            "school",
                            "module",
                            "academic_year",
                          ].map((value) => ({ value, label: value }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={6} xs={24}>
                      <Form.Item name="scope" label="Backup Scope">
                        <Select
                          options={["platform", "school", "module"].map(
                            (value) => ({ value, label: value })
                          )}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={6} xs={24}>
                      <Form.Item name="storageProvider" label="Storage Provider">
                        <Select
                          options={["local", "s3", "spaces", "cloudinary"].map(
                            (value) => ({
                              value,
                              label: value.toUpperCase(),
                            })
                          )}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={6} xs={24}>
                      <Form.Item name="retentionDays" label="Retention Days">
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>

                    <Col md={12} xs={24}>
                      <Form.Item name="modules" label="Modules">
                        <Select
                          mode="multiple"
                          options={moduleOptions.map((value) => ({
                            value,
                            label: value,
                          }))}
                        />
                      </Form.Item>
                    </Col>

                    <Col md={12} xs={24}>
                      <Form.Item name="notes" label="Backup Notes">
                        <Input placeholder="Reason for backup" />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={actionLoading}
                      >
                        Create Backup
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card>
            ),
          },
          {
            key: "history",
            label: "Backup History",
            children: (
              <Card>
                <Table
                  rowKey={(row) => row?._id || row?.backupNo}
                  loading={loading}
                  columns={backupColumns}
                  dataSource={backups}
                  scroll={{ x: 900 }}
                />
              </Card>
            ),
          },
          {
            key: "schedule",
            label: "Backup Schedules",
            children: (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card>
                  <Form
                    layout="vertical"
                    form={scheduleForm}
                    onFinish={onScheduleSubmit}
                    initialValues={{
                      frequency: "daily",
                      type: "full",
                      retentionDays: 30,
                      time: "02:00",
                      timezone: "UTC",
                      isActive: true,
                    }}
                  >
                    <Row gutter={16}>
                      <Col md={6} xs={24}>
                        <Form.Item
                          name="name"
                          label="Schedule Name"
                          rules={[{ required: true, message: "Name is required" }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>

                      <Col md={4} xs={24}>
                        <Form.Item name="type" label="Type">
                          <Select
                            options={["full", "school", "module"].map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                        </Form.Item>
                      </Col>

                      <Col md={4} xs={24}>
                        <Form.Item name="frequency" label="Frequency">
                          <Select
                            options={["daily", "weekly", "monthly", "custom"].map(
                              (value) => ({ value, label: value })
                            )}
                          />
                        </Form.Item>
                      </Col>

                      <Col md={4} xs={24}>
                        <Form.Item name="time" label="Time">
                          <Input placeholder="HH:mm" />
                        </Form.Item>
                      </Col>

                      <Col md={3} xs={24}>
                        <Form.Item name="timezone" label="Timezone">
                          <Input />
                        </Form.Item>
                      </Col>

                      <Col md={3} xs={24}>
                        <Form.Item name="retentionDays" label="Retention">
                          <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Button type="primary" htmlType="submit">
                          Create Schedule
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                <Card>
                  <Table
                    rowKey={(row) => row?._id || row?.name}
                    columns={scheduleColumns}
                    dataSource={schedules}
                    scroll={{ x: 800 }}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "restore",
            label: "Restore Center",
            children: (
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Card>
                  <Descriptions
                    title="Restore Security"
                    bordered
                    size="small"
                    column={1}
                  >
                    <Descriptions.Item label="Permission">
                      Only Super Admin can restore backups
                    </Descriptions.Item>
                    <Descriptions.Item label="MFA">
                      MFA token required before approval
                    </Descriptions.Item>
                    <Descriptions.Item label="Audit">
                      All restore requests are logged with IP/device
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card>
                  <Form
                    layout="vertical"
                    form={restoreForm}
                    onFinish={onRestoreSubmit}
                    initialValues={{ restoreType: "full", dryRun: true }}
                  >
                    <Row gutter={16}>
                      <Col md={8} xs={24}>
                        <Form.Item
                          name="backupId"
                          label="Backup"
                          rules={[
                            { required: true, message: "Backup is required" },
                          ]}
                        >
                          <Select
                            options={backups.map((item) => ({
                              value: item._id,
                              label: `${item.backupNo || "Backup"} (${item.type || "--"})`,
                            }))}
                          />
                        </Form.Item>
                      </Col>

                      <Col md={6} xs={24}>
                        <Form.Item name="restoreType" label="Restore Type">
                          <Select
                            options={["full", "school", "module"].map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                        </Form.Item>
                      </Col>

                      <Col md={6} xs={24}>
                        <Form.Item name="modules" label="Modules">
                          <Select
                            mode="multiple"
                            options={moduleOptions.map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                        </Form.Item>
                      </Col>

                      <Col md={4} xs={24}>
                        <Form.Item
                          name="dryRun"
                          label="Dry Run"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>

                      <Col span={24}>
                        <Button htmlType="submit" type="primary">
                          Request Restore
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card>

                <Card>
                  <Table
                    rowKey={(row) => row?._id || row?.backupId?._id}
                    columns={restoreColumns}
                    dataSource={restoreJobs}
                    scroll={{ x: 800 }}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: "audit",
            label: "Backup Audit Logs",
            children: (
              <Card>
                <Table
                  rowKey={(row) => row?._id || row?.createdAt}
                  columns={auditColumns}
                  dataSource={auditLogs}
                  scroll={{ x: 900 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Backups;