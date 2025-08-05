export const generateAcademicYearName = (startDate, endDate) => {
  return `${new Date(startDate).getFullYear()}-${new Date(endDate).getFullYear()}`;
};