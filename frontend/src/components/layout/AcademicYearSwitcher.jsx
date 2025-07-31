import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchActiveAcademicYear,
  fetchAllAcademicYears,
} from "../../features/academicYear/acadmicYearSclice";

const AcademicYearSwitcher = ({ onChange }) => {
  const dispatch = useDispatch();

  // Safe selector with fallback
  const academicYearState = useSelector((state) => state.academicYear || {});
  const {
    activeYear = null,
    academicYears = [],
    loading = false,
  } = academicYearState;

  useEffect(() => {
    dispatch(fetchActiveAcademicYear());
    dispatch(fetchAllAcademicYears());
  }, [dispatch]);

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
        <select
        className="border px-3 py-1 rounded-md"
        onChange={handleChange}
        value={activeYear?._id || ""}
      >
        <option value="" disabled>
          Select Academic Year
        </option>
        {academicYears.map((year) => (
          <option key={year._id} value={year._id}>
            {year.name} ({year.startDate} - {year.endDate})
          </option>
        ))}
      </select>
      )}
    </div>
  );
};

export default AcademicYearSwitcher;
