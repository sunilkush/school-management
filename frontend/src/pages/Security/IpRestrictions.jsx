import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIpRules,
  createIpRule,
  updateIpRule,
  toggleIpRule,
  deleteIpRule,
  clearIpState,
} from "../../features/ipRestrictionSlice";

const EMPTY_FORM = { type: "whitelist", ipAddress: "", label: "" };

export default function IpRestrictions() {
  const dispatch = useDispatch();
  const { rules, loading, error, success } = useSelector((s) => s.ipRestriction);
  const userRole = useSelector((s) => s.auth.user?.role?.name);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { dispatch(fetchIpRules()); }, [dispatch]);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearIpState()), 3000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ipAddress.trim()) return;
    if (editing) {
      dispatch(updateIpRule({ id: editing._id, ...form })).then((r) => { if (!r.error) { setEditing(null); setShowForm(false); setForm(EMPTY_FORM); } });
    } else {
      dispatch(createIpRule(form)).then((r) => { if (!r.error) { setShowForm(false); setForm(EMPTY_FORM); } });
    }
  };

  const startEdit = (rule) => {
    setEditing(rule);
    setForm({ type: rule.type, ipAddress: rule.ipAddress, label: rule.label });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteIpRule(id));
    setConfirmDelete(null);
  };

  const whitelist = rules.filter((r) => r.type === "whitelist");
  const blacklist = rules.filter((r) => r.type === "blacklist");

  const RuleRow = ({ rule }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${rule.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 opacity-60"}`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.isActive ? "bg-green-500" : "bg-gray-300"}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-mono font-medium text-gray-800 truncate">{rule.ipAddress}</p>
        {rule.label && <p className="text-xs text-gray-500 truncate">{rule.label}</p>}
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => dispatch(toggleIpRule(rule._id))} className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600" title={rule.isActive ? "Disable" : "Enable"}>
          {rule.isActive ? "Disable" : "Enable"}
        </button>
        <button onClick={() => startEdit(rule)} className="text-xs px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700">Edit</button>
        {confirmDelete === rule._id ? (
          <div className="flex gap-1">
            <button onClick={() => handleDelete(rule._id)} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Yes</button>
            <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 rounded bg-gray-200">No</button>
          </div>
        ) : (
          <button onClick={() => setConfirmDelete(rule._id)} className="text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700">Delete</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">IP Restrictions</h2>
          <p className="text-sm text-gray-500">Control which IP addresses can access your school's portal</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditing(null); setForm(EMPTY_FORM); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Add Rule
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
          <h3 className="text-sm font-semibold text-indigo-800">{editing ? "Edit Rule" : "Add New IP Rule"}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="whitelist">Whitelist (Allow only)</option>
              <option value="blacklist">Blacklist (Block)</option>
            </select>
            <input
              type="text"
              value={form.ipAddress}
              onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
              placeholder="192.168.1.100"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Label (e.g. Office WiFi)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              {loading ? "Saving..." : editing ? "Update" : "Add Rule"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }} className="px-4 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-100">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading && !rules.length ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Whitelist Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 font-medium text-sm">✅ Whitelist</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{whitelist.length}</span>
            </div>
            {whitelist.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-3">No whitelist rules. All IPs allowed (unless blacklisted).</p>
            ) : (
              <div className="space-y-2">{whitelist.map((r) => <RuleRow key={r._id} rule={r} />)}</div>
            )}
          </div>

          {/* Blacklist Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-red-600 font-medium text-sm">🚫 Blacklist</span>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{blacklist.length}</span>
            </div>
            {blacklist.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-3">No blacklist rules. No IPs are blocked.</p>
            ) : (
              <div className="space-y-2">{blacklist.map((r) => <RuleRow key={r._id} rule={r} />)}</div>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">How IP Rules Work</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Whitelist:</strong> Only listed IPs can access the portal. All others are blocked.</li>
          <li>• <strong>Blacklist:</strong> Listed IPs are blocked. All others are allowed.</li>
          <li>• If both whitelist and blacklist exist, whitelist takes precedence.</li>
          <li>• Disabled rules are ignored.</li>
        </ul>
      </div>
    </div>
  );
}
