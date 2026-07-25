import React, { useEffect } from "react";

import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../../../features/schoolSlice";
import { fetchAllAcademicYears } from "../../../../features/academicYearSlice";

const ReportFilters = ({ filters, setFilters }) => {
  const dispatch = useDispatch();
  const { schools } = useSelector((state) => state.school);
  const { academicYears = [] } = useSelector((state) => state.academicYear || {});

  useEffect(() => {
    dispatch(fetchSchools({ limit: 500 }));
  }, [dispatch]);

  useEffect(() => {
    if (filters.school) dispatch(fetchAllAcademicYears(filters.school));
  }, [dispatch, filters.school]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
      {/* School Dropdown */}
      <select
        className="border rounded p-2"
        value={filters.school}
        onChange={(e) => setFilters({ ...filters, school: e.target.value, session: "" })}
      >
        <option value="">All Schools</option>
        {schools.map((school) => (
          <option key={school._id} value={school._id}>
            {school.name}
          </option>
        ))}
      </select>

      {/* Academic Year — depends on a school being selected first, since
          AcademicYear records belong to a single school */}
      <select
        className="border rounded p-2"
        value={filters.session}
        disabled={!filters.school}
        onChange={(e) => setFilters({ ...filters, session: e.target.value })}
      >
        <option value="">{filters.school ? "All Years" : "Select a school first"}</option>
        {academicYears.map((year) => (
          <option key={year._id} value={year._id}>
            {year.name}
          </option>
        ))}
      </select>

      {/* Report Type */}
      <select
        className="border rounded p-2"
        value={filters.type}
        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
      >
        <option value="">All Types</option>
        <option value="students">Students</option>
        <option value="fees">Fees</option>
        <option value="attendance">Attendance</option>
        <option value="performance">Performance</option>
        <option value="custom">Custom</option>
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
        <option value="draft">Draft</option>
        <option value="finalized">Finalized</option>
      </select>
    </div>
  );
};

export default ReportFilters;
