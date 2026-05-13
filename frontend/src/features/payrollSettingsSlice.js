import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payrollSettings", endpoint: "/payroll/settings" });

export const { fetchAll: fetchPayrollSettings, createOne: createPayrollSettings, updateOne: updatePayrollSettings, deleteOne: deletePayrollSettings } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
