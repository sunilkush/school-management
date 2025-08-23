import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveAcademicYear,
  fetchAllAcademicYears,
} from "../../features/academicYear/academicYearSlice";

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { academicYears, activeYear, loading, error } = useSelector(
    (state) => state.academicYear
  );

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (!schoolId) return;

    // ✅ Only fetch when Redux has no data
    if (academicYears.length === 0) {
      dispatch(fetchAllAcademicYears(schoolId));
    }
    if (!activeYear) {
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  const handleChange = (e) => {
    const selectedYear = academicYears.find((y) => y._id === e.target.value);
    if (onChange) onChange(selectedYear);
  };

  if (loading && academicYears.length === 0 && !activeYear) {
    return <p className="text-sm text-gray-500">Loading academic years...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500">{error}</p>;
  }

  // 📌 Date format helper
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <select
      onChange={handleChange}
      value={activeYear?._id || ""}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="" disabled>
        Select Academic Year
      </option>
      {academicYears.map((year) => (
        <option key={year._id} value={year._id}>
          {year.name} ({formatDate(year.startDate)} - {formatDate(year.endDate)})
        </option>
      ))}
    </select>
  );
};

export default AcademicYearSwitcher;
