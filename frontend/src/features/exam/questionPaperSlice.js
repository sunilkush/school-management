import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "questionPaper", basePath: "/question-papers" });
export const { list: fetchQuestionPapers, getById: fetchQuestionPaperById, createOne: createQuestionPaper, updateOne: updateQuestionPaper, deleteOne: deleteQuestionPaper } = actions;
export const { clearDetail, clearError, resetSuccess } = slice.actions;
export default slice.reducer;
