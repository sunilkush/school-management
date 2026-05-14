import React, { useEffect, useState } from "react";
import { Alert, Button, Card, Descriptions, Empty, Form, Input, InputNumber, Modal, Select, Skeleton, Space, Table, Tabs, Tag, message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import PayrollStatusTag from "../components/PayrollStatusTag";
import PayrollStatsCards from "../components/PayrollStatsCards";
import PayrollFilters from "../components/PayrollFilters";
import PayrollPermissionGuard, { hasPermission } from "../components/PayrollPermissionGuard";
import SalaryComponentForm from "../components/SalaryComponentForm";
import SalaryStructureBuilder from "../components/SalaryStructureBuilder";
import PayrollCycleForm from "../components/PayrollCycleForm";
import PayrollRunTable from "../components/PayrollRunTable";
import PayslipPreview from "../components/PayslipPreview";
import PayrollApprovalTimeline from "../components/PayrollApprovalTimeline";
import { fetchPayrollCycles, createPayrollCycle, lockPayrollCycle } from "../slices/payrollCycleSlice";
import { fetchSalaryComponents, createSalaryComponent, deleteSalaryComponent } from "../slices/salaryComponentSlice";
import { fetchSalaryStructures, createSalaryStructure, approveSalaryStructure } from "../slices/salaryStructureSlice";
import { fetchPayrollRunItems, calculatePayrollRun, approvePayrollRun, markPayrollPaid, updatePayrollRunItem } from "../slices/payrollRunSlice";
import { fetchPayslips, generatePayslips, publishPayslips, fetchMyPayslips } from "../slices/payslipSlice";
import { fetchEmployeeLoans, createEmployeeLoan, updateEmployeeLoan } from "../slices/employeeLoanSlice";
import { fetchPayrollSummaryReport, fetchPayrollAuditLogs } from "../slices/payrollReportSlice";
import { savePayrollSettings } from "../slices/payrollSettingSlice";
import { buildPayrollScope, payrollApi } from "../services/payrollApi";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const dateText = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");
const normalizeRows = (data) => (Array.isArray(data) ? data : data ? [data] : []);
const useUser = () => useSelector((state) => state.auth.user);
const usePayrollScope = () => useSelector((state) => buildPayrollScope(state));
const ActionButton = ({ user, permission, children, ...props }) => (
  <PayrollPermissionGuard user={user} permission={permission}>
    <Button {...props}>{children}</Button>
  </PayrollPermissionGuard>
);
const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="m-0 text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="m-0 text-sm text-slate-500">{subtitle}</p>
    </div>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
const SafeTable = ({ columns, dataSource, loading, rowKey = "_id" }) =>
  loading ? <Skeleton active /> : (
    <Table
      rowKey={rowKey}
      dataSource={normalizeRows(dataSource)}
      columns={columns}
      scroll={{ x: 1000 }}
      pagination={{ pageSize: 10 }}
      locale={{ emptyText: <Empty description="No payroll records found" /> }}
    />
  );
const getEmployeeName = (employee) => employee?.userId?.name || employee?.name || employee?.fullName || employee?.email || employee?.userId?.email || "-";
const getEmployeeCode = (employee) => employee?.employeeCode || employee?.userId?.regId || employee?.regId || "-";
const serializeDates = (values) => Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value?.toISOString ? value.toISOString() : value]));
const notify = async (promise, success, reload) => {
  try {
    const result = await promise;
    message.success(success);
    reload?.();
    return result;
  } catch (error) {
    message.error(error?.response?.data?.message || error?.message || error || "Payroll action failed");
    return null;
  }
};

const useEmployees = () => {
  const scope = usePayrollScope();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    payrollApi.employees
      .list(scope)
      .then((data) => !ignore && setEmployees(normalizeRows(data)))
      .catch((error) => !ignore && message.error(error?.response?.data?.message || error?.message || "Employee list load failed"))
      .finally(() => !ignore && setLoading(false));
    return () => { ignore = true; };
  }, [scope.schoolId, scope.academicYearId]);
  return { employees, loading };
};

const CycleCreateButton = ({ user, onCreated }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const createCycle = () => form.validateFields()
    .then((values) => dispatch(createPayrollCycle(serializeDates(values))).unwrap())
    .then(() => {
      message.success("Payroll cycle created");
      setOpen(false);
      form.resetFields();
      onCreated?.();
    })
    .catch((error) => error?.errorFields ? null : message.error(error || "Cycle creation failed"));

  return (
    <>
      <ActionButton user={user} permission="payroll.cycles.manage" type="primary" onClick={() => setOpen(true)}>Create Payroll Cycle</ActionButton>
      <Modal open={open} title="Create Payroll Cycle" onCancel={() => setOpen(false)} onOk={createCycle} destroyOnClose>
        <PayrollCycleForm form={form} />
      </Modal>
    </>
  );
};

export const PayrollDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useUser();
  const { items = [], loading } = useSelector((state) => state.payrollCycles || {});
  const report = useSelector((state) => state.payrollReports?.summary);
  const reload = () => { dispatch(fetchPayrollCycles()); dispatch(fetchPayrollSummaryReport()); };
  useEffect(reload, [dispatch]);
  const latest = items[0] || {};
  const currentRolePath = window.location.pathname.includes("/accountant/") ? "accountant" : window.location.pathname.includes("/principal/") ? "principal" : "schooladmin";

  return (
    <div className="p-4">
      <PageHeader title="Payroll Dashboard" subtitle="Current cycle, approvals, compliance dues and payroll trends">
        <Button onClick={() => navigate(`/dashboard/${currentRolePath}/payroll/cycles`)}>Open Cycles</Button>
        <CycleCreateButton user={user} onCreated={reload} />
      </PageHeader>
      <PayrollStatsCards totalEmployees={latest.totalEmployees} grossPay={latest.grossPay || report?.cards?.grossPay} netPay={latest.netPay || report?.cards?.netPay} deductions={latest.deductions || report?.cards?.deductions} employerContribution={latest.employerContribution || report?.cards?.employerContribution} pendingApprovals={items.filter((item) => item.status === "review").length} />
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="Department-wise payroll cost"><Empty description="Use Reports to view department cost after payroll calculation" /></Card>
        <Card title="Earnings vs deductions"><Descriptions size="small" column={1}><Descriptions.Item label="Gross">{money(report?.cards?.grossPay)}</Descriptions.Item><Descriptions.Item label="Deductions">{money(report?.cards?.deductions)}</Descriptions.Item><Descriptions.Item label="Net">{money(report?.cards?.netPay)}</Descriptions.Item></Descriptions></Card>
        <Card title="Payroll trend by month"><Empty description="Trend appears as cycles are processed" /></Card>
      </div>
      <Card title="Current Payroll Cycle" className="mt-4">
        <SafeTable
          loading={loading}
          dataSource={items}
          columns={[
            { title: "Cycle", dataIndex: "cycleName" },
            { title: "Month", dataIndex: "month" },
            { title: "Year", dataIndex: "year" },
            { title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> },
            { title: "Employees", dataIndex: "totalEmployees" },
            { title: "Gross", dataIndex: "grossPay", render: money },
            { title: "Deductions", dataIndex: "deductions", render: money },
            { title: "Net", dataIndex: "netPay", render: money },
            { title: "Payment Date", dataIndex: "paymentDate", render: dateText },
            {
              title: "Actions",
              render: (_, row) => (
                <Space wrap>
                  <ActionButton user={user} permission="payroll.runs.manage" onClick={() => notify(dispatch(calculatePayrollRun(row._id)).unwrap(), "Payroll calculated", reload)}>Process</ActionButton>
                  <ActionButton user={user} permission="payroll.approve" onClick={() => notify(dispatch(approvePayrollRun(row._id)).unwrap(), "Payroll approved", reload)}>Approve</ActionButton>
                  <Button onClick={() => navigate(`/dashboard/${currentRolePath}/payroll/runs/${row._id}`)}>Review Run</Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export const PayrollSettingsPage = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  return (
    <div className="p-4">
      <PageHeader title="Payroll Settings" subtitle="Configure salary frequency, working days, statutory PF/ESI/TDS/PT and rounding" />
      <Card>
        <Form form={form} layout="vertical" initialValues={{ payrollEnabled: true, salaryFrequency: "monthly", workingDaysMethod: "attendance_days", currency: "INR", roundingMethod: "nearest", pf: { enabled: false, wageCeiling: 15000 }, esi: { enabled: false, wageCeiling: 21000 }, tds: { enabled: false }, professionalTax: { enabled: false } }} onFinish={(values) => notify(dispatch(savePayrollSettings(values)).unwrap(), "Settings saved")}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Form.Item label="Payroll Enabled" name="payrollEnabled" valuePropName="checked"><input type="checkbox" /></Form.Item>
            <Form.Item label="Salary Frequency" name="salaryFrequency"><select><option value="monthly">Monthly</option></select></Form.Item>
            <Form.Item label="Default Pay Day" name="defaultPayDay"><InputNumber min={1} max={31} className="w-full" /></Form.Item>
            <Form.Item label="Working Days Method" name="workingDaysMethod"><Select options={["attendance_days", "calendar_days", "fixed_days"].map((value) => ({ label: value, value }))} /></Form.Item>
            <Form.Item label="Currency" name="currency"><Input /></Form.Item>
            <Form.Item label="Rounding Method" name="roundingMethod"><Select options={["nearest", "ceil", "floor", "none"].map((value) => ({ label: value, value }))} /></Form.Item>
            <Form.Item label="PF Enabled" name={["pf", "enabled"]} valuePropName="checked"><input type="checkbox" /></Form.Item>
            <Form.Item label="PF Wage Ceiling" name={["pf", "wageCeiling"]}><InputNumber className="w-full" /></Form.Item>
            <Form.Item label="ESI Enabled" name={["esi", "enabled"]} valuePropName="checked"><input type="checkbox" /></Form.Item>
            <Form.Item label="ESI Wage Ceiling" name={["esi", "wageCeiling"]}><InputNumber className="w-full" /></Form.Item>
            <Form.Item label="TDS Enabled" name={["tds", "enabled"]} valuePropName="checked"><input type="checkbox" /></Form.Item>
            <Form.Item label="Professional Tax Enabled" name={["professionalTax", "enabled"]} valuePropName="checked"><input type="checkbox" /></Form.Item>
          </div>
          <Button type="primary" htmlType="submit">Save Settings</Button>
          <Button className="ml-2" onClick={() => form.resetFields()}>Reset to Default</Button>
        </Form>
      </Card>
    </div>
  );
};

export const SalaryComponentsPage = () => {
  const dispatch = useDispatch();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const state = useSelector((s) => s.salaryComponents || {});
  const reload = () => dispatch(fetchSalaryComponents());
  useEffect(() => { reload(); }, [dispatch]);
  return (
    <div className="p-4">
      <PageHeader title="Salary Components" subtitle="Manage earnings, deductions and employer contribution templates">
        <ActionButton user={user} permission="payroll.components.manage" type="primary" onClick={() => setOpen(true)}>Add Component</ActionButton>
      </PageHeader>
      <SafeTable loading={state.loading} dataSource={state.items} columns={["name", "code", "type", "calculationType", "percentageOf", "value", "taxable", "pfApplicable", "esiApplicable"].map((key) => ({ title: key, dataIndex: key, render: (value) => typeof value === "boolean" ? (value ? "Yes" : "No") : value })).concat([{ title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> }, { title: "Actions", render: (_, row) => <ActionButton user={user} permission="payroll.components.manage" danger onClick={() => Modal.confirm({ title: "Deactivate component?", onOk: () => notify(dispatch(deleteSalaryComponent(row._id)).unwrap(), "Component deactivated", reload) })}>Deactivate</ActionButton> }])} />
      <Modal open={open} title="Add Salary Component" onCancel={() => setOpen(false)} onOk={() => form.validateFields().then((values) => dispatch(createSalaryComponent(values)).unwrap()).then(() => { message.success("Component saved"); setOpen(false); form.resetFields(); reload(); }).catch((error) => error?.errorFields ? null : message.error(error || "Component save failed"))} destroyOnClose>
        <SalaryComponentForm form={form} />
      </Modal>
    </div>
  );
};

export const SalaryStructurePage = () => {
  const dispatch = useDispatch();
  const user = useUser();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);
  const [form] = Form.useForm();
  const { employees, loading: employeesLoading } = useEmployees();
  const state = useSelector((s) => s.salaryStructures || {});
  const reload = () => dispatch(fetchSalaryStructures());
  useEffect(() => { reload(); }, [dispatch]);
  const handleSubmit = (values) => notify(dispatch(createSalaryStructure(serializeDates(values))).unwrap(), "Structure saved", () => { setOpen(false); form.resetFields(); reload(); });

  return (
    <div className="p-4">
      <PageHeader title="Salary Structures" subtitle="Create, revise, view and approve employee CTC structures">
        <ActionButton user={user} permission="payroll.salaryStructure.manage" type="primary" onClick={() => { form.resetFields(); setOpen(true); }}>Create Salary Structure</ActionButton>
      </PageHeader>
      <PayrollFilters />
      <SafeTable loading={state.loading} dataSource={state.items} columns={[
        { title: "Employee Name", render: (_, row) => getEmployeeName(row.employeeId) },
        { title: "Employee Code", render: (_, row) => getEmployeeCode(row.employeeId) },
        { title: "Department", dataIndex: ["employeeId", "department"] },
        { title: "Designation", dataIndex: ["employeeId", "designation"] },
        { title: "Effective From", dataIndex: "effectiveFrom", render: dateText },
        { title: "Gross Monthly", dataIndex: "grossMonthly", render: money },
        { title: "Net Monthly", dataIndex: "netMonthly", render: money },
        { title: "CTC Monthly", dataIndex: "ctcMonthly", render: money },
        { title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> },
        { title: "Actions", render: (_, row) => <Space wrap><Button onClick={() => setActive(row)}>View</Button><ActionButton user={user} permission="payroll.approve" onClick={() => notify(dispatch(approveSalaryStructure(row._id)).unwrap(), "Salary structure approved", reload)}>Approve</ActionButton></Space> },
      ]} />
      <Modal width={1100} open={open} title="Salary Structure Builder" onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <SalaryStructureBuilder form={form} onFinish={handleSubmit} employees={employees} employeesLoading={employeesLoading} />
      </Modal>
      <Modal width={900} open={!!active} title="Salary Structure Details" onCancel={() => setActive(null)} footer={<Button onClick={() => setActive(null)}>Close</Button>}>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Employee">{getEmployeeName(active?.employeeId)}</Descriptions.Item>
          <Descriptions.Item label="Status"><PayrollStatusTag status={active?.status} /></Descriptions.Item>
          <Descriptions.Item label="Gross">{money(active?.grossMonthly)}</Descriptions.Item>
          <Descriptions.Item label="Net">{money(active?.netMonthly)}</Descriptions.Item>
          <Descriptions.Item label="Monthly CTC">{money(active?.ctcMonthly)}</Descriptions.Item>
          <Descriptions.Item label="Yearly CTC">{money(active?.ctcYearly)}</Descriptions.Item>
        </Descriptions>
      </Modal>
    </div>
  );
};

export const PayrollCyclePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useUser();
  const state = useSelector((s) => s.payrollCycles || {});
  const rolePath = window.location.pathname.includes("/accountant/") ? "accountant" : "schooladmin";
  const reload = () => dispatch(fetchPayrollCycles());
  useEffect(() => { reload(); }, [dispatch]);
  const action = (label, permission, promiseFactory, success) => <ActionButton user={user} permission={permission} onClick={() => notify(promiseFactory(), success, reload)}>{label}</ActionButton>;
  return (
    <div className="p-4">
      <PageHeader title="Payroll Cycles" subtitle="Create monthly cycles, process payroll, pay and lock">
        <CycleCreateButton user={user} onCreated={reload} />
      </PageHeader>
      <SafeTable loading={state.loading} dataSource={state.items} columns={[
        { title: "Cycle", dataIndex: "cycleName" }, { title: "Month", dataIndex: "month" }, { title: "Year", dataIndex: "year" },
        { title: "Start", dataIndex: "startDate", render: dateText }, { title: "End", dataIndex: "endDate", render: dateText }, { title: "Payment", dataIndex: "paymentDate", render: dateText },
        { title: "Employees", dataIndex: "totalEmployees" }, { title: "Gross", dataIndex: "grossPay", render: money }, { title: "Deductions", dataIndex: "deductions", render: money }, { title: "Net", dataIndex: "netPay", render: money },
        { title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> },
        { title: "Actions", render: (_, row) => <Space wrap>
          {action("Calculate", "payroll.runs.manage", () => dispatch(calculatePayrollRun(row._id)).unwrap(), "Payroll calculated")}
          <Button onClick={() => navigate(`/dashboard/${rolePath}/payroll/runs/${row._id}`)}>Review Run</Button>
          {action("Approve", "payroll.approve", () => dispatch(approvePayrollRun(row._id)).unwrap(), "Payroll approved")}
          {action("Generate Payslips", "payroll.payslips.manage", () => dispatch(generatePayslips(row._id)).unwrap(), "Payslips generated")}
          {action("Publish", "payroll.payslips.manage", () => dispatch(publishPayslips(row._id)).unwrap(), "Payslips published")}
          {action("Mark Paid", "payroll.runs.manage", () => dispatch(markPayrollPaid(row._id)).unwrap(), "Payroll marked paid")}
          <ActionButton user={user} permission="payroll.cycles.manage" onClick={() => Modal.confirm({ title: "Lock payroll cycle?", content: "Locked cycles cannot be edited.", onOk: () => notify(dispatch(lockPayrollCycle(row._id)).unwrap(), "Payroll cycle locked", reload) })}>Lock</ActionButton>
        </Space> },
      ]} />
    </div>
  );
};

export const PayrollRunPage = () => {
  const dispatch = useDispatch();
  const { cycleId } = useParams();
  const state = useSelector((s) => s.payrollRuns || {});
  useEffect(() => { if (cycleId) dispatch(fetchPayrollRunItems(cycleId)); }, [dispatch, cycleId]);
  const refresh = () => cycleId && dispatch(fetchPayrollRunItems(cycleId));
  return <div className="p-4"><PageHeader title="Payroll Run" subtitle="Review employee-wise earnings, deductions, statutory and net salary"><PayrollApprovalTimeline status={state.run?.status || "review"} /></PageHeader>{cycleId ? <PayrollRunTable items={state.items} loading={state.loading} onRecalculate={() => notify(dispatch(calculatePayrollRun(cycleId)).unwrap(), "Payroll recalculated", refresh)} onApproveItem={(item) => notify(dispatch(updatePayrollRunItem({ itemId: item._id, data: { status: "approved" } })).unwrap(), "Payroll item approved", refresh)} onHoldPayment={(item) => notify(dispatch(updatePayrollRunItem({ itemId: item._id, data: { paymentStatus: "hold", status: "review" } })).unwrap(), "Payment put on hold", refresh)} /> : <Alert type="info" showIcon message="Select a payroll cycle and click Review Run to load employee-wise payroll items." />}</div>;
};

export const PayslipPage = ({ mine = false }) => {
  const dispatch = useDispatch();
  const scope = usePayrollScope();
  const state = useSelector((s) => s.payslips || {});
  const [active, setActive] = useState(null);
  const reload = () => dispatch(mine ? fetchMyPayslips() : fetchPayslips());
  useEffect(() => { reload(); }, [dispatch, mine]);
  const download = (row) => notify(payrollApi.payslips.download(row._id, scope), "Payslip download payload loaded");
  return (
    <div className="p-4">
      <PageHeader title={mine ? "My Payslips" : "Payslips"} subtitle="Preview, publish, email and download payslips" />
      {!mine && <PayrollFilters />}
      <SafeTable loading={state.loading} dataSource={state.items} columns={[
        { title: "Payslip No", dataIndex: "payslipNumber" }, { title: "Month", dataIndex: "month" }, { title: "Year", dataIndex: "year" },
        { title: "Gross", dataIndex: "grossPay", render: money }, { title: "Deductions", dataIndex: "deductions", render: money }, { title: "Net", dataIndex: "netPay", render: money },
        { title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> },
        { title: "Actions", render: (_, row) => <Space wrap><Button onClick={() => setActive(row)}>Preview</Button><Button onClick={() => download(row)}>Download</Button><Button onClick={() => message.success("Email request queued")}>Send Email</Button></Space> },
      ]} />
      <Modal width={900} open={!!active} onCancel={() => setActive(null)} footer={null}><PayslipPreview payslip={active} onDownload={() => download(active)} /></Modal>
    </div>
  );
};

export const MyPayslipsPage = () => <PayslipPage mine />;

export const EmployeeLoanPage = ({ mine = false }) => {
  const dispatch = useDispatch();
  const user = useUser();
  const { employees, loading: employeesLoading } = useEmployees();
  const state = useSelector((s) => s.employeeLoans || {});
  const [form] = Form.useForm();
  const reload = () => dispatch(fetchEmployeeLoans());
  useEffect(() => { reload(); }, [dispatch]);
  const submit = (values) => notify(dispatch(createEmployeeLoan(serializeDates(values))).unwrap(), "Loan request submitted", () => { form.resetFields(); reload(); });
  const employeeOptions = employees.map((employee) => ({ label: `${getEmployeeName(employee)} (${getEmployeeCode(employee)})`, value: employee._id }));
  return (
    <div className="p-4">
      <PageHeader title={mine ? "My Loan / Advance Requests" : "Employee Loans & Advances"} subtitle="Request, approve, reject and close salary advances" />
      <Card title="Loan Request Form" className="mb-4">
        <Form form={form} layout="vertical" onFinish={submit} className="grid grid-cols-1 gap-3 md:grid-cols-4" initialValues={{ loanType: "advance", totalInstallments: 1 }}>
          {!mine && hasPermission(user, "payroll.loans.manage") && <Form.Item label="Employee" name="employeeId" rules={[{ required: true }]}><Select loading={employeesLoading} showSearch optionFilterProp="label" options={employeeOptions} /></Form.Item>}
          <Form.Item label="Loan Type" name="loanType" rules={[{ required: true }]}><Select options={["advance", "loan", "salary_advance"].map((value) => ({ label: value, value }))} /></Form.Item>
          <Form.Item label="Principal Amount" name="principalAmount" rules={[{ required: true }]}><InputNumber min={1} className="w-full" /></Form.Item>
          <Form.Item label="EMI Amount" name="emiAmount"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item label="Installments" name="totalInstallments"><InputNumber min={1} className="w-full" /></Form.Item>
          <Form.Item label="Reason" name="reason" className="md:col-span-2"><Input /></Form.Item>
          <Form.Item label=" " className="flex items-end"><Button type="primary" htmlType="submit">Submit Request</Button></Form.Item>
        </Form>
      </Card>
      <SafeTable loading={state.loading} dataSource={state.items} columns={["employeeId", "loanType", "principalAmount", "emiAmount", "totalInstallments", "paidInstallments", "balance"].map((key) => ({ title: key, dataIndex: key, render: ["principalAmount", "emiAmount", "balance"].includes(key) ? money : undefined })).concat([{ title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> }, { title: "Actions", render: (_, row) => <Space wrap><Button onClick={() => message.info(row.reason || "No reason captured")}>View</Button><ActionButton user={user} permission="payroll.loans.manage" onClick={() => notify(dispatch(updateEmployeeLoan({ id: row._id, data: { status: "approved" } })).unwrap(), "Loan approved", reload)}>Approve</ActionButton><ActionButton user={user} permission="payroll.loans.manage" danger onClick={() => notify(dispatch(updateEmployeeLoan({ id: row._id, data: { status: "rejected" } })).unwrap(), "Loan rejected", reload)}>Reject</ActionButton><ActionButton user={user} permission="payroll.loans.manage" onClick={() => notify(dispatch(updateEmployeeLoan({ id: row._id, data: { status: "closed", balance: 0 } })).unwrap(), "Loan closed", reload)}>Close</ActionButton></Space> }])} />
    </div>
  );
};

export const TaxDeclarationPage = ({ mine = false }) => {
  const scope = usePayrollScope();
  const { employees, loading: employeesLoading } = useEmployees();
  const [form] = Form.useForm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const user = useUser();
  const load = () => { setLoading(true); payrollApi.tax.list(scope).then((data) => setRows(normalizeRows(data))).catch((error) => message.error(error?.response?.data?.message || error?.message || "Tax declarations load failed")).finally(() => setLoading(false)); };
  useEffect(load, [scope.schoolId, scope.academicYearId]);
  const submit = (values) => notify(payrollApi.tax.save(values, scope), "Tax declaration saved", () => { form.resetFields(); load(); });
  const employeeOptions = employees.map((employee) => ({ label: `${getEmployeeName(employee)} (${getEmployeeCode(employee)})`, value: employee._id }));
  return (
    <div className="p-4">
      <PageHeader title={mine ? "My Tax Declaration" : "Tax Declarations"} subtitle="PAN, tax regime, investment declarations, HRA and proof uploads" />
      <Card className="mb-4" title="Submit Declaration">
        <Form form={form} layout="vertical" onFinish={submit} className="grid grid-cols-1 gap-3 md:grid-cols-4" initialValues={{ taxRegime: "new", financialYear: `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}` }}>
          {!mine && hasPermission(user, "payroll.tax.manage") && <Form.Item label="Employee" name="employeeId" rules={[{ required: true }]}><Select loading={employeesLoading} showSearch optionFilterProp="label" options={employeeOptions} /></Form.Item>}
          <Form.Item label="Financial Year" name="financialYear" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Tax Regime" name="taxRegime"><Select options={["new", "old"].map((value) => ({ label: value, value }))} /></Form.Item>
          <Form.Item label="PAN" name="pan"><Input /></Form.Item>
          <Form.Item label="Estimated Income" name="estimatedIncome"><InputNumber min={0} className="w-full" /></Form.Item>
          <Form.Item label=" " className="flex items-end"><Button type="primary" htmlType="submit">Save / Submit</Button></Form.Item>
        </Form>
      </Card>
      <SafeTable loading={loading} dataSource={rows} columns={[{ title: "Employee", dataIndex: "employeeId" }, { title: "Financial Year", dataIndex: "financialYear" }, { title: "Regime", dataIndex: "taxRegime" }, { title: "PAN", dataIndex: "pan" }, { title: "Estimated Income", dataIndex: "estimatedIncome", render: money }, { title: "Status", dataIndex: "status", render: (status) => <PayrollStatusTag status={status} /> }]} />
    </div>
  );
};

export const PayrollReportsPage = () => {
  const dispatch = useDispatch();
  const report = useSelector((s) => s.payrollReports?.summary);
  useEffect(() => { dispatch(fetchPayrollSummaryReport()); }, [dispatch]);
  const rows = ["Payroll Summary", "Department Cost Report", "Employee Salary Register", "Bank Transfer Report", "PF Report", "ESI Report", "TDS Report", "Professional Tax Report", "Loan Deduction Report"].map((name, index) => ({ _id: index, name, type: name.split(" ")[0], month: "Current", year: new Date().getFullYear() }));
  return <div className="p-4"><PageHeader title="Payroll Reports" subtitle="Summary, department cost, bank exports and statutory reports" /><PayrollStatsCards grossPay={report?.cards?.grossPay} netPay={report?.cards?.netPay} deductions={report?.cards?.deductions} employerContribution={report?.cards?.employerContribution} /><Card className="mt-4"><SafeTable dataSource={rows} columns={[{ title: "Report Name", dataIndex: "name" }, { title: "Type", dataIndex: "type" }, { title: "Month", dataIndex: "month" }, { title: "Year", dataIndex: "year" }, { title: "Generated By", render: () => "System" }, { title: "Generated At", render: () => new Date().toLocaleString() }, { title: "Actions", render: (_, row) => <Space wrap><Button onClick={() => message.info(`${row.name} opened`)}>View</Button><Button onClick={() => message.success(`${row.name} export started`)}>Export Excel</Button><Button onClick={() => message.success(`${row.name} PDF export started`)}>Export PDF</Button></Space> }]} /></Card></div>;
};

export const SuperAdminPayrollOverview = () => <div className="p-4"><PageHeader title="Payroll Management Overview" subtitle="View payroll module usage across all schools" /><PayrollStatsCards totalEmployees={0} grossPay={0} netPay={0} deductions={0} employerContribution={0} pendingApprovals={0} /><Card className="mt-4" title="School Payroll Usage"><SafeTable dataSource={[]} columns={["School Name", "Plan", "Payroll Enabled", "Employees Count", "Last Payroll Month", "Last Payroll Status", "Monthly Payroll Cost", "Subscription Status"].map((title) => ({ title, dataIndex: title })).concat([{ title: "Actions", render: () => <Space><Button onClick={() => message.info("Open school payroll details")}>View</Button><Button onClick={() => message.info("Plan management opened")}>Manage Plan</Button></Space> }])} /></Card></div>;
export const PrincipalPayrollApprovalPage = () => <div className="p-4"><PageHeader title="Principal Payroll Approvals" subtitle="Review, approve, reject or send payroll back for correction" /><PayrollDashboard /></div>;
export const AccountantPayrollWorkspace = () => <div className="p-4"><PageHeader title="Accountant Payroll Workspace" subtitle="Cycles, runs, adjustments, payslips and bank exports" /><Tabs items={[{ key: "cycles", label: "Payroll Cycles", children: <PayrollCyclePage /> }, { key: "run", label: "Payroll Run", children: <PayrollRunPage /> }, { key: "adjustments", label: "Adjustments", children: <Card><Tag color="blue">Ready</Tag> Adjustment capture uses payroll run item manual adjustment actions.</Card> }, { key: "payslips", label: "Payslips", children: <PayslipPage /> }, { key: "bank", label: "Bank Export", children: <PayrollReportsPage /> }]} /></div>;
export const HRSalaryManagementPage = () => <div className="p-4"><PageHeader title="HR Salary Management" subtitle="Salary structures, employee loans, tax declarations and revisions" /><Tabs items={[{ key: "salary", label: "Salary Structures", children: <SalaryStructurePage /> }, { key: "loans", label: "Employee Loans", children: <EmployeeLoanPage /> }, { key: "tax", label: "Tax Declarations", children: <TaxDeclarationPage /> }, { key: "revision", label: "Salary Revision", children: <SalaryStructurePage /> }]} /></div>;
export const EmployeeLoanManagementPage = () => <EmployeeLoanPage />;

export const MyPayrollDashboard = () => {
  const navigate = useNavigate();
  const scope = usePayrollScope();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const basePath = window.location.pathname.split("/payroll")[0];
  useEffect(() => {
    setLoading(true);
    payrollApi.self.summary(scope).then(setSummary).catch((error) => message.error(error?.response?.data?.message || error?.message || "Payroll summary load failed")).finally(() => setLoading(false));
  }, [scope.schoolId, scope.academicYearId]);
  const latestPayslip = summary?.payslips?.[0];
  return <div className="p-4"><PageHeader title="My Payroll Dashboard" subtitle="Salary structure, payslips, loan requests and tax declaration" /><PayrollStatsCards grossPay={summary?.structure?.grossMonthly || latestPayslip?.grossPay} netPay={summary?.structure?.netMonthly || latestPayslip?.netPay} deductions={summary?.structure?.totalDeductions || latestPayslip?.deductions} /><Skeleton loading={loading} active><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><Card title="My Salary Structure"><p>Monthly CTC: {money(summary?.structure?.ctcMonthly)}</p><Button onClick={() => navigate(`${basePath}/payroll/salary-structure`)}>View Salary Structure</Button></Card><Card title="My Payslips"><p>Latest payslip: {latestPayslip ? `${latestPayslip.month}/${latestPayslip.year}` : "Not published yet"}</p><Button onClick={() => navigate(`${basePath}/payroll/payslips`)}>View Payslip</Button><Button className="ml-2" disabled={!latestPayslip} onClick={() => latestPayslip && payrollApi.payslips.download(latestPayslip._id, scope).then(() => message.success("Payslip download payload loaded"))}>Download Payslip</Button></Card><Card title="My Loan / Advance Requests"><p>Total requests: {summary?.loans?.length || 0}</p><Button onClick={() => navigate(`${basePath}/payroll/loans`)}>Request Loan/Advance</Button></Card><Card title="My Tax Declaration"><p>Total declarations: {summary?.taxDeclarations?.length || 0}</p><Button onClick={() => navigate(`${basePath}/payroll/tax-declaration`)}>Submit Tax Declaration</Button></Card></div></Skeleton></div>;
};
export const MyLoanRequestPage = () => <EmployeeLoanPage mine />;
export const MyTaxDeclarationPage = () => <TaxDeclarationPage mine />;
export const PayrollAuditReportsPage = () => { const dispatch = useDispatch(); const logs = useSelector((s) => s.payrollReports?.auditLogs || []); useEffect(() => { dispatch(fetchPayrollAuditLogs()); }, [dispatch]); return <div className="p-4"><PageHeader title="Payroll Audit Reports" subtitle="Read-only payroll summary and audit logs" /><PayrollStatsCards grossPay={0} netPay={0} deductions={0} pendingApprovals={0} /><Card title="Audit Logs" className="mt-4"><SafeTable dataSource={logs} columns={["action", "entity", "employeeId", "performedBy", "role", "createdAt", "ipAddress", "remarks"].map((key) => ({ title: key, dataIndex: key, render: key === "createdAt" ? dateText : undefined }))} /></Card></div>; };
