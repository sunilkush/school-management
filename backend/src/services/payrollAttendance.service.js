import { Attendance } from '../models/attendance.model.js'

const monthRangeUTC = (month, year) => ({
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
})

export const getMonthlyAttendanceSummary = async ({
    schoolId,
    employee,
    month,
    year,
    override = {},
}) => {
    month = Number(month)
    year = Number(year)
    const userId = employee?.userId?._id || employee?.userId
    if (!userId) {
        return {
            workingDays: 30,
            paidLeave: 0,
            unpaidLeave: 0,
            halfDays: 0,
            lateDays: 0,
            lopDays: 0,
            overtimeHours: 0,
            source: 'placeholder',
            note: 'TODO: map Employee to attendance user before production attendance integration.',
        }
    }

    const { start, end } = monthRangeUTC(month, year)
    const records = await Attendance.find({
        schoolId,
        userId,
        date: { $gte: start, $lte: end },
    })
        .select('status')
        .lean()
    if (!records.length) {
        return {
            workingDays: Number(override.workingDays || 30),
            paidLeave: 0,
            unpaidLeave: Number(override.lopDays || 0),
            halfDays: 0,
            lateDays: 0,
            lopDays: Number(override.lopDays || 0),
            overtimeHours: Number(override.overtimeHours || 0),
            source: 'placeholder',
            note: 'TODO: replace fallback when attendance records are complete.',
        }
    }

    const counts = records.reduce(
        (acc, row) => ({ ...acc, [row.status]: (acc[row.status] || 0) + 1 }),
        {}
    )
    const unpaidLeave = Number(counts.absent || 0)
    return {
        workingDays: records.length,
        paidLeave: Number(counts.leave || 0),
        unpaidLeave,
        halfDays: Number(counts.halfday || 0),
        lateDays: Number(counts.late || 0),
        lopDays: unpaidLeave + Number(counts.halfday || 0) * 0.5,
        overtimeHours: Number(override.overtimeHours || 0),
        source: 'attendance',
    }
}
