import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { fetchReports } from "../features/reports/reportSlice";

const ReportFilters = () => {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({
    school: "",
    type: "",
    session: "",
    dateFrom: "",
    dateTo: "",
  });

  const apply = (e) => {
    e.preventDefault();
    dispatch(fetchReports(filters));
  };

  const reset = () => {
    const empty = { school: "", type: "", session: "", dateFrom: "", dateTo: "" };
    setFilters(empty);
    dispatch(fetchReports(empty));
  };

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50";

  const labelClass = "block text-sm font-medium text-gray-700";

  return (
    <form
      onSubmit={apply}
      className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-6 items-end"
    >
      {/* School */}
      <div>
        <label className={labelClass}>School</label>
        <input
          value={filters.school}
          onChange={(e) => setFilters({ ...filters, school: e.target.value })}
          className={inputClass}
          placeholder="School ID or name"
        />
      </div>

      {/* Type */}
      <div>
        <label className={labelClass}>Type</label>
        <input
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className={inputClass}
          placeholder="students, fees..."
        />
      </div>

      {/* Session */}
      <div>
        <label className={labelClass}>Session</label>
        <input
          value={filters.session}
          onChange={(e) => setFilters({ ...filters, session: e.target.value })}
          className={inputClass}
          placeholder="2025-2026"
        />
      </div>

      {/* From Date */}
      <div>
        <label className={labelClass}>From</label>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* To Date */}
      <div>
        <label className={labelClass}>To</label>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default ReportFilters;
