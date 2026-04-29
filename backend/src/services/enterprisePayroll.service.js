export const computeSalary = ({ structure, attendance = {}, taxConfig = {}, loanEmi = 0 }) => {
  const basic = Number(structure?.basic || 0);
  const hra = Number(structure?.hra || 0);
  const allowances = Number(structure?.da || 0) + Number(structure?.specialAllowance || 0);
  const bonus = Number(structure?.bonus || 0);
  const gross = basic + hra + allowances + bonus;

  const lopDays = Math.max(0, Number(attendance?.lopDays || 0));
  const workingDays = Math.max(1, Number(attendance?.workingDays || 30));
  const leaveDeduction = (gross / workingDays) * lopDays;

  const pf = (basic * Number(taxConfig?.pfEmployeePercent || 0)) / 100;
  const esi = gross <= 21000 ? (gross * Number(taxConfig?.esiEmployeePercent || 0)) / 100 : 0;
  const tds = (gross * Number(taxConfig?.tdsPercent || 0)) / 100;
  const professionalTax = Number(taxConfig?.professionalTax || 0);

  const deductions = { pf, esi, tds, professionalTax, leaveDeduction, loanEmi: Number(loanEmi || 0) };
  const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + Number(val || 0), 0);
  const netSalary = Math.max(0, gross - totalDeductions);

  return { gross, deductions, totalDeductions, netSalary, earnings: { basic, hra, allowances, bonus } };
};
