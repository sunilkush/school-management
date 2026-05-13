import mongoose from 'mongoose'
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/response.js'
import { AcademicYear } from '../models/AcademicYear.model.js'
import { Employee } from '../models/Employee.model.js'
import { School } from '../models/school.model.js'
import { PayrollCycle } from '../models/payrollCycle.model.js'
import { Payslip } from '../models/Payslip.model.js'
import { PayrollAuditLog } from '../models/PayrollAuditLog.model.js'
import {
    EmployeeLoan,
    EmployeePayroll,
    EmployeeSalaryStructure,
    LoanInstallment,
    PayrollApproval,
    PayrollComponent,
    SalaryPayment,
    SalaryTemplate,
    TaxDeclaration,
} from '../models/payrollEnterpriseModule.model.js'
import {
    calculateEmployeePayroll,
    calculateStructureTotals,
} from '../services/payrollCalculation.service.js'
import { getMonthlyAttendanceSummary } from '../services/payrollAttendance.service.js'
import {
    queuePayslipEmail,
    streamPayslipPdf,
} from '../services/payslipPdf.service.js'

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(String(id || ''))
const assertObjectId = (id, label = 'id') => {
    if (!isValidObjectId(id)) throw new ApiError(400, `Invalid ${label}`)
}
const isSuperAdmin = (req) => req.userRole?.name === 'Super Admin'
const pickSchoolId = (req) => {
    const userSchool = req.user?.schoolId || req.user?.school?._id
    const requested = req.body?.schoolId || req.query?.schoolId
    const schoolId = isSuperAdmin(req) && requested ? requested : userSchool
    if (!schoolId) throw new ApiError(400, 'School context is required')
    assertObjectId(schoolId, 'schoolId')
    return schoolId
}
const pickAcademicYearId = async (req, schoolId) => {
    const id =
        req.body?.academicYearId ||
        req.query?.academicYearId ||
        req.academicYearId ||
        req.user?.academicYearId
    if (id) {
        assertObjectId(id, 'academicYearId')
        return id
    }
    const active = await AcademicYear.findOne({
        schoolId,
        $or: [{ isActive: true }, { status: 'active' }],
    })
        .select('_id')
        .lean()
    if (!active)
        throw new ApiError(400, 'Active academic year missing for payroll')
    return active._id
}
const baseContext = async (req) => ({
    schoolId: pickSchoolId(req),
    academicYearId: await pickAcademicYearId(req, pickSchoolId(req)),
    createdBy: req.user._id,
})
const audit = async (
    req,
    base,
    entityType,
    entityId,
    action,
    summary,
    before = null,
    after = null
) =>
    PayrollAuditLog.create({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        actorId: req.user._id,
        entityType,
        entityId,
        action,
        summary,
        before,
        after,
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || '',
    })
const listParams = (req, base) => ({
    schoolId: base.schoolId,
    ...(req.query.academicYearScoped === 'false'
        ? {}
        : { academicYearId: base.academicYearId }),
})
const ensureEmployee = async (employeeId, schoolId) => {
    assertObjectId(employeeId, 'employeeId')
    const employee = await Employee.findOne({
        _id: employeeId,
        schoolId,
        isActive: true,
    })
        .populate('userId', 'name email regId')
        .lean()
    if (!employee) throw new ApiError(404, 'Employee not found for this school')
    return employee
}
const canMutateCycle = (cycle) => {
    if (['approved', 'paid', 'locked'].includes(cycle.status))
        throw new ApiError(
            409,
            'Payroll is approved/paid/locked and cannot be recalculated'
        )
}
const parseFilters = (req) => ({
    ...(req.query.department ? { department: req.query.department } : {}),
    ...(req.query.designation ? { designation: req.query.designation } : {}),
    ...(req.query.role ? { 'schoolMappings.role': req.query.role } : {}),
})

export const listComponents = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await PayrollComponent.find({
        schoolId: base.schoolId,
        ...(req.query.type ? { type: req.query.type } : {}),
    })
        .sort({ type: 1, name: 1 })
        .lean()
    return sendSuccess(res, {
        message: 'Salary components fetched',
        data: rows,
    })
})
export const createComponent = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const doc = await PayrollComponent.create({
        ...req.body,
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        createdBy: base.createdBy,
    })
    await audit(
        req,
        base,
        'PayrollComponent',
        doc._id,
        'CREATE',
        'Salary component created',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Salary component created',
        data: doc,
    })
})
export const updateComponent = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    assertObjectId(req.params.id)
    const before = await PayrollComponent.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    })
    if (!before) throw new ApiError(404, 'Salary component not found')
    Object.assign(before, req.body, { schoolId: base.schoolId })
    await before.save()
    await audit(
        req,
        base,
        'PayrollComponent',
        before._id,
        'UPDATE',
        'Salary component updated',
        null,
        before.toObject()
    )
    return sendSuccess(res, {
        message: 'Salary component updated',
        data: before,
    })
})
export const deleteComponent = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    assertObjectId(req.params.id)
    const doc = await PayrollComponent.findOneAndUpdate(
        { _id: req.params.id, schoolId: base.schoolId },
        { isActive: false },
        { new: true }
    )
    if (!doc) throw new ApiError(404, 'Salary component not found')
    await audit(
        req,
        base,
        'PayrollComponent',
        doc._id,
        'DELETE',
        'Salary component deactivated',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        message: 'Salary component deactivated',
        data: doc,
    })
})

export const listTemplates = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await SalaryTemplate.find(listParams(req, base))
        .sort({ createdAt: -1 })
        .lean()
    return sendSuccess(res, { message: 'Salary templates fetched', data: rows })
})
export const createTemplate = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const clone = req.body.cloneFrom
        ? await SalaryTemplate.findOne({
              _id: req.body.cloneFrom,
              schoolId: base.schoolId,
          }).lean()
        : null
    const payload = clone
        ? {
              ...clone,
              _id: undefined,
              name: req.body.name || `${clone.name} Copy`,
              clonedFrom: clone._id,
          }
        : req.body
    const totals = calculateStructureTotals(payload)
    const doc = await SalaryTemplate.create({
        ...payload,
        ...totals,
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        createdBy: base.createdBy,
    })
    await audit(
        req,
        base,
        'SalaryTemplate',
        doc._id,
        'CREATE',
        'Salary template created',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Salary template created',
        data: doc,
    })
})
export const updateTemplate = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    assertObjectId(req.params.id)
    const before = await SalaryTemplate.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    })
    if (!before) throw new ApiError(404, 'Salary template not found')
    Object.assign(
        before,
        req.body,
        calculateStructureTotals({ ...before.toObject(), ...req.body })
    )
    await before.save()
    await audit(
        req,
        base,
        'SalaryTemplate',
        before._id,
        'UPDATE',
        'Salary template updated',
        null,
        before.toObject()
    )
    return sendSuccess(res, {
        message: 'Salary template updated',
        data: before,
    })
})
export const deleteTemplate = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const doc = await SalaryTemplate.findOneAndUpdate(
        { _id: req.params.id, schoolId: base.schoolId },
        { isActive: false },
        { new: true }
    )
    if (!doc) throw new ApiError(404, 'Salary template not found')
    await audit(
        req,
        base,
        'SalaryTemplate',
        doc._id,
        'DELETE',
        'Salary template deactivated',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        message: 'Salary template deactivated',
        data: doc,
    })
})

export const listSalaryStructures = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeeSalaryStructure.find({
        ...listParams(req, base),
        ...(req.query.employeeId ? { employeeId: req.query.employeeId } : {}),
    })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .sort({ effectiveFrom: -1 })
        .lean()
    return sendSuccess(res, {
        message: 'Salary structures fetched',
        data: rows,
    })
})
export const createSalaryStructure = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    await ensureEmployee(req.body.employeeId, base.schoolId)
    if (req.body.status !== 'inactive') {
        const exists = await EmployeeSalaryStructure.exists({
            schoolId: base.schoolId,
            employeeId: req.body.employeeId,
            status: 'active',
            effectiveTo: null,
        })
        if (exists)
            throw new ApiError(
                409,
                'Active salary structure already exists for this employee'
            )
    }
    const totals = calculateStructureTotals(req.body)
    const doc = await EmployeeSalaryStructure.create({
        ...req.body,
        ...totals,
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        createdBy: base.createdBy,
    })
    await Employee.findByIdAndUpdate(req.body.employeeId, {
        $push: {
            salaryHistory: {
                payrollStructureId: doc._id,
                effectiveFrom: doc.effectiveFrom,
                grossMonthly: doc.grossSalary,
                changedBy: req.user._id,
                reason: doc.revisionReason,
            },
        },
    })
    await audit(
        req,
        base,
        'EmployeeSalaryStructure',
        doc._id,
        'CREATE',
        'Employee salary structure assigned',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Salary structure assigned',
        data: doc,
    })
})
export const getEmployeeSalaryStructures = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const employeeId = req.params.employeeId
    await ensureEmployee(employeeId, base.schoolId)
    const rows = await EmployeeSalaryStructure.find({
        schoolId: base.schoolId,
        employeeId,
    })
        .sort({ effectiveFrom: -1 })
        .lean()
    return sendSuccess(res, {
        message: 'Employee salary history fetched',
        data: rows,
    })
})

export const listCycles = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await PayrollCycle.find({
        ...listParams(req, base),
        ...(req.query.month ? { month: Number(req.query.month) } : {}),
        ...(req.query.year ? { year: Number(req.query.year) } : {}),
    })
        .sort({ year: -1, month: -1 })
        .lean()
    return sendSuccess(res, { message: 'Payroll cycles fetched', data: rows })
})
export const createCycle = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const month = Number(req.body.month)
    const year = Number(req.body.year)
    if (!month || month < 1 || month > 12 || !year)
        throw new ApiError(400, 'Valid month and year are required')
    const exists = await PayrollCycle.exists({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        month,
        year,
    })
    if (exists)
        throw new ApiError(
            409,
            'Payroll cycle already exists for this month/year'
        )
    const doc = await PayrollCycle.create({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
        month,
        year,
        processedBy: req.user._id,
        status: 'draft',
    })
    await audit(
        req,
        base,
        'PayrollCycle',
        doc._id,
        'CREATE',
        'Payroll cycle created',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Payroll cycle created',
        data: doc,
    })
})
export const getCycleDetail = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const cycle = await PayrollCycle.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    }).lean()
    if (!cycle) throw new ApiError(404, 'Payroll cycle not found')
    const employees = await EmployeePayroll.find({ payrollCycleId: cycle._id })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .lean()
    const approvals = await PayrollApproval.find({ payrollCycleId: cycle._id })
        .populate('actorId', 'name email')
        .sort({ createdAt: 1 })
        .lean()
    return sendSuccess(res, {
        message: 'Payroll cycle detail fetched',
        data: { cycle, employees, approvals },
    })
})

const runCycle = async (req, res, isRecalculate = false) => {
    const base = await baseContext(req)
    const cycle = await PayrollCycle.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    })
    if (!cycle) throw new ApiError(404, 'Payroll cycle not found')
    canMutateCycle(cycle)
    await EmployeePayroll.deleteMany({ payrollCycleId: cycle._id })
    const employees = await Employee.find({
        schoolId: base.schoolId,
        isActive: true,
        ...parseFilters(req),
    })
        .populate('userId', 'name email regId')
        .lean()
    const records = []
    const skippedEmployees = []
    for (const employee of employees) {
        const structure = await EmployeeSalaryStructure.findOne({
            schoolId: base.schoolId,
            employeeId: employee._id,
            status: 'active',
            effectiveFrom: { $lte: new Date(cycle.year, cycle.month - 1, 31) },
            $or: [
                { effectiveTo: null },
                {
                    effectiveTo: {
                        $gte: new Date(cycle.year, cycle.month - 1, 1),
                    },
                },
            ],
        })
            .sort({ effectiveFrom: -1 })
            .lean()
        if (!structure) {
            skippedEmployees.push({
                employeeId: employee._id,
                employeeName: employee.userId?.name,
                reason: 'Salary structure missing',
            })
            continue
        }
        const loan = await EmployeeLoan.findOne({
            schoolId: base.schoolId,
            employeeId: employee._id,
            status: { $in: ['approved', 'active'] },
            remainingBalance: { $gt: 0 },
        }).sort({ startDate: 1 })
        const loanDeduction = loan
            ? Math.min(
                  Number(loan.emiAmount || 0),
                  Number(loan.remainingBalance || 0)
              )
            : 0
        const attendance = await getMonthlyAttendanceSummary({
            schoolId: base.schoolId,
            employee,
            month: cycle.month,
            year: cycle.year,
            override: req.body.attendanceByEmployee?.[String(employee._id)],
        })
        const salary = calculateEmployeePayroll({
            structure,
            attendance,
            loanDeduction,
            overtimeRate: Number(req.body.overtimeRate || 0),
        })
        records.push({
            ...base,
            payrollCycleId: cycle._id,
            employeeId: employee._id,
            salaryStructureId: structure._id,
            attendance,
            earnings: salary.earnings,
            deductions: salary.deductions,
            employerContributions: salary.employerContributions,
            grossEarnings: salary.grossEarnings,
            totalDeductions: salary.totalDeductions,
            netPayable: salary.netPayable,
        })
        if (loanDeduction > 0) {
            loan.remainingBalance = Math.max(
                0,
                Number(loan.remainingBalance) - loanDeduction
            )
            loan.status = loan.remainingBalance === 0 ? 'closed' : 'active'
            if (loan.remainingBalance === 0) loan.closedAt = new Date()
            await loan.save()
            await LoanInstallment.create({
                schoolId: base.schoolId,
                academicYearId: base.academicYearId,
                loanId: loan._id,
                employeeId: employee._id,
                payrollCycleId: cycle._id,
                dueDate: new Date(cycle.year, cycle.month - 1, 1),
                amount: loanDeduction,
                paidAmount: loanDeduction,
                status: 'deducted',
            })
        }
    }
    const docs = records.length
        ? await EmployeePayroll.insertMany(records, { ordered: false })
        : []
    cycle.status = 'processing'
    cycle.totalEmployees = docs.length
    cycle.totalGross = docs.reduce((n, r) => n + r.grossEarnings, 0)
    cycle.totalDeductions = docs.reduce((n, r) => n + r.totalDeductions, 0)
    cycle.totalNetPayable = docs.reduce((n, r) => n + r.netPayable, 0)
    cycle.skippedEmployees = skippedEmployees
    cycle.processedBy = req.user._id
    await cycle.save()
    await audit(
        req,
        base,
        'PayrollCycle',
        cycle._id,
        isRecalculate ? 'RECALCULATE' : 'RUN',
        'Payroll calculated',
        null,
        { records: docs.length, skippedEmployees }
    )
    return sendSuccess(res, {
        message: isRecalculate
            ? 'Payroll recalculated'
            : 'Payroll run completed',
        data: { cycle, records: docs, skippedEmployees },
    })
}
export const runPayroll = asyncHandler((req, res) => runCycle(req, res, false))
export const recalculatePayroll = asyncHandler((req, res) =>
    runCycle(req, res, true)
)

const changeCycleStatus = (targetStatus, action) =>
    asyncHandler(async (req, res) => {
        const base = await baseContext(req)
        const cycle = await PayrollCycle.findOne({
            _id: req.params.id,
            schoolId: base.schoolId,
        })
        if (!cycle) throw new ApiError(404, 'Payroll cycle not found')
        if (cycle.status === 'locked')
            throw new ApiError(409, 'Locked payroll cannot be changed')
        const fromStatus = cycle.status
        cycle.status = targetStatus
        if (targetStatus === 'pending_approval') cycle.submittedAt = new Date()
        if (targetStatus === 'approved') cycle.approvedAt = new Date()
        if (targetStatus === 'locked') cycle.lockedAt = new Date()
        await cycle.save()
        await PayrollApproval.create({
            schoolId: base.schoolId,
            academicYearId: base.academicYearId,
            payrollCycleId: cycle._id,
            action,
            fromStatus,
            toStatus: targetStatus,
            remarks: req.body.remarks || req.body.reason || '',
            actorId: req.user._id,
            actorRole: req.userRole?.name || '',
        })
        if (targetStatus === 'approved')
            await generatePayslipsForCycle(req, base, cycle)
        await audit(
            req,
            base,
            'PayrollCycle',
            cycle._id,
            action.toUpperCase(),
            `Payroll ${action}`,
            null,
            cycle.toObject()
        )
        return sendSuccess(res, { message: `Payroll ${action}`, data: cycle })
    })
export const submitPayroll = changeCycleStatus('pending_approval', 'submitted')
export const approvePayroll = changeCycleStatus('approved', 'approved')
export const rejectPayroll = changeCycleStatus('draft', 'rejected')
export const lockPayroll = changeCycleStatus('locked', 'locked')
export const listCycleEmployees = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeePayroll.find({
        payrollCycleId: req.params.id,
        schoolId: base.schoolId,
    })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .lean()
    return sendSuccess(res, {
        message: 'Employee payroll records fetched',
        data: rows,
    })
})

const generatePayslipsForCycle = async (req, base, cycle) => {
    const school = await School.findById(base.schoolId)
        .select('name logo')
        .lean()
    const rows = await EmployeePayroll.find({ payrollCycleId: cycle._id })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .lean()
    for (const row of rows) {
        await Payslip.findOneAndUpdate(
            {
                schoolId: base.schoolId,
                employeeId: row.employeeId._id || row.employeeId,
                month: cycle.month,
                year: cycle.year,
            },
            {
                schoolId: base.schoolId,
                academicYearId: base.academicYearId,
                createdBy: req.user._id,
                payrollCycleId: cycle._id,
                employeePayrollId: row._id,
                employeeId: row.employeeId._id || row.employeeId,
                payslipNumber: `PS-${cycle.year}${String(cycle.month).padStart(2, '0')}-${String(row.employeeId?.employeeCode || row.employeeId?._id || row.employeeId).slice(-6)}`,
                month: cycle.month,
                year: cycle.year,
                schoolSnapshot: school || {},
                employeeSnapshot: {
                    name: row.employeeId?.userId?.name,
                    email: row.employeeId?.userId?.email,
                    employeeCode: row.employeeId?.employeeCode,
                    department: row.employeeId?.department,
                    designation: row.employeeId?.designation,
                },
                earnings: row.earnings,
                deductions: row.deductions,
                grossEarnings: row.grossEarnings,
                totalDeductions: row.totalDeductions,
                netPayable: row.netPayable,
                paymentStatus: row.paymentStatus,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
    }
    await queuePayslipEmail()
}
export const listPayslips = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await Payslip.find({
        schoolId: base.schoolId,
        ...(req.query.employeeId ? { employeeId: req.query.employeeId } : {}),
    })
        .sort({ year: -1, month: -1 })
        .lean()
    return sendSuccess(res, { message: 'Payslips fetched', data: rows })
})
export const myPayslips = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const employee = await Employee.findOne({
        schoolId: base.schoolId,
        userId: req.user._id,
    }).lean()
    const rows = employee
        ? await Payslip.find({
              schoolId: base.schoolId,
              employeeId: employee._id,
          })
              .sort({ year: -1, month: -1 })
              .lean()
        : []
    return sendSuccess(res, { message: 'My payslips fetched', data: rows })
})
export const payslipPdf = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const payslip = await Payslip.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    }).lean()
    if (!payslip) throw new ApiError(404, 'Payslip not found')
    return streamPayslipPdf({ res, payslip })
})

export const bulkMarkPaid = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const ids = req.body.employeePayrollIds || []
    if (!ids.length) throw new ApiError(400, 'employeePayrollIds are required')
    const rows = await EmployeePayroll.find({
        _id: { $in: ids },
        schoolId: base.schoolId,
    })
    const payments = []
    for (const row of rows) {
        row.paymentStatus = req.body.status || 'paid'
        await row.save()
        const payment = await SalaryPayment.findOneAndUpdate(
            { employeePayrollId: row._id },
            {
                ...base,
                payrollCycleId: row.payrollCycleId,
                employeePayrollId: row._id,
                employeeId: row.employeeId,
                amount: row.netPayable,
                mode: req.body.mode || 'bank',
                transactionRef: req.body.transactionRef || '',
                paymentDate: req.body.paymentDate || new Date(),
                proofUrl: req.body.proofUrl || '',
                status: row.paymentStatus,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        payments.push(payment)
        await Payslip.updateOne(
            { employeePayrollId: row._id },
            { paymentStatus: row.paymentStatus }
        )
    }
    await audit(
        req,
        base,
        'SalaryPayment',
        null,
        'PAY',
        'Bulk salary payment updated',
        null,
        { count: payments.length }
    )
    return sendSuccess(res, {
        message: 'Salary payments updated',
        data: payments,
    })
})

export const listLoans = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeeLoan.find({ schoolId: base.schoolId })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .lean()
    return sendSuccess(res, { message: 'Loans fetched', data: rows })
})
export const createLoan = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    await ensureEmployee(req.body.employeeId, base.schoolId)
    const amount = Number(req.body.amount)
    const emiAmount = Number(req.body.emiAmount)
    if (!amount || !emiAmount || emiAmount > amount)
        throw new ApiError(400, 'Valid amount and EMI are required')
    const doc = await EmployeeLoan.create({
        ...req.body,
        ...base,
        amount,
        emiAmount,
        remainingBalance: amount,
        startDate: req.body.startDate || new Date(),
    })
    await audit(
        req,
        base,
        'EmployeeLoan',
        doc._id,
        'CREATE',
        'Loan/advance request created',
        null,
        doc.toObject()
    )
    return sendSuccess(res, {
        statusCode: 201,
        message: 'Loan request created',
        data: doc,
    })
})
export const approveLoan = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const doc = await EmployeeLoan.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    })
    if (!doc) throw new ApiError(404, 'Loan not found')
    doc.status = 'active'
    doc.approvedBy = req.user._id
    doc.approvalRemarks = req.body.remarks || ''
    await doc.save()
    await audit(
        req,
        base,
        'EmployeeLoan',
        doc._id,
        'APPROVE',
        'Loan approved',
        null,
        doc.toObject()
    )
    return sendSuccess(res, { message: 'Loan approved', data: doc })
})
export const rejectLoan = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const doc = await EmployeeLoan.findOne({
        _id: req.params.id,
        schoolId: base.schoolId,
    })
    if (!doc) throw new ApiError(404, 'Loan not found')
    doc.status = 'rejected'
    doc.approvalRemarks = req.body.remarks || req.body.reason || ''
    await doc.save()
    await audit(
        req,
        base,
        'EmployeeLoan',
        doc._id,
        'REJECT',
        'Loan rejected',
        null,
        doc.toObject()
    )
    return sendSuccess(res, { message: 'Loan rejected', data: doc })
})

export const payrollSummary = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const match = {
        schoolId: new mongoose.Types.ObjectId(base.schoolId),
        academicYearId: new mongoose.Types.ObjectId(base.academicYearId),
    }
    const [summary] = await EmployeePayroll.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                employees: { $sum: 1 },
                gross: { $sum: '$grossEarnings' },
                deductions: { $sum: '$totalDeductions' },
                net: { $sum: '$netPayable' },
                paid: {
                    $sum: {
                        $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0],
                    },
                },
            },
        },
    ])
    const trend = await PayrollCycle.find({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
    })
        .select('month year totalNetPayable totalGross totalDeductions status')
        .sort({ year: 1, month: 1 })
        .lean()
    return sendSuccess(res, {
        message: 'Payroll summary fetched',
        data: {
            summary: summary || {
                employees: 0,
                gross: 0,
                deductions: 0,
                net: 0,
                paid: 0,
            },
            trend,
        },
    })
})
export const employeeReport = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeePayroll.find({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
    })
        .populate({
            path: 'employeeId',
            select: 'employeeCode department designation userId',
            populate: { path: 'userId', select: 'name email' },
        })
        .sort({ createdAt: -1 })
        .lean()
    return sendSuccess(res, {
        message: 'Employee salary report fetched',
        data: rows,
    })
})
export const statutoryReport = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeePayroll.find({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
    }).lean()
    const totals = rows.reduce(
        (acc, row) => {
            for (const d of row.deductions || []) {
                const code = String(d.code || d.name || '').toLowerCase()
                if (code.includes('pf')) acc.pf += Number(d.amount || 0)
                if (code.includes('esi')) acc.esi += Number(d.amount || 0)
                if (code.includes('tds')) acc.tds += Number(d.amount || 0)
                if (code.includes('professional'))
                    acc.professionalTax += Number(d.amount || 0)
            }
            for (const e of row.employerContributions || [])
                acc.employerContribution += Number(e.amount || 0)
            return acc
        },
        { pf: 0, esi: 0, tds: 0, professionalTax: 0, employerContribution: 0 }
    )
    return sendSuccess(res, {
        message: 'Statutory report fetched',
        data: { totals, export: { pdf: 'TODO', excel: 'TODO' } },
    })
})
export const loanReport = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const rows = await EmployeeLoan.find({
        schoolId: base.schoolId,
        academicYearId: base.academicYearId,
    }).lean()
    return sendSuccess(res, {
        message: 'Loan outstanding report fetched',
        data: {
            loans: rows,
            outstanding: rows.reduce(
                (n, r) => n + Number(r.remainingBalance || 0),
                0
            ),
        },
    })
})
export const myPayroll = asyncHandler(async (req, res) => {
    const base = await baseContext(req)
    const employee = await Employee.findOne({
        schoolId: base.schoolId,
        userId: req.user._id,
    }).lean()
    if (!employee)
        return sendSuccess(res, {
            message: 'My payroll fetched',
            data: {
                structures: [],
                payslips: [],
                loans: [],
                taxDeclarations: [],
            },
        })
    const [structures, payslips, loans, taxDeclarations] = await Promise.all([
        EmployeeSalaryStructure.find({
            schoolId: base.schoolId,
            employeeId: employee._id,
        }).lean(),
        Payslip.find({
            schoolId: base.schoolId,
            employeeId: employee._id,
        }).lean(),
        EmployeeLoan.find({
            schoolId: base.schoolId,
            employeeId: employee._id,
        }).lean(),
        TaxDeclaration.find({
            schoolId: base.schoolId,
            employeeId: employee._id,
        }).lean(),
    ])
    return sendSuccess(res, {
        message: 'My payroll fetched',
        data: { structures, payslips, loans, taxDeclarations },
    })
})
