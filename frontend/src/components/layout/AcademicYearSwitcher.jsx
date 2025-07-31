import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveAcademicYear,
  fetchAllAcademicYears,
} from "../../features/academicYear/academicYearSlice";

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.school?._id;

  const {
    academicYears = [],
    activeYear = null,
    loading = false,
    error = null,
  } = useSelector((state) => state.academicYear || {});

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllAcademicYears(schoolId));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedYear = academicYears.find((y) => y._id === selectedId);
    if (onChange && selectedYear) {
      onChange(selectedYear);
    }
  };

  return (
    <div>
      {loading && (
        <p className="text-sm text-gray-500">Loading academic years...</p>
      )}

      {!loading && academicYears.length > 0 && (
        <select
          className="border px-3 py-1 rounded-md"
          onChange={handleChange}
          value={activeYear?._id || ""}
        >
          <option value="" disabled>
            Select Academic Year
          </option>
          {academicYears.map((year) => {
            // 🛡️ Defensive check to prevent errors
            if (!year || !year.startDate || !year.endDate) return null;

            const formattedStart = new Date(year.startDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            const formattedEnd = new Date(year.endDate).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            });

            return (
              <option key={year._id} value={year._id}>
                {year.name} ({formattedStart} - {formattedEnd})
              </option>
            );
          })}
        </select>
      )}

      {!loading && academicYears.length === 0 && (
        <p className="text-sm text-gray-500">No academic years available.</p>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default AcademicYearSwitcher;
