import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payslip", endpoint: "/payroll/payslips" });

export const { fetchAll: fetchPayslip, createOne: createPayslip, updateOne: updatePayslip, deleteOne: deletePayslip } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
