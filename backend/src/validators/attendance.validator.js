import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");
const attendanceStatus = z.enum(["present", "absent", "late", "halfday", "leave"]);
const attendanceRole = z.enum(["student", "teacher", "staff"]);

const optionalObjectId = objectId.nullish().transform((val) => val ?? null);

export const markBulkAttendanceSchema = z.object({
  body: z.object({
    schoolId: objectId.optional(),
    date: z.coerce.date(),
    role: attendanceRole,
    classId: optionalObjectId.optional(),
    sectionId: optionalObjectId.optional(),
    subjectId: optionalObjectId.optional(),
    remarks: z.string().trim().max(300).optional().default(""),
    records: z
      .array(
        z.object({
          userId: objectId,
          status: attendanceStatus,
          remarks: z.string().trim().max(300).optional(),
          checkInAt: z.coerce.date().optional(),
          checkOutAt: z.coerce.date().optional(),
        })
      )
      .min(1, "At least one record is required"),
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
});

export const attendanceListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    schoolId: objectId.optional(),
    classId: objectId.optional(),
    sectionId: objectId.optional(),
    subjectId: objectId.optional(),
    date: z.coerce.date().optional(),
    role: attendanceRole.optional(),
    userId: objectId.optional(),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(20),
  }),
});

export const monthlyReportQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    schoolId: objectId.optional(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
    classId: objectId.optional(),
    sectionId: objectId.optional(),
    role: attendanceRole.optional(),
  }),
});

export const updateAttendanceSchema = z.object({
  body: z.object({
    status: attendanceStatus.optional(),
    remarks: z.string().trim().max(300).optional(),
    checkInAt: z.coerce.date().nullable().optional(),
    checkOutAt: z.coerce.date().nullable().optional(),
  }),
  params: z.object({
    id: objectId,
  }),
  query: z.object({}).optional().default({}),
});

export const attendanceIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    id: objectId,
  }),
  query: z.object({}).optional().default({}),
});

export const myAttendanceQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    childId: objectId.optional(),
  }),
});
