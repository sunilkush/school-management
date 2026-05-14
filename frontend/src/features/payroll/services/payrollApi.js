import httpClient from "../../../api/httpClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const buildPayrollScope = (state) => {
  const user = state?.auth?.user;
  const selectedAcademicYear = state?.academicYear?.selectedAcademicYear || state?.academicYear?.activeYear;
  return {
    schoolId: user?.school?._id || user?.schoolId || user?.school,
    academicYearId: selectedAcademicYear?._id || selectedAcademicYear,
  };
};

const withScope = (payload = {}, scope = {}) => ({ ...payload, ...Object.fromEntries(Object.entries(scope).filter(([, v]) => Boolean(v))) });

export const payrollApi = {
  settings: {
    save: (data, scope) => httpClient.post("/payroll/settings", withScope(data, scope)).then(unwrap),
    list: (scope) => httpClient.get("/payroll/settings", { params: scope }).then(unwrap),
    update: (id, data, scope) => httpClient.patch(`/payroll/settings/${id}`, withScope(data, scope)).then(unwrap),
  },
  components: {
    create: (data, scope) => httpClient.post("/payroll/components", withScope(data, scope)).then(unwrap),
    list: (scope) => httpClient.get("/payroll/components", { params: scope }).then(unwrap),
    update: (id, data, scope) => httpClient.patch(`/payroll/components/${id}`, withScope(data, scope)).then(unwrap),
    remove: (id, scope) => httpClient.delete(`/payroll/components/${id}`, { params: scope }).then(unwrap),
  },
  salaryStructures: {
    create: (data, scope) => httpClient.post("/payroll/salary-structures", withScope(data, scope)).then(unwrap),
    list: (scope) => httpClient.get("/payroll/salary-structures", { params: scope }).then(unwrap),
    byEmployee: (employeeId, scope) => httpClient.get(`/payroll/salary-structures/employee/${employeeId}`, { params: scope }).then(unwrap),
    update: (id, data, scope) => httpClient.patch(`/payroll/salary-structures/${id}`, withScope(data, scope)).then(unwrap),
    approve: (id, data, scope) => httpClient.post(`/payroll/salary-structures/${id}/approve`, withScope(data, scope)).then(unwrap),
  },
  cycles: {
    create: (data, scope) => httpClient.post("/payroll/cycles", withScope(data, scope)).then(unwrap),
    list: (scope) => httpClient.get("/payroll/cycles", { params: scope }).then(unwrap),
    get: (id, scope) => httpClient.get(`/payroll/cycles/${id}`, { params: scope }).then(unwrap),
    update: (id, data, scope) => httpClient.patch(`/payroll/cycles/${id}`, withScope(data, scope)).then(unwrap),
    lock: (id, scope) => httpClient.post(`/payroll/cycles/${id}/lock`, scope).then(unwrap),
  },
  runs: {
    calculate: (cycleId, scope) => httpClient.post(`/payroll/runs/${cycleId}/calculate`, scope).then(unwrap),
    items: (cycleId, scope) => httpClient.get(`/payroll/runs/${cycleId}/items`, { params: scope }).then(unwrap),
    updateItem: (itemId, data, scope) => httpClient.patch(`/payroll/runs/items/${itemId}`, withScope(data, scope)).then(unwrap),
    approve: (cycleId, data, scope) => httpClient.post(`/payroll/runs/${cycleId}/approve`, withScope(data, scope)).then(unwrap),
    markPaid: (cycleId, scope) => httpClient.post(`/payroll/runs/${cycleId}/mark-paid`, scope).then(unwrap),
  },
  payslips: {
    generate: (cycleId, scope) => httpClient.post(`/payroll/payslips/${cycleId}/generate`, scope).then(unwrap),
    publish: (cycleId, scope) => httpClient.post(`/payroll/payslips/${cycleId}/publish`, scope).then(unwrap),
    list: (scope) => httpClient.get("/payroll/payslips", { params: scope }).then(unwrap),
    mine: (scope) => httpClient.get("/payroll/payslips/my", { params: scope }).then(unwrap),
    download: (id, scope) => httpClient.get(`/payroll/payslips/${id}/download`, { params: scope }).then(unwrap),
  },
  loans: {
    list: (scope) => httpClient.get("/payroll/loans", { params: scope }).then(unwrap),
    create: (data, scope) => httpClient.post("/payroll/loans", withScope(data, scope)).then(unwrap),
  },
  tax: {
    list: (scope) => httpClient.get("/payroll/tax-declarations", { params: scope }).then(unwrap),
    save: (data, scope) => httpClient.post("/payroll/tax-declarations", withScope(data, scope)).then(unwrap),
  },
  reports: {
    summary: (scope) => httpClient.get("/payroll/reports/summary", { params: scope }).then(unwrap),
    departmentCost: (scope) => httpClient.get("/payroll/reports/department-cost", { params: scope }).then(unwrap),
    statutory: (scope) => httpClient.get("/payroll/reports/statutory", { params: scope }).then(unwrap),
    bankExport: (scope) => httpClient.get("/payroll/reports/bank-export", { params: scope }).then(unwrap),
    employeeLedger: (employeeId, scope) => httpClient.get(`/payroll/reports/employee-ledger/${employeeId}`, { params: scope }).then(unwrap),
    auditLogs: (scope) => httpClient.get("/payroll/audit-logs", { params: scope }).then(unwrap),
  },
};

export default payrollApi;
