import { createPayrollEntitySlice, payrollApi } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "employeeLoans", api: payrollApi.loans });
export const { fetchAll: fetchEmployeeLoans, createOne: createEmployeeLoan, updateOne: updateEmployeeLoan } = entity.thunks;
export default entity.reducer;
