import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyLoginHistory } from "../../features/loginHistorySlice";

const browserIcon = (b = "") => {
  if (b.includes("Chrome")) return "🌐";
  if (b.includes("Firefox")) return "🦊";
  if (b.includes("Safari")) return "🧭";
  if (b.includes("Edge")) return "🔷";
  return "💻";
};

const osIcon = (os = "") => {
  if (os.includes("Windows")) return "🪟";
  if (os.includes("macOS")) return "🍎";
  if (os.includes("Android")) return "🤖";
  if (os.includes("iOS")) return "📱";
  if (os.includes("Linux")) return "🐧";
  return "💻";
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const duration = (login, logout) => {
  if (!logout) return "Active / not logged out";
  const ms = new Date(logout) - new Date(login);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export default function DeviceHistory() {
  const dispatch = useDispatch();
  const userId = useSelector((s) => s.auth.user?._id);
  const { logs, pagination, loading, error } = useSelector((s) => s.loginHistory);

  useEffect(() => {
    if (userId) dispatch(fetchMyLoginHistory({ userId }));
  }, [dispatch, userId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Login History</h2>
          <p className="text-sm text-gray-500">Recent sign-in activity for your account</p>
        </div>
        {pagination && (
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {pagination.total} total logins
          </span>
        )}
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📋</div>
          <p>No login history found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log, idx) => (
            <div
              key={log._id || idx}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                log.status === "failed"
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {/* Icons */}
              <div className="flex gap-1 text-xl mt-0.5">
                <span title={log.browser}>{browserIcon(log.browser)}</span>
                <span title={log.os}>{osIcon(log.os)}</span>
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-800">
                    {log.browser || "Unknown browser"} on {log.os || "Unknown OS"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    log.status === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {log.status === "success" ? "Success" : "Failed"}
                  </span>
                  {idx === 0 && log.status === "success" && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      Most Recent
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-1 flex-wrap">
                  <span className="text-xs text-gray-500">🕒 {formatDate(log.loginTime)}</span>
                  {log.ipAddress && <span className="text-xs text-gray-500">📍 {log.ipAddress}</span>}
                  {log.logoutTime && (
                    <span className="text-xs text-gray-500">⏱ {duration(log.loginTime, log.logoutTime)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => dispatch(fetchMyLoginHistory({ userId, page: pagination.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-40"
          >
            Load more
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Notice suspicious activity?</strong> Contact your administrator to reset your password and revoke all sessions.
        </p>
      </div>
    </div>
  );
}
