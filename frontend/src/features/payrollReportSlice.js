import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payrollReport", endpoint: "/payroll/reports/summary" });

export const { fetchAll: fetchPayrollReport, createOne: createPayrollReport, updateOne: updatePayrollReport, deleteOne: deletePayrollReport } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
