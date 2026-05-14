import { PayrollAuditLog } from "../models/payroll.models.js";

export const writePayrollAudit = async (req, { action, entity, entityId, employeeId, remarks, before, after, status = "success" }) => {
  const schoolId = after?.schoolId || before?.schoolId || req.body?.schoolId || req.query?.schoolId || req.user?.school?._id || req.user?.schoolId;
  if (!schoolId) return null;
  return PayrollAuditLog.create({
    schoolId,
    academicYearId: after?.academicYearId || before?.academicYearId || req.body?.academicYearId || req.query?.academicYearId,
    action,
    entity,
    entityId,
    employeeId,
    performedBy: req.user?._id,
    role: req.userRole?.name || req.user?.roleId?.name,
    ipAddress: req.ip,
    remarks,
    before,
    after,
    status,
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
  });
};
