import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "questionBank", basePath: "/question-bank" });
export const { list: fetchQuestionBank, getById: fetchQuestionByIdV2, createOne: createQuestionV2, updateOne: updateQuestionV2, deleteOne: deleteQuestionV2 } = actions;
export const { clearDetail, clearError, resetSuccess } = slice.actions;
export default slice.reducer;
