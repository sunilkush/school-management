import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "examSchedule", basePath: "/exam-schedules" });
export const { list: fetchExamSchedules, createOne: createExamSchedule, updateOne: updateExamSchedule, deleteOne: deleteExamSchedule } = actions;
export const { clearDetail, clearError, resetSuccess } = slice.actions;
export default slice.reducer;
