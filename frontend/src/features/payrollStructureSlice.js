import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "payrollStructure", endpoint: "/payroll/structures" });

export const { fetchAll: fetchPayrollStructure, createOne: createPayrollStructure, updateOne: updatePayrollStructure, deleteOne: deletePayrollStructure } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
