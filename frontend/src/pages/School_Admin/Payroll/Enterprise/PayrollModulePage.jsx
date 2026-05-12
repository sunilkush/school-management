import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import {
  CheckCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LockOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  approveLoan,
  approvePayrollCycle,
  bulkMarkSalaryPaid,
  createLoan,
  createPayrollComponent,
  createPayrollCycle,
  createSalaryStructure,
  createSalaryTemplate,
  deletePayrollComponent,
  deleteSalaryTemplate,
  fetchEmployeeReport,
  fetchLoans,
  fetchLoanReport,
  fetchMyPayroll,
  fetchMyPayslips,
  fetchPayrollComponents,
  fetchPayrollCycleDetail,
  fetchPayrollCycles,
  fetchPayrollSummary,
  fetchPayslips,
  fetchSalaryStructures,
  fetchSalaryTemplates,
  fetchStatutoryReport,
  lockPayrollCycle,
  recalculatePayrollCycle,
  rejectLoan,
  rejectPayrollCycle,
  runPayrollCycle,
  submitPayrollCycle,
} from "../../../../features/payrollModuleSlice";

const { Title, Text } = Typography;
const inr = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const safeText = (value, fallback = "-") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);
const employeeName = (row) =>
  safeText(
    row?.employeeId?.userId?.name ||
      row?.employeeSnapshot?.name ||
      row?.employeeName,
  );
const statusColor = (status) =>
  ({
    draft: "default",
    processing: "processing",
    pending_approval: "warning",
    approved: "success",
    paid: "blue",
    locked: "purple",
    rejected: "error",
    active: "green",
    inactive: "default",
    unpaid: "orange",
    failed: "red",
  })[status] || "default";
const ArrayEditorHint = () => (
  <Alert
    className="mb-4"
    showIcon
    type="info"
    message='Earnings/deductions ko JSON array format me paste karein, e.g. [{"name":"Basic","code":"BASIC","type":"earning","amount":25000}].'
  />
);
const parseJsonLines = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    message.error("Invalid JSON line items");
    return [];
  }
};
const useAcademicGuard = () => {
  const selectedAcademicYear = useSelector(
    (state) =>
      state.academicYear?.selectedAcademicYear ||
      state.academicYear?.activeYear,
  );
  return { selectedAcademicYear, missing: !selectedAcademicYear?._id };
};

function PageShell({ title, subtitle, children, extra }) {
  const { missing } = useAcademicGuard();
  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <div>
          <Title level={3} className="!mb-1">
            {title}
          </Title>
          <Text type="secondary">{subtitle}</Text>
        </div>
        <Space wrap>{extra}</Space>
      </div>
      {missing && (
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          message="Active academic year missing"
          description="Payroll data academicYearId scoped hai. Pehle active academic year select/activate karein."
        />
      )}
      {children}
    </div>
  );
}

function DashboardPage() {
  const dispatch = useDispatch();
  const { reports, cycles, loading, error } = useSelector(
    (s) => s.payrollModule,
  );
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) {
      dispatch(fetchPayrollSummary());
      dispatch(fetchPayrollCycles());
    }
  }, [dispatch, missing]);
  const summary = reports.summary?.summary || {};
  const trend = reports.summary?.trend || [];
  return (
    <PageShell
      title="Payroll Dashboard"
      subtitle="Enterprise payroll overview, paid/unpaid status, trend aur audit-ready summaries."
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={() => dispatch(fetchPayrollSummary())}
        >
          Refresh
        </Button>
      }
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={safeText(error)}
        />
      )}
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Card>
                <Statistic
                  title="Employees Processed"
                  value={summary.employees || 0}
                />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic title="Gross" value={inr(summary.gross)} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic title="Deductions" value={inr(summary.deductions)} />
              </Card>
            </Col>
            <Col xs={24} md={6}>
              <Card>
                <Statistic title="Net Payable" value={inr(summary.net)} />
              </Card>
            </Col>
          </Row>
          <Row gutter={[16, 16]} className="mt-4">
            <Col xs={24} lg={14}>
              <Card title="Payroll Trend">
                <div className="space-y-3">
                  {trend.length ? (
                    trend.map((t) => (
                      <div
                        key={`${t.year}-${t.month}`}
                        className="flex items-center gap-3"
                      >
                        <Text className="w-20">
                          {t.month}/{t.year}
                        </Text>
                        <div className="h-3 bg-blue-100 rounded flex-1">
                          <div
                            className="h-3 bg-blue-500 rounded"
                            style={{
                              width: `${Math.min(100, (Number(t.totalNetPayable || 0) / Math.max(1, Number(summary.net || 1))) * 100)}%`,
                            }}
                          />
                        </div>
                        <Text>{inr(t.totalNetPayable)}</Text>
                      </div>
                    ))
                  ) : (
                    <Empty />
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title="Recent Cycles">
                <Table
                  size="small"
                  pagination={false}
                  dataSource={cycles.slice(0, 6)}
                  rowKey="_id"
                  columns={[
                    {
                      title: "Month",
                      render: (_, r) => `${r.month}/${r.year}`,
                    },
                    {
                      title: "Status",
                      dataIndex: "status",
                      render: (s) => (
                        <Tag color={statusColor(s)}>
                          {safeText(s).replaceAll("_", " ")}
                        </Tag>
                      ),
                    },
                    { title: "Net", dataIndex: "totalNetPayable", render: inr },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </PageShell>
  );
}

function ComponentsPage() {
  const dispatch = useDispatch();
  const { components, loading, saving, error } = useSelector(
    (s) => s.payrollModule,
  );
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchPayrollComponents());
  }, [dispatch, missing]);
  const submit = async () => {
    const values = await form.validateFields();
    await dispatch(createPayrollComponent(values)).unwrap();
    message.success("Component saved");
    setOpen(false);
    form.resetFields();
  };
  return (
    <PageShell
      title="Salary Components"
      subtitle="School-wise earning, deduction aur employer contribution setup."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          New Component
        </Button>
      }
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={safeText(error)}
        />
      )}
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={components}
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              sorter: (a, b) =>
                safeText(a.name).localeCompare(safeText(b.name)),
            },
            { title: "Code", dataIndex: "code" },
            {
              title: "Type",
              dataIndex: "type",
              render: (t) => (
                <Tag
                  color={
                    t === "earning"
                      ? "green"
                      : t === "deduction"
                        ? "red"
                        : "blue"
                  }
                >
                  {safeText(t)}
                </Tag>
              ),
            },
            { title: "Default", dataIndex: "defaultAmount", render: inr },
            {
              title: "Status",
              dataIndex: "isActive",
              render: (v) => (
                <Tag color={v ? "green" : "default"}>
                  {v ? "Active" : "Inactive"}
                </Tag>
              ),
            },
            {
              title: "Action",
              render: (_, row) => (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() =>
                    Modal.confirm({
                      title: "Deactivate component?",
                      onOk: () => dispatch(deletePayrollComponent(row._id)),
                    })
                  }
                >
                  Deactivate
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        title="Create Salary Component"
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        extra={
          <Button loading={saving} type="primary" onClick={submit}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="Code" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select
              options={["earning", "deduction", "employer_contribution"].map(
                (v) => ({ value: v, label: v }),
              )}
            />
          </Form.Item>
          <Form.Item name="calculationType" label="Calculation">
            <Select
              options={["fixed", "percentage"].map((v) => ({
                value: v,
                label: v,
              }))}
            />
          </Form.Item>
          <Form.Item name="defaultAmount" label="Default Amount">
            <InputNumber className="w-full" min={0} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  );
}

function TemplatesPage() {
  const dispatch = useDispatch();
  const { templates, loading, saving, error } = useSelector(
    (s) => s.payrollModule,
  );
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchSalaryTemplates());
  }, [dispatch, missing]);
  const submit = async () => {
    const v = await form.validateFields();
    await dispatch(
      createSalaryTemplate({
        ...v,
        earnings: parseJsonLines(v.earningsJson),
        deductions: parseJsonLines(v.deductionsJson),
        employerContributions: parseJsonLines(v.employerJson),
      }),
    ).unwrap();
    message.success("Template saved");
    setOpen(false);
    form.resetFields();
  };
  return (
    <PageShell
      title="Salary Templates"
      subtitle="Department/role/designation-wise template mapping with gross and CTC calculation."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          New Template
        </Button>
      }
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={safeText(error)}
        />
      )}
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={templates}
          columns={[
            { title: "Name", dataIndex: "name" },
            { title: "Department", dataIndex: "department" },
            { title: "Role", dataIndex: "role" },
            { title: "Designation", dataIndex: "designation" },
            { title: "Gross", dataIndex: "grossSalary", render: inr },
            { title: "CTC", dataIndex: "ctc", render: inr },
            {
              title: "Status",
              dataIndex: "isActive",
              render: (v) => (
                <Tag color={v ? "green" : "default"}>
                  {v ? "Active" : "Inactive"}
                </Tag>
              ),
            },
            {
              title: "Action",
              render: (_, row) => (
                <Button
                  danger
                  onClick={() =>
                    Modal.confirm({
                      title: "Deactivate template?",
                      onOk: () => dispatch(deleteSalaryTemplate(row._id)),
                    })
                  }
                >
                  Deactivate
                </Button>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        title="Create Salary Template"
        open={open}
        onClose={() => setOpen(false)}
        width={620}
        extra={
          <Button loading={saving} type="primary" onClick={submit}>
            Save
          </Button>
        }
      >
        <ArrayEditorHint />
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="department" label="Department">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="role" label="Role">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="designation" label="Designation">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="earningsJson"
            label="Earnings JSON"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="deductionsJson" label="Deductions JSON">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="employerJson" label="Employer Contributions JSON">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  );
}

function StructuresPage() {
  const dispatch = useDispatch();
  const { structures, templates, loading, saving, error } = useSelector(
    (s) => s.payrollModule,
  );
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) {
      dispatch(fetchSalaryStructures());
      dispatch(fetchSalaryTemplates());
    }
  }, [dispatch, missing]);
  const submit = async () => {
    const v = await form.validateFields();
    const template = templates.find((t) => t._id === v.templateId);
    await dispatch(
      createSalaryStructure({
        ...v,
        earnings: template?.earnings || parseJsonLines(v.earningsJson),
        deductions: template?.deductions || parseJsonLines(v.deductionsJson),
        employerContributions: template?.employerContributions || [],
      }),
    ).unwrap();
    message.success("Salary structure assigned");
    setOpen(false);
    form.resetFields();
  };
  return (
    <PageShell
      title="Employee Salary Structure"
      subtitle="Effective-dated structure assignment, salary preview and revision history."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          Assign Structure
        </Button>
      }
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={safeText(error)}
        />
      )}
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={structures}
          columns={[
            { title: "Employee", render: (_, r) => employeeName(r) },
            {
              title: "Code",
              render: (_, r) => safeText(r.employeeId?.employeeCode),
            },
            {
              title: "Department",
              render: (_, r) => safeText(r.employeeId?.department),
            },
            {
              title: "Effective From",
              dataIndex: "effectiveFrom",
              render: (v) => safeText(v).slice(0, 10),
            },
            { title: "Gross", dataIndex: "grossSalary", render: inr },
            { title: "Deductions", dataIndex: "totalDeductions", render: inr },
            { title: "Net", dataIndex: "netSalary", render: inr },
            {
              title: "Status",
              dataIndex: "status",
              render: (s) => <Tag color={statusColor(s)}>{safeText(s)}</Tag>,
            },
          ]}
        />
      </Card>
      <Drawer
        title="Assign Salary Structure"
        open={open}
        onClose={() => setOpen(false)}
        width={620}
        extra={
          <Button loading={saving} type="primary" onClick={submit}>
            Save
          </Button>
        }
      >
        <Alert
          className="mb-4"
          showIcon
          type="warning"
          message="employeeId ObjectId paste karein. Existing employee selector available ho to yahan connect kiya ja sakta hai."
        />
        <ArrayEditorHint />
        <Form form={form} layout="vertical">
          <Form.Item
            name="employeeId"
            label="Employee ID"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="templateId" label="Template">
            <Select
              allowClear
              options={templates.map((t) => ({
                value: t._id,
                label: `${t.name} (${inr(t.grossSalary)})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="effectiveFrom"
            label="Effective From (YYYY-MM-DD)"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="earningsJson" label="Earnings JSON (if no template)">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            name="deductionsJson"
            label="Deductions JSON (if no template)"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="revisionReason" label="Revision Reason">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  );
}

function CyclesPage({ mode = "cycles" }) {
  const dispatch = useDispatch();
  const { cycles, cycleDetail, loading, saving, error } = useSelector(
    (s) => s.payrollModule,
  );
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchPayrollCycles());
  }, [dispatch, missing]);
  const refreshDetail = (id) => dispatch(fetchPayrollCycleDetail(id));
  const selectedEmployees = cycleDetail?.employees || [];
  const submit = async () => {
    const v = await form.validateFields();
    await dispatch(createPayrollCycle(v)).unwrap();
    message.success("Payroll cycle created");
    setOpen(false);
    form.resetFields();
  };
  const action = (title, thunk, payload) =>
    Modal.confirm({
      title,
      onOk: async () => {
        await dispatch(thunk(payload)).unwrap();
        message.success(title);
        dispatch(fetchPayrollCycles());
        if (payload.id) refreshDetail(payload.id);
      },
    });
  return (
    <PageShell
      title={
        mode === "approval"
          ? "Payroll Approval"
          : mode === "run"
            ? "Run Payroll"
            : "Payroll Cycles"
      }
      subtitle="Monthly cycle Draft → Processing → Pending Approval → Approved → Paid → Locked."
      extra={
        <>
          <Button
            onClick={() => dispatch(fetchPayrollCycles())}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setOpen(true)}
          >
            New Cycle
          </Button>
        </>
      }
    >
      {error && (
        <Alert
          className="mb-4"
          type="error"
          showIcon
          message={safeText(error)}
        />
      )}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card>
            <Table
              loading={loading}
              rowKey="_id"
              dataSource={cycles}
              pagination={{ pageSize: 8 }}
              onRow={(r) => ({ onClick: () => refreshDetail(r._id) })}
              columns={[
                { title: "Month", render: (_, r) => `${r.month}/${r.year}` },
                {
                  title: "Status",
                  dataIndex: "status",
                  render: (s) => (
                    <Tag color={statusColor(s)}>
                      {safeText(s).replaceAll("_", " ")}
                    </Tag>
                  ),
                },
                { title: "Net", dataIndex: "totalNetPayable", render: inr },
                {
                  title: "Actions",
                  render: (_, r) => (
                    <Space wrap>
                      <Button
                        size="small"
                        icon={<PlayCircleOutlined />}
                        loading={saving}
                        onClick={(e) => {
                          e.stopPropagation();
                          action("Run payroll?", runPayrollCycle, {
                            id: r._id,
                          });
                        }}
                      >
                        Run
                      </Button>
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          action("Submit payroll?", submitPayrollCycle, {
                            id: r._id,
                            body: { remarks: "Submitted from UI" },
                          });
                        }}
                      >
                        Submit
                      </Button>
                      <Button
                        size="small"
                        icon={<CheckCircleOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          action("Approve payroll?", approvePayrollCycle, {
                            id: r._id,
                            body: { remarks: "Approved from UI" },
                          });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        icon={<LockOutlined />}
                        danger
                        onClick={(e) => {
                          e.stopPropagation();
                          action("Lock payroll?", lockPayrollCycle, {
                            id: r._id,
                            body: { remarks: "Locked" },
                          });
                        }}
                      >
                        Lock
                      </Button>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="Cycle Detail">
            {cycleDetail ? (
              <>
                <Descriptions
                  size="small"
                  bordered
                  column={2}
                  items={[
                    {
                      key: "m",
                      label: "Month",
                      children: `${cycleDetail.cycle?.month}/${cycleDetail.cycle?.year}`,
                    },
                    {
                      key: "s",
                      label: "Status",
                      children: (
                        <Tag color={statusColor(cycleDetail.cycle?.status)}>
                          {safeText(cycleDetail.cycle?.status)}
                        </Tag>
                      ),
                    },
                    {
                      key: "g",
                      label: "Gross",
                      children: inr(cycleDetail.cycle?.totalGross),
                    },
                    {
                      key: "n",
                      label: "Net",
                      children: inr(cycleDetail.cycle?.totalNetPayable),
                    },
                  ]}
                />
                <Table
                  className="mt-4"
                  size="small"
                  rowKey="_id"
                  dataSource={selectedEmployees}
                  columns={[
                    { title: "Employee", render: (_, r) => employeeName(r) },
                    { title: "Gross", dataIndex: "grossEarnings", render: inr },
                    {
                      title: "Deduction",
                      dataIndex: "totalDeductions",
                      render: inr,
                    },
                    { title: "Net", dataIndex: "netPayable", render: inr },
                    {
                      title: "Payment",
                      dataIndex: "paymentStatus",
                      render: (s) => (
                        <Tag color={statusColor(s)}>{safeText(s)}</Tag>
                      ),
                    },
                  ]}
                />
              </>
            ) : (
              <Empty description="Select a cycle" />
            )}
          </Card>
        </Col>
      </Row>
      <Drawer
        title="Create Payroll Cycle"
        open={open}
        onClose={() => setOpen(false)}
        width={420}
        extra={
          <Button loading={saving} type="primary" onClick={submit}>
            Create
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="month" label="Month" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} max={12} />
          </Form.Item>
          <Form.Item name="year" label="Year" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={2020} max={2100} />
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  );
}

function PayslipsPage({ self = false }) {
  const dispatch = useDispatch();
  const { payslips, myPayslips, loading, error } = useSelector(
    (s) => s.payrollModule,
  );
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(self ? fetchMyPayslips() : fetchPayslips());
  }, [dispatch, self, missing]);
  const rows = self ? myPayslips : payslips;
  return (
    <PageShell
      title={self ? "My Payslips" : "Payslip Management"}
      subtitle="Approved payroll ke payslip, download status aur payment status."
      extra={
        <Button
          onClick={() => dispatch(self ? fetchMyPayslips() : fetchPayslips())}
        >
          Refresh
        </Button>
      }
    >
      {error && (
        <Alert className="mb-4" type="error" message={safeText(error)} />
      )}
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={rows}
          columns={[
            { title: "Payslip", dataIndex: "payslipNumber" },
            { title: "Month", render: (_, r) => `${r.month}/${r.year}` },
            { title: "Employee", render: (_, r) => employeeName(r) },
            { title: "Net", dataIndex: "netPayable", render: inr },
            {
              title: "Payment",
              dataIndex: "paymentStatus",
              render: (s) => <Tag color={statusColor(s)}>{safeText(s)}</Tag>,
            },
            {
              title: "PDF",
              render: (_, r) => (
                <Button
                  icon={<DownloadOutlined />}
                  href={`${import.meta.env.VITE_API_URL || "/api/v1"}/payroll/payslips/${r._id}/pdf`}
                  target="_blank"
                >
                  PDF
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </PageShell>
  );
}

function PaymentsPage() {
  const dispatch = useDispatch();
  const { cycleDetail, cycles, loading } = useSelector((s) => s.payrollModule);
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchPayrollCycles());
  }, [dispatch, missing]);
  const unpaid = (cycleDetail?.employees || []).filter(
    (e) => e.paymentStatus !== "paid",
  );
  const markPaid = () =>
    Modal.confirm({
      title: "Mark all shown unpaid salaries paid?",
      onOk: () =>
        dispatch(
          bulkMarkSalaryPaid({
            employeePayrollIds: unpaid.map((e) => e._id),
            mode: "bank",
          }),
        ),
    });
  return (
    <PageShell
      title="Salary Payments"
      subtitle="Bulk payment update, mode, transaction/UTR and proof placeholders."
      extra={
        <Button type="primary" onClick={markPaid}>
          Bulk Mark Paid
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card title="Select Cycle">
            <Table
              loading={loading}
              rowKey="_id"
              dataSource={cycles}
              pagination={false}
              onRow={(r) => ({
                onClick: () => dispatch(fetchPayrollCycleDetail(r._id)),
              })}
              columns={[
                { title: "Cycle", render: (_, r) => `${r.month}/${r.year}` },
                {
                  title: "Status",
                  dataIndex: "status",
                  render: (s) => <Tag>{safeText(s)}</Tag>,
                },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="Employee Payments">
            <Table
              rowKey="_id"
              dataSource={cycleDetail?.employees || []}
              columns={[
                { title: "Employee", render: (_, r) => employeeName(r) },
                { title: "Net", dataIndex: "netPayable", render: inr },
                {
                  title: "Status",
                  dataIndex: "paymentStatus",
                  render: (s) => (
                    <Tag color={statusColor(s)}>{safeText(s)}</Tag>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </PageShell>
  );
}

function LoansPage() {
  const dispatch = useDispatch();
  const { loans, loading, saving, error } = useSelector((s) => s.payrollModule);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchLoans());
  }, [dispatch, missing]);
  const submit = async () => {
    const v = await form.validateFields();
    await dispatch(createLoan(v)).unwrap();
    message.success("Loan request saved");
    setOpen(false);
    form.resetFields();
  };
  return (
    <PageShell
      title="Loans & Advances"
      subtitle="Employee loan/advance request, approval, EMI and outstanding balance."
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setOpen(true)}
        >
          New Loan
        </Button>
      }
    >
      {error && (
        <Alert className="mb-4" type="error" message={safeText(error)} />
      )}
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={loans}
          columns={[
            { title: "Employee", render: (_, r) => employeeName(r) },
            { title: "Type", dataIndex: "type" },
            { title: "Amount", dataIndex: "amount", render: inr },
            { title: "EMI", dataIndex: "emiAmount", render: inr },
            {
              title: "Outstanding",
              dataIndex: "remainingBalance",
              render: inr,
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (s) => <Tag color={statusColor(s)}>{safeText(s)}</Tag>,
            },
            {
              title: "Action",
              render: (_, r) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() =>
                      dispatch(
                        approveLoan({
                          id: r._id,
                          body: { remarks: "Approved" },
                        }),
                      )
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    danger
                    onClick={() =>
                      dispatch(
                        rejectLoan({ id: r._id, body: { reason: "Rejected" } }),
                      )
                    }
                  >
                    Reject
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Drawer
        title="Loan/Advance Request"
        open={open}
        onClose={() => setOpen(false)}
        width={460}
        extra={
          <Button loading={saving} type="primary" onClick={submit}>
            Save
          </Button>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="employeeId"
            label="Employee ID"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue="loan">
            <Select
              options={["loan", "advance"].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} />
          </Form.Item>
          <Form.Item name="emiAmount" label="EMI" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date YYYY-MM-DD">
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </PageShell>
  );
}

function ReportsPage({ statutory = false }) {
  const dispatch = useDispatch();
  const { reports, loading, error } = useSelector((s) => s.payrollModule);
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) {
      dispatch(fetchPayrollSummary());
      dispatch(fetchEmployeeReport());
      dispatch(fetchLoanReport());
      if (statutory) dispatch(fetchStatutoryReport());
    }
  }, [dispatch, missing, statutory]);
  const stat = reports.statutory?.totals || {};
  return (
    <PageShell
      title={statutory ? "Statutory Reports" : "Payroll Reports"}
      subtitle="Monthly summary, employee-wise salary, department cost, paid/unpaid and export placeholders."
    >
      {error && (
        <Alert className="mb-4" type="error" message={safeText(error)} />
      )}
      {loading ? (
        <Skeleton active />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {[
              "pf",
              "esi",
              "tds",
              "professionalTax",
              "employerContribution",
            ].map((k) => (
              <Col xs={24} md={statutory ? 4 : 6} key={k}>
                <Card>
                  <Statistic
                    title={k}
                    value={inr(stat[k] || reports.summary?.summary?.[k] || 0)}
                  />
                </Card>
              </Col>
            ))}
          </Row>
          <Card className="mt-4" title="Employee-wise Salary Report">
            <Table
              rowKey="_id"
              dataSource={reports.employee}
              columns={[
                { title: "Employee", render: (_, r) => employeeName(r) },
                {
                  title: "Department",
                  render: (_, r) => safeText(r.employeeId?.department),
                },
                { title: "Gross", dataIndex: "grossEarnings", render: inr },
                {
                  title: "Deductions",
                  dataIndex: "totalDeductions",
                  render: inr,
                },
                { title: "Net", dataIndex: "netPayable", render: inr },
                {
                  title: "Payment",
                  dataIndex: "paymentStatus",
                  render: (s) => (
                    <Tag color={statusColor(s)}>{safeText(s)}</Tag>
                  ),
                },
              ]}
            />
          </Card>
          <Alert
            className="mt-4"
            showIcon
            type="info"
            message="Export PDF/Excel placeholder available at API response level; connect export utility when enabled."
          />
        </>
      )}
    </PageShell>
  );
}

function MyPayrollPage() {
  const dispatch = useDispatch();
  const { myPayroll, loading } = useSelector((s) => s.payrollModule);
  const { missing } = useAcademicGuard();
  useEffect(() => {
    if (!missing) dispatch(fetchMyPayroll());
  }, [dispatch, missing]);
  return (
    <PageShell
      title="My Payroll"
      subtitle="Own salary structure, payslips, loans/advance, tax declarations and payment status."
    >
      {loading ? (
        <Skeleton active />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="Salary Structures">
              <Table
                size="small"
                rowKey="_id"
                dataSource={myPayroll?.structures || []}
                columns={[
                  {
                    title: "Effective",
                    dataIndex: "effectiveFrom",
                    render: (v) => safeText(v).slice(0, 10),
                  },
                  { title: "Gross", dataIndex: "grossSalary", render: inr },
                  { title: "Net", dataIndex: "netSalary", render: inr },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Loans">
              <Table
                size="small"
                rowKey="_id"
                dataSource={myPayroll?.loans || []}
                columns={[
                  { title: "Type", dataIndex: "type" },
                  {
                    title: "Outstanding",
                    dataIndex: "remainingBalance",
                    render: inr,
                  },
                  {
                    title: "Status",
                    dataIndex: "status",
                    render: (s) => <Tag>{safeText(s)}</Tag>,
                  },
                ]}
              />
            </Card>
          </Col>
          <Col span={24}>
            <PayslipsPage self />
          </Col>
        </Row>
      )}
    </PageShell>
  );
}

export default function PayrollModulePage({ page = "dashboard" }) {
  const map = useMemo(
    () => ({
      dashboard: <DashboardPage />,
      components: <ComponentsPage />,
      templates: <TemplatesPage />,
      structures: <StructuresPage />,
      cycles: <CyclesPage />,
      run: <CyclesPage mode="run" />,
      approval: <CyclesPage mode="approval" />,
      payslips: <PayslipsPage />,
      payments: <PaymentsPage />,
      loans: <LoansPage />,
      statutory: <ReportsPage statutory />,
      reports: <ReportsPage />,
      my: <MyPayrollPage />,
    }),
    [],
  );
  return map[page] || map.dashboard;
}
