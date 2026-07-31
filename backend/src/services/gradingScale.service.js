import { GradingScale } from "../models/GradingScale.model.js";

// Matches the scale that was hardcoded in exam.service.js before this became configurable — kept
// as the fallback so schools that never touch the setting see zero change in behavior.
export const DEFAULT_GRADES = [
  { grade: "A", minPercentage: 85 },
  { grade: "B", minPercentage: 70 },
  { grade: "C", minPercentage: 50 },
  { grade: "Fail", minPercentage: 0 },
];

export const getGradeBands = async (schoolId) => {
  if (!schoolId) return DEFAULT_GRADES;
  const doc = await GradingScale.findOne({ schoolId }).select("grades").lean();
  return doc?.grades?.length ? doc.grades : DEFAULT_GRADES;
};

export const resolveGrade = (percentage, bands) => {
  const sorted = [...bands].sort((a, b) => b.minPercentage - a.minPercentage);
  const match = sorted.find((b) => percentage >= b.minPercentage);
  return match ? match.grade : sorted[sorted.length - 1]?.grade || "N/A";
};

export const getGradeFromPercentage = async (schoolId, percentage) => {
  const bands = await getGradeBands(schoolId);
  return resolveGrade(percentage, bands);
};
