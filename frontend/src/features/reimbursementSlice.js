import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "reimbursement", endpoint: "/payroll/reimbursements" });

export const { fetchAll: fetchReimbursement, createOne: createReimbursement, updateOne: updateReimbursement, deleteOne: deleteReimbursement } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
