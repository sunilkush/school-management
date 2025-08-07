import { useEffect} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  clearAcademicYearMessages,
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
    message = null,
  } = useSelector((state) => state.academicYear);

  // ✅ Fetch academic years when schoolId is available
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllAcademicYears(schoolId));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  // ✅ Clear success/error messages after 4 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        dispatch(clearAcademicYearMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  // ✅ Handle academic year change
  const handleChange = (e) => {
    const selectedId = e.target.value;
    const selectedYear = academicYears.find((y) => y._id === selectedId);
    if (!selectedYear) return;

    dispatch(setActiveAcademicYear(selectedId))
      .unwrap()
      .then(() => {
        localStorage.setItem("academicYearId", selectedId); // Save to localStorage
        if (onChange) onChange(selectedYear); // Callback
      })
      .catch((err) => {
        console.error("Failed to set active academic year:", err);
      });
  };

  return (
    <div>
      {loading && <p className="text-sm text-gray-500">Loading academic years...</p>}

      {!loading && academicYears.length > 0 && (
        <select
          className="border px-2 py-1 rounded-md text-xs"
          onChange={handleChange}
          value={activeYear?._id || ""}
        >
          <option value="" disabled className="text-xs">
            Select Academic Year
          </option>
          {academicYears.map((year) => {
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
              <option className="text-xs" key={year._id} value={year._id}>
                {formattedStart} - {formattedEnd}
              </option>
            );
          })}
        </select>
      )}

      {!loading && academicYears.length === 0 && (
        <p className="text-sm text-gray-500">No academic years available.</p>
      )}

      {message && <p className="text-green-600 text-xs mt-2">{message}</p>}
      {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default AcademicYearSwitcher;
