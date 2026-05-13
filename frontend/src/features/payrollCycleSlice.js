import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payrollCycle", endpoint: "/payroll/cycles" });

export const { fetchAll: fetchPayrollCycle, createOne: createPayrollCycle, updateOne: updatePayrollCycle, deleteOne: deletePayrollCycle } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
