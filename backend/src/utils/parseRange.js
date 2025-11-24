export const parseRange = (req) => {
  let { from, to } = req.query;

  // Convert input strings to Date objects
  from = from ? new Date(from) : null;
  to = to ? new Date(to) : null;

  // If invalid or missing → Use current month date range
  if (!from || isNaN(from.getTime())) {
    const now = new Date();
    from = new Date(now.getFullYear(), now.getMonth(), 1); // 1st day of month
  }

  if (!to || isNaN(to.getTime())) {
    const now = new Date();
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month
  }

  // Force time boundaries (00:00 to 23:59)
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
};
