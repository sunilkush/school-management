import { IpRestriction } from "../models/IpRestriction.model.js";

/* ── Check IP against school-level + global rules ─────────────────────── */
export const checkIpRestriction = async (req, res, next) => {
  try {
    if (!req.user) return next(); // Not authenticated yet — let auth handle it

    const clientIp = req.ip || req.connection?.remoteAddress || "";
    // Normalize ::1 (IPv6 loopback) to 127.0.0.1 for local dev
    const normalizedIp = clientIp === "::1" ? "127.0.0.1" : clientIp.replace("::ffff:", "");

    const schoolId = req.user.schoolId;

    // Load active rules for this school + global rules (schoolId: null)
    const rules = await IpRestriction.find({
      $or: [
        { schoolId: schoolId || null, isActive: true },
        { schoolId: null, isActive: true },
      ],
    }).lean();

    if (!rules.length) return next(); // No rules configured — allow all

    const whitelist = rules.filter((r) => r.type === "whitelist").map((r) => r.ipAddress);
    const blacklist = rules.filter((r) => r.type === "blacklist").map((r) => r.ipAddress);

    // Blacklist check — block if IP matches any blacklist entry
    if (blacklist.length && isIpInList(normalizedIp, blacklist)) {
      return res.status(403).json({ success: false, message: "Access denied: your IP address is blocked." });
    }

    // Whitelist check — if whitelist is configured, IP MUST be in it
    if (whitelist.length && !isIpInList(normalizedIp, whitelist)) {
      return res.status(403).json({ success: false, message: "Access denied: your IP address is not whitelisted." });
    }

    next();
  } catch (err) {
    // On error, fail open (don't break access for everyone)
    console.error("[IpRestriction] Middleware error:", err.message);
    next();
  }
};

/* ── Simple IP matcher (exact match; extend with CIDR library if needed) ─ */
const isIpInList = (ip, list) => list.some((entry) => entry === ip || entry === "*");
