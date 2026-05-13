import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "employeeLoan", endpoint: "/payroll/loans" });

export const { fetchAll: fetchEmployeeLoan, createOne: createEmployeeLoan, updateOne: updateEmployeeLoan, deleteOne: deleteEmployeeLoan } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
