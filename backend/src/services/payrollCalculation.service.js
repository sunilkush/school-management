const round = (value) =>
    Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
const sum = (items = []) =>
    round(items.reduce((total, item) => total + Number(item.amount || 0), 0))

export const computeLineItems = (items = [], baseGross = 0) =>
    items.map((item) => ({
        ...item,
        amount: round(
            item.calculationType === 'percentage'
                ? (baseGross * Number(item.amount || 0)) / 100
                : Number(item.amount || 0)
        ),
    }))

export const calculateEmployeePayroll = ({
    structure,
    attendance,
    loanDeduction = 0,
    overtimeRate = 0,
}) => {
    const fixedEarnings = computeLineItems(structure.earnings || [])
    const baseGross = sum(fixedEarnings)
    const overtimeAmount = round(
        Number(attendance?.overtimeHours || 0) * Number(overtimeRate || 0)
    )
    const earnings =
        overtimeAmount > 0
            ? [
                  ...fixedEarnings,
                  {
                      name: 'Overtime',
                      code: 'OT',
                      type: 'earning',
                      amount: overtimeAmount,
                  },
              ]
            : fixedEarnings
    const grossEarnings = sum(earnings)
    const deductions = computeLineItems(
        structure.deductions || [],
        grossEarnings
    )
    const perDaySalary =
        Number(attendance?.workingDays || 0) > 0
            ? grossEarnings / Number(attendance.workingDays)
            : 0
    const lopAmount = round(perDaySalary * Number(attendance?.lopDays || 0))
    const allDeductions = [
        ...deductions,
        ...(lopAmount > 0
            ? [
                  {
                      name: 'Loss of Pay',
                      code: 'LOP',
                      type: 'deduction',
                      amount: lopAmount,
                  },
              ]
            : []),
        ...(loanDeduction > 0
            ? [
                  {
                      name: 'Loan/Advance EMI',
                      code: 'LOAN',
                      type: 'deduction',
                      amount: loanDeduction,
                  },
              ]
            : []),
    ]
    const employerContributions = computeLineItems(
        structure.employerContributions || [],
        grossEarnings
    )
    const totalDeductions = sum(allDeductions)
    return {
        earnings,
        deductions: allDeductions,
        employerContributions,
        grossEarnings,
        totalDeductions,
        netPayable: round(grossEarnings - totalDeductions),
        ctc: round(grossEarnings + sum(employerContributions)),
    }
}

export const calculateStructureTotals = ({
    earnings = [],
    deductions = [],
    employerContributions = [],
}) => {
    const grossSalary = sum(computeLineItems(earnings))
    const totalDeductions = sum(computeLineItems(deductions, grossSalary))
    const ctc = round(
        grossSalary + sum(computeLineItems(employerContributions, grossSalary))
    )
    return {
        grossSalary,
        totalDeductions,
        netSalary: round(grossSalary - totalDeductions),
        ctc,
    }
}
