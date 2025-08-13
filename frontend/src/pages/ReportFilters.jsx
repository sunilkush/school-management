import React, { useEffect} from "react";

import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../features/schools/schoolSlice";

const ReportFilters = ({ filters, setFilters }) => {
  const dispatch = useDispatch();
  const { schools } = useSelector((state) => state.school);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {/* School Dropdown */}
      <select
        className="border rounded p-2"
        value={filters.school}
        onChange={(e) => setFilters({ ...filters, school: e.target.value })}
      >
        <option value="">All Schools</option>
        {schools.map((school) => (
          <option key={school._id} value={school._id}>
            {school.name}
          </option>
        ))}
      </select>

      {/* Academic Year */}
      <select
        className="border rounded p-2"
        value={filters.academicYear}
        onChange={(e) =>
          setFilters({ ...filters, academicYear: e.target.value })
        }
      >
        <option value="">All Years</option>
        <option value="2025-2026">2025-2026</option>
        <option value="2024-2025">2024-2025</option>
      </select>

      {/* Report Type */}
      <select
        className="border rounded p-2"
        value={filters.reportType}
        onChange={(e) =>
          setFilters({ ...filters, reportType: e.target.value })
        }
      >
        <option value="">All Types</option>
        <option value="students">Students</option>
        <option value="fees">Fees</option>
        <option value="attendance">Attendance</option>
      </select>

      {/* Date Range From */}
      <input
        type="date"
        className="border rounded p-2"
        value={filters.dateFrom}
        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
      />

      {/* Date Range To */}
      <input
        type="date"
        className="border rounded p-2"
        value={filters.dateTo}
        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
      />

      {/* Status */}
      <select
        className="border rounded p-2"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  );
};

export default ReportFilters;
