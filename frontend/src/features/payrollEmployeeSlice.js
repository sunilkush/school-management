import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payrollEmployee", endpoint: "/payroll/employees" });

export const { fetchAll: fetchPayrollEmployee, createOne: createPayrollEmployee, updateOne: updatePayrollEmployee, deleteOne: deletePayrollEmployee } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
