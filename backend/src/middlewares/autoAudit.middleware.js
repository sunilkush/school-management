import AuditLog from "../models/AuditLog.model.js";

/* ── Map URL path prefix → module name ─────────────────────────────────── */
const pathToModule = (path = "") => {
  const p = path.replace(/^\/api\/v1/, "").split("/")[1] || "unknown";
  const map = {
    user: "Users", student: "Students", school: "School",
    role: "Roles", employee: "Employees", attendance: "Attendance",
    "fee-structures": "Fee Structures", "student-fees": "Student Fees",
    "fee-installments": "Fee Installments", payments: "Payments",
    exams: "Exams", transport: "Transport", hostel: "Hostel",
    "leave-requests": "Leave Requests", "audit-logs": "Audit Logs",
    books: "Library", "issuedBooks": "Library", payroll: "Payroll",
    "gate-entries": "Gate Entry", inventory: "Inventory",
    notifications: "Notifications", messages: "Messages",
    "system-backups": "Backup", "ip-restrictions": "IP Restrictions",
    "2fa": "Two-Factor Auth", "login-logs": "Login History",
  };
  return map[p] || p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

/* ── Auto-audit middleware — wraps res.json to log mutations ─────────────
   Only logs POST/PUT/PATCH/DELETE requests from authenticated users.
   Logging is fully async (setImmediate) so it never blocks the response. */
export const autoAudit = (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();

  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const result = originalJson(body);

    // Fire-and-forget after the response is sent
    if (req.user) {
      setImmediate(() => {
        const status = res.statusCode >= 400 ? "FAILED" : "SUCCESS";
        AuditLog.create({
          actorId: req.user._id,
          actorName: req.user.name || "Unknown",
          actorEmail: req.user.email,
          schoolId: req.user.schoolId || null,
          action: req.method,
          module: pathToModule(req.originalUrl),
          entityType: req.params?.id ? "document" : "collection",
          entityId: req.params?.id || null,
          status,
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"] || "",
          metadata: {
            url: req.originalUrl,
            bodyKeys: Object.keys(req.body || {}),
          },
        }).catch((err) => console.error("[AutoAudit] Write failed:", err.message));
      });
    }

    return result;
  };

  next();
};
