import { createPayrollResourceSlice } from "./payrollSliceFactory";

const resource = createPayrollResourceSlice({ name: "salaryComponent", endpoint: "/payroll/components" });

export const { fetchAll: fetchSalaryComponent, createOne: createSalaryComponent, updateOne: updateSalaryComponent, deleteOne: deleteSalaryComponent } = resource.thunks;
export const { clearPayrollState, setSelectedPayrollRecord } = resource.actions;
export default resource.reducer;
