import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  clearAcademicYearMessages,
  createAcademicYear,
  archiveAcademicYear,
} from "../../../features/academicYearSlice";
import { fetchSchools } from "../../../features/schoolSlice";

const AcademicYearPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { schools } = useSelector((state) => state.school);

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    user?.role?.name === "Super Admin" ? "" : user?.school?._id
  );

  const {
    academicYears = [],
    activeYear = null,
    loading = false,
    error = null,
    message = null,
  } = useSelector((state) => state.academicYear);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch schools if Super Admin
  useEffect(() => {
    if (user?.role?.name === "Super Admin") {
      dispatch(fetchSchools());
    }
  }, [dispatch, user]);

  // Fetch academic years for selected school
  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }
  }, [dispatch, selectedSchoolId]);

  // Clear messages after 4s
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        dispatch(clearAcademicYearMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error, dispatch]);

  const generateYearName = (start, end) => {
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    return `${startYear}-${endYear}`;
  };

  const validateDates = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (s >= e) return "Start date must be before end date.";
    for (const y of academicYears) {
      const yStart = new Date(y.startDate);
      const yEnd = new Date(y.endDate);
      if (s <= yEnd && e >= yStart)
        return "Date range overlaps with an existing academic year.";
    }
    return null;
  };

  const handleCreate = () => {
    const validationError = validateDates();
    if (validationError) {
      alert(validationError);
      return;
    }
    const name = generateYearName(startDate, endDate);
    dispatch(
      createAcademicYear({ schoolId: selectedSchoolId, name, startDate, endDate })
    );
  };

  const handleSwitchActive = (id) => {
    dispatch(setActiveAcademicYear(id));
  };

  const handleArchive = (id) => {
    dispatch(archiveAcademicYear(id));
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Academic Years</h1>

      {/* Alerts */}
      {message && (
        <div className="bg-green-100 text-green-700 p-2 rounded text-sm">
          {typeof message === "string"
            ? message
            : message?.msg || JSON.stringify(message)}
        </div>
      )}
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm">
          {typeof error === "string"
            ? error
            : error?.errors || JSON.stringify(error)}
        </div>
      )}

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm mb-4 border-collapse bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Start Date</th>
              <th className="border p-2">End Date</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {academicYears.map((year) => (
              <tr key={year._id} className="text-center">
                <td className="border p-2">{year.name}</td>
                <td className="border p-2">
                  {new Date(year.startDate).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {new Date(year.endDate).toLocaleDateString()}
                </td>
                <td className="border p-2">
                  {activeYear?._id === year._id
                    ? "Active"
                    : year.archived
                    ? "Archived"
                    : "Inactive"}
                </td>
                <td className="border p-2 space-x-3">
                  {year.archived ? (
                    <span className="text-gray-400">(Archived)</span>
                  ) : (
                    <>
                      {activeYear?._id !== year._id && (
                        <button
                          onClick={() => handleSwitchActive(year._id)}
                          className="text-blue-600 hover:underline"
                        >
                          Switch Active
                        </button>
                      )}
                      <button
                        onClick={() => handleArchive(year._id)}
                        className="text-red-600 hover:underline"
                      >
                        Archive
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {academicYears.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="p-4 text-gray-500 text-center">
                  No academic years found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form */}
      <div className="bg-white p-4 rounded shadow max-w-xl">
        <h2 className="text-lg font-semibold mb-4">Create New Academic Year</h2>

        <div className="space-y-3">
          {user?.role?.name === "Super Admin" ? (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Select School</label>
              <select
                className="border px-2 py-2 rounded"
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
              >
                <option value="">Select School</option>
                {schools.map((school) => (
                  <option key={school._id} value={school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">School</label>
              <input
                type="text"
                className="border px-2 py-2 rounded bg-gray-100"
                value={user?.school?.name || ""}
                readOnly
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Start Date</label>
            <input
              type="date"
              className="border px-2 py-2 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">End Date</label>
            <input
              type="date"
              className="border px-2 py-2 rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicYearPage;
