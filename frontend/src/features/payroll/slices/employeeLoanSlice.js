import { createPayrollEntitySlice, payrollApi } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "employeeLoans", api: payrollApi.loans });
export const { fetchAll: fetchEmployeeLoans, createOne: createEmployeeLoan } = entity.thunks;
export default entity.reducer;
