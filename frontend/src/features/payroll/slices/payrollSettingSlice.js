import { createPayrollEntitySlice, payrollApi } from "./createPayrollSlice";
const entity = createPayrollEntitySlice({ name: "payrollSettings", api: payrollApi.settings });
export const { fetchAll: fetchPayrollSettings, createOne: savePayrollSettings, updateOne: updatePayrollSettings } = entity.thunks;
export const { clearPayrollState: clearPayrollSettingState, setCurrent: setCurrentPayrollSetting } = entity.actions;
export default entity.reducer;
