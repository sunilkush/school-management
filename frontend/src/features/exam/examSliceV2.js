import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "examModuleExam", basePath: "/exams" });
export const { list: fetchExamsV2, getById: fetchExamV2, createOne: createExamV2, updateOne: updateExamV2, deleteOne: deleteExamV2 } = actions;
export const { clearDetail: clearExamDetailV2, clearError: clearExamErrorV2, resetSuccess: resetExamSuccessV2 } = slice.actions;
export default slice.reducer;
