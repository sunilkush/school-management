import { createPayrollEntitySlice, payrollApi } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "salaryComponents", api: payrollApi.components });
export const { fetchAll: fetchSalaryComponents, createOne: createSalaryComponent, updateOne: updateSalaryComponent, removeOne: deleteSalaryComponent } = entity.thunks;
export default entity.reducer;
