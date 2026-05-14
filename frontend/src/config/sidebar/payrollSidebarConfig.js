const payrollSidebarConfig = {
    "super admin": [{
        key: "payroll-management",
        title: "Payroll Management",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Overview",
            path: "superadmin/payroll",
            permission: "payroll.global.view"
        }, {
            title: "School Payroll Usage",
            path: "superadmin/payroll/schools",
            permission: "payroll.global.schools.view"
        }, {
            title: "Payroll Plans",
            path: "superadmin/payroll/plans",
            permission: "payroll.global.plans.manage"
        }, {
            title: "Compliance Templates",
            path: "superadmin/payroll/compliance-templates",
            permission: "payroll.global.compliance.manage"
        }, {
            title: "Payroll Audit Logs",
            path: "superadmin/payroll/audit-logs",
            permission: "payroll.global.audit.view"
        }]
    }],
    "school admin": [{
        key: "payroll",
        title: "Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Dashboard",
            path: "schooladmin/payroll",
            permission: "payroll.dashboard.view"
        }, {
            title: "Payroll Settings",
            path: "schooladmin/payroll/settings",
            permission: "payroll.settings.manage"
        }, {
            title: "Salary Components",
            path: "schooladmin/payroll/components",
            permission: "payroll.components.manage"
        }, {
            title: "Salary Structures",
            path: "schooladmin/payroll/salary-structures",
            permission: "payroll.salaryStructure.manage"
        }, {
            title: "Payroll Cycles",
            path: "schooladmin/payroll/cycles",
            permission: "payroll.cycles.manage"
        }, {
            title: "Payroll Runs",
            path: "schooladmin/payroll/runs",
            permission: "payroll.runs.view"
        }, {
            title: "Payslips",
            path: "schooladmin/payroll/payslips",
            permission: "payroll.payslips.manage"
        }, {
            title: "Loans & Advances",
            path: "schooladmin/payroll/loans",
            permission: "payroll.loans.manage"
        }, {
            title: "Tax Declarations",
            path: "schooladmin/payroll/tax-declarations",
            permission: "payroll.tax.manage"
        }, {
            title: "Reports",
            path: "schooladmin/payroll/reports",
            permission: "payroll.reports.view"
        }, {
            title: "Audit Logs",
            path: "schooladmin/payroll/audit-logs",
            permission: "payroll.audit.view"
        }]
    }],
    principal: [{
        title: "Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Dashboard",
            path: "principal/payroll",
            permission: "payroll.dashboard.view"
        }, {
            title: "Payroll Approvals",
            path: "principal/payroll/approvals",
            permission: "payroll.approve"
        }, {
            title: "Payroll Reports",
            path: "principal/payroll/reports",
            permission: "payroll.reports.view"
        }, {
            title: "Payroll Audit Logs",
            path: "principal/payroll/audit-logs",
            permission: "payroll.audit.view"
        }]
    }],
    accountant: [{
        title: "Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Workspace",
            path: "accountant/payroll",
            permission: "payroll.workspace.view"
        }, {
            title: "Payroll Cycles",
            path: "accountant/payroll/cycles",
            permission: "payroll.cycles.manage"
        }, {
            title: "Payroll Run",
            path: "accountant/payroll/runs",
            permission: "payroll.runs.manage"
        }, {
            title: "Adjustments",
            path: "accountant/payroll/adjustments",
            permission: "payroll.adjustments.manage"
        }, {
            title: "Payslips",
            path: "accountant/payroll/payslips",
            permission: "payroll.payslips.manage"
        }, {
            title: "Bank Export",
            path: "accountant/payroll/bank-export",
            permission: "payroll.bankExport.manage"
        }, {
            title: "Reports",
            path: "accountant/payroll/reports",
            permission: "payroll.reports.view"
        }]
    }],
    hr: [{
        title: "Payroll HR",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Salary Management",
            path: "hr/payroll/salary-management",
            permission: "payroll.salaryStructure.manage"
        }, {
            title: "Salary Revisions",
            path: "hr/payroll/salary-revisions",
            permission: "payroll.salaryRevision.manage"
        }, {
            title: "Employee Loans",
            path: "hr/payroll/loans",
            permission: "payroll.loans.manage"
        }, {
            title: "Tax Declarations",
            path: "hr/payroll/tax-declarations",
            permission: "payroll.tax.manage"
        }, {
            title: "Employee Payroll Profiles",
            path: "hr/payroll/employee-profiles",
            permission: "payroll.employeeProfile.view"
        }]
    }],
    teacher: [{
        title: "My Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Dashboard",
            path: "teacher/payroll",
            permission: "payroll.self.view"
        }, {
            title: "My Payslips",
            path: "teacher/payroll/payslips",
            permission: "payroll.self.payslips.view"
        }, {
            title: "My Salary Structure",
            path: "teacher/payroll/salary-structure",
            permission: "payroll.self.salaryStructure.view"
        }, {
            title: "Loan / Advance Request",
            path: "teacher/payroll/loans",
            permission: "payroll.self.loans.manage"
        }, {
            title: "Tax Declaration",
            path: "teacher/payroll/tax-declaration",
            permission: "payroll.self.tax.manage"
        }]
    }],
    staff: [{
        title: "My Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Dashboard",
            path: "staff/payroll",
            permission: "payroll.self.view"
        }, {
            title: "My Payslips",
            path: "staff/payroll/payslips",
            permission: "payroll.self.payslips.view"
        }, {
            title: "My Salary Structure",
            path: "staff/payroll/salary-structure",
            permission: "payroll.self.salaryStructure.view"
        }, {
            title: "Loan / Advance Request",
            path: "staff/payroll/loans",
            permission: "payroll.self.loans.manage"
        }, {
            title: "Tax Declaration",
            path: "staff/payroll/tax-declaration",
            permission: "payroll.self.tax.manage"
        }]
    }],
    "support staff": [{
        title: "My Payroll",
        icon: "DollarOutlined",
        subMenu: [{
            title: "Payroll Dashboard",
            path: "staff/payroll",
            permission: "payroll.self.view"
        }, {
            title: "My Payslips",
            path: "staff/payroll/payslips",
            permission: "payroll.self.payslips.view"
        }, {
            title: "Loan / Advance Request",
            path: "staff/payroll/loans",
            permission: "payroll.self.loans.manage"
        }, {
            title: "Tax Declaration",
            path: "staff/payroll/tax-declaration",
            permission: "payroll.self.tax.manage"
        }]
    }],
    auditor: [{
        title: "Payroll Reports",
        icon: "BarChartOutlined",
        subMenu: [{
            title: "Payroll Summary",
            path: "auditor/payroll/reports",
            permission: "payroll.reports.view"
        }, {
            title: "Department Cost",
            path: "auditor/payroll/department-cost",
            permission: "payroll.reports.departmentCost.view"
        }, {
            title: "Statutory Reports",
            path: "auditor/payroll/statutory",
            permission: "payroll.reports.statutory.view"
        }, {
            title: "Audit Logs",
            path: "auditor/payroll/audit-logs",
            permission: "payroll.audit.view"
        }]
    }],
};
export default payrollSidebarConfig;