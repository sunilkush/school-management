import { Router } from 'express'
import { requireRoles } from '../middlewares/auth.middleware.js'
import { validateRequest } from '../middlewares/validate.middleware.js'
import {
    createPayrollStructure,
    getPayrollStructures,
    generatePayrollCycle,
    getMonthlyPayrollReport,
    getMyPayrollSummary,
    getPayrollCycle,
    getPayslip,
    lockPayrollCycle,
    payPayrollCycle,
    updatePayrollStructure,
} from '../controllers/payroll.controllers.js'
import {
    approveLoan,
    approvePayroll,
    bulkMarkPaid,
    createComponent,
    createCycle,
    createLoan,
    createSalaryStructure,
    createTemplate,
    deleteComponent,
    deleteTemplate,
    employeeReport,
    getCycleDetail,
    getEmployeeSalaryStructures,
    listComponents,
    listCycleEmployees,
    listCycles,
    listLoans,
    listPayslips,
    listSalaryStructures,
    listTemplates,
    loanReport,
    lockPayroll,
    myPayroll,
    myPayslips,
    payslipPdf,
    payrollSummary,
    recalculatePayroll,
    rejectLoan,
    rejectPayroll,
    runPayroll,
    statutoryReport,
    submitPayroll,
    updateComponent,
    updateTemplate,
} from '../controllers/payrollModule.controllers.js'
import {
    payrollCycleActionSchema,
    payrollCycleGenerateSchema,
    payrollCycleQuerySchema,
    payrollReportQuerySchema,
    payrollStructureCreateSchema,
    payrollStructureUpdateSchema,
    payslipQuerySchema,
} from '../validators/payroll.validator.js'

const router = Router()

const SETUP_ROLES = ['Super Admin', 'School Admin', 'HR', 'Accountant']
const RUN_ROLES = ['Super Admin', 'School Admin', 'Accountant']
const APPROVAL_ROLES = ['Super Admin', 'School Admin', 'Principal', 'Admin']
const REVIEW_ROLES = [
    'Super Admin',
    'School Admin',
    'Accountant',
    'Principal',
    'Admin',
    'HR',
]
const SELF_ROLES = [
    'Principal',
    'Admin',
    'Teacher',
    'Employee',
    'Staff',
    'Support Staff',
    'Vice Principal',
    'Librarian',
    'Hostel Warden',
    'Transport Manager',
    'Exam Coordinator',
    'Receptionist',
    'IT Support',
    'Counselor',
    'Security',
]

// Enterprise payroll module routes
router
    .route('/components')
    .get(requireRoles(REVIEW_ROLES), listComponents)
    .post(requireRoles(SETUP_ROLES), createComponent)
router
    .route('/components/:id')
    .put(requireRoles(SETUP_ROLES), updateComponent)
    .delete(requireRoles(SETUP_ROLES), deleteComponent)
router
    .route('/templates')
    .get(requireRoles(REVIEW_ROLES), listTemplates)
    .post(requireRoles(SETUP_ROLES), createTemplate)
router
    .route('/templates/:id')
    .put(requireRoles(SETUP_ROLES), updateTemplate)
    .delete(requireRoles(SETUP_ROLES), deleteTemplate)
router
    .route('/salary-structures')
    .get(requireRoles(REVIEW_ROLES), listSalaryStructures)
    .post(requireRoles(SETUP_ROLES), createSalaryStructure)
router.get(
    '/salary-structures/employee/:employeeId',
    requireRoles([...REVIEW_ROLES, ...SELF_ROLES]),
    getEmployeeSalaryStructures
)
router
    .route('/cycles')
    .get(requireRoles(REVIEW_ROLES), listCycles)
    .post(requireRoles(RUN_ROLES), createCycle)
router.get('/cycles/:id', requireRoles(REVIEW_ROLES), getCycleDetail)
router.post('/cycles/:id/run', requireRoles(RUN_ROLES), runPayroll)
router.post(
    '/cycles/:id/recalculate',
    requireRoles(RUN_ROLES),
    recalculatePayroll
)
router.post('/cycles/:id/submit', requireRoles(RUN_ROLES), submitPayroll)
router.post('/cycles/:id/approve', requireRoles(APPROVAL_ROLES), approvePayroll)
router.post('/cycles/:id/reject', requireRoles(APPROVAL_ROLES), rejectPayroll)
router.post('/cycles/:id/lock', requireRoles(APPROVAL_ROLES), lockPayroll)
router.get(
    '/cycles/:id/employees',
    requireRoles(REVIEW_ROLES),
    listCycleEmployees
)
router.get('/payslips', requireRoles(REVIEW_ROLES), listPayslips)
router.get(
    '/payslips/:id/pdf',
    requireRoles([...REVIEW_ROLES, ...SELF_ROLES]),
    payslipPdf
)
router.get('/my-payslips', requireRoles(SELF_ROLES), myPayslips)
router.get('/my-payroll', requireRoles(SELF_ROLES), myPayroll)
router.post('/payments/bulk-mark-paid', requireRoles(RUN_ROLES), bulkMarkPaid)
router
    .route('/loans')
    .get(requireRoles([...REVIEW_ROLES, ...SELF_ROLES]), listLoans)
    .post(requireRoles([...SETUP_ROLES, ...SELF_ROLES]), createLoan)
router.post('/loans/:id/approve', requireRoles(APPROVAL_ROLES), approveLoan)
router.post('/loans/:id/reject', requireRoles(APPROVAL_ROLES), rejectLoan)
router.get('/reports/summary', requireRoles(REVIEW_ROLES), payrollSummary)
router.get('/reports/employee', requireRoles(REVIEW_ROLES), employeeReport)
router.get('/reports/statutory', requireRoles(REVIEW_ROLES), statutoryReport)
router.get('/reports/loans', requireRoles(REVIEW_ROLES), loanReport)

// Legacy payroll routes retained for existing screens/backward compatibility
router.post(
    '/structure',
    requireRoles(RUN_ROLES),
    validateRequest(payrollStructureCreateSchema),
    createPayrollStructure
)
router.get('/structure', requireRoles(REVIEW_ROLES), getPayrollStructures)
router.post(
    '/cycle/generate',
    requireRoles(RUN_ROLES),
    validateRequest(payrollCycleGenerateSchema),
    generatePayrollCycle
)
router.get('/self/summary', requireRoles(SELF_ROLES), getMyPayrollSummary)
router.get(
    '/reports/monthly',
    requireRoles(REVIEW_ROLES),
    validateRequest(payrollReportQuerySchema),
    getMonthlyPayrollReport
)
router.put(
    '/structure/:id',
    requireRoles(RUN_ROLES),
    validateRequest(payrollStructureUpdateSchema),
    updatePayrollStructure
)
router.get(
    '/cycle/:month/:year',
    requireRoles(REVIEW_ROLES),
    validateRequest(payrollCycleQuerySchema),
    getPayrollCycle
)
router.post(
    '/cycle/:id/lock',
    requireRoles(REVIEW_ROLES),
    validateRequest(payrollCycleActionSchema),
    lockPayrollCycle
)
router.post(
    '/cycle/:id/pay',
    requireRoles(RUN_ROLES),
    validateRequest(payrollCycleActionSchema),
    payPayrollCycle
)
router.get(
    '/payslip/:employeeId/:month/:year',
    requireRoles([...REVIEW_ROLES, ...SELF_ROLES]),
    validateRequest(payslipQuerySchema),
    getPayslip
)

export default router
