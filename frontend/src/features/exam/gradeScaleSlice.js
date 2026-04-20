import { createCrudSlice } from "./examModuleFactory";
const { slice, actions } = createCrudSlice({ name: "gradeScale", basePath: "/grade-scale" });
export const { list: fetchGradeScales, createOne: createGradeScale, updateOne: updateGradeScale } = actions;
export const { clearError, resetSuccess } = slice.actions;
export default slice.reducer;
