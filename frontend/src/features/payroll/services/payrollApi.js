import httpClient from "../../../api/httpClient";

const withScope = (payload = {}, params = {}) => ({ ...payload, ...params });

export const payrollApi = {
  getPayrollDashboard: (params) => httpClient.get('/payroll/dashboard', { params }),
  getEmployeePayrolls: (params) => httpClient.get('/payroll/employees', { params }),
  createEmployeePayroll: (payload) => httpClient.post('/payroll/employees', payload),
  updateEmployeePayroll: (id, payload) => httpClient.patch(`/payroll/employees/${id}`, payload),
  getSalaryStructures: (params) => httpClient.get('/payroll/salary-structures', { params }),
  createSalaryStructure: (payload) => httpClient.post('/payroll/salary-structures', payload),
  updateSalaryStructure: (id, payload) => httpClient.patch(`/payroll/salary-structures/${id}`, payload),
  getAttendanceAdjustments: (params) => httpClient.get('/payroll/attendance-adjustments', { params }),
  syncAttendanceAdjustments: (payload) => httpClient.post('/payroll/attendance-adjustments/sync', payload),
  updateAttendanceAdjustment: (id, payload) => httpClient.patch(`/payroll/attendance-adjustments/${id}`, payload),
  getPayrollCycles: (params) => httpClient.get('/payroll/cycles', { params }),
  createPayrollCycle: (payload) => httpClient.post('/payroll/cycles', payload),
  updatePayrollCycle: (id, payload) => httpClient.patch(`/payroll/cycles/${id}`, payload),
  runPayroll: (payload) => httpClient.post('/payroll/run', payload),
  previewPayroll: (params) => httpClient.get('/payroll/run/preview', { params }),
  recalculatePayroll: (payload) => httpClient.post('/payroll/run/recalculate', payload),
  submitPayrollForApproval: (cycleId) => httpClient.post(`/payroll/cycles/${cycleId}/submit-approval`),
  getPayrollApprovals: (params) => httpClient.get('/payroll/approvals', { params }),
  approvePayroll: (id, payload) => httpClient.post(`/payroll/approvals/${id}/approve`, payload),
  rejectPayroll: (id, payload) => httpClient.post(`/payroll/approvals/${id}/reject`, payload),
  getPayslips: (params) => httpClient.get('/payroll/payslips', { params }),
  generatePayslips: (payload) => httpClient.post('/payroll/payslips/generate', payload),
  downloadPayslip: (id) => httpClient.get(`/payroll/payslips/${id}/download`, { responseType: 'blob' }),
  emailPayslip: (id) => httpClient.post(`/payroll/payslips/${id}/email`),
  markPayrollPaid: (id, payload) => httpClient.post(`/payroll/cycles/${id}/mark-paid`, payload),
  lockPayrollCycle: (cycleId) => httpClient.post(`/payroll/cycles/${cycleId}/lock`),
  getPayrollReports: (params) => httpClient.get('/payroll/reports', { params }),
  getMyPayroll: (params) => httpClient.get('/payroll/my', { params }),
  getMyPayslips: (params) => httpClient.get('/payroll/my/payslips', { params }),
  createTaxDeclaration: (payload) => httpClient.post('/payroll/my/tax-declarations', payload),
  createLoanAdvanceRequest: (payload) => httpClient.post('/payroll/my/loan-advance', payload),
};

export const withPayrollScope = (payload, scope) => withScope(payload, scope);
export default payrollApi;

export const buildPayrollScope = (state = {}) => ({ schoolId: state?.auth?.user?.schoolId, academicYearId: state?.academicYear?.selectedAcademicYear?._id || state?.auth?.user?.selectedAcademicYear?._id });
