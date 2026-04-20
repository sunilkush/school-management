import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "examSubjectConfig", basePath: "/exam-subject-config" });
export const { list: fetchExamSubjectConfigs, createOne: createExamSubjectConfig, updateOne: updateExamSubjectConfig, deleteOne: deleteExamSubjectConfig } = actions;
export const { clearDetail, clearError, resetSuccess } = slice.actions;
export default slice.reducer;
