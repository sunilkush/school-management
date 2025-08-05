import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  clearAcademicYearMessages,
  createAcademicYear,
  archiveAcademicYear,
} from "../features/academicYear/academicYearSlice";
import { fetchSchools } from '../features/schools/schoolSlice';
const AcademicYearPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
   const { schools } = useSelector((state) => state.school);
  const [selectedSchoolId, setSelectedSchoolId] = useState(user?.role?.name === "Super Admin" ? "" : user?.school?._id);
   
  const {
    academicYears = [],
    activeYear = null,
    loading = false,
    error = null,
    message = null,
  } = useSelector((state) => state.academicYear);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  useEffect(() => {
    if (user?.role?.name === "Super Admin") {
      dispatch(fetchSchools()); // Fetch school list for Super Admin
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }
  }, [dispatch, selectedSchoolId]);

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
      if (s <= yEnd && e >= yStart) return "Date range overlaps with an existing academic year.";
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
    dispatch(createAcademicYear({ schoolId: selectedSchoolId, name, startDate, endDate }));
  };

  const handleSwitchActive = (id) => {
    dispatch(setActiveAcademicYear(id));
  };

  const handleArchive = (id) => {
    dispatch(archiveAcademicYear(id));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Academic Years</h1>

      {loading && <p>Loading...</p>}

      <table className="w-full border text-sm mb-4">
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
              <td className="border p-2">{ new Date(year.startDate).toLocaleDateString()}</td>
              <td className="border p-2">{new Date(year.endDate).toLocaleDateString()}</td>
              <td className="border p-2">
                {activeYear?._id === year._id ? "Active" : year.archived ? "Archived" : "Inactive"}
              </td>
              <td className="border p-2 space-x-2">
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
        </tbody>
      </table>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Create New Academic Year</h2>
        <div className="flex gap-2 items-start flex-col">
          <div className="flex gap-2 flex-col">
            {user?.role?.name === "Super Admin" ? (
              <div className="flex gap-2 flex-col">
                <label className="text-sm">Select School</label>
                <select
                  className="border px-2 py-1 rounded"
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
              <div className="flex gap-2 flex-col">
                <label className="text-sm">School</label>
                <input
                  type="text"
                  className="border px-2 py-1 rounded bg-gray-100"
                  value={user?.school?.name || ""}
                  readOnly
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-col">
            <label className="text-sm">Start Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-col">
            <label className="text-sm">End Date</label>
            <input
              type="date"
              className="border px-2 py-1 rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Create
          </button>
        </div>
      </div>

      {message && <p className="text-green-600 text-sm mt-2">{message}</p>}
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default AcademicYearPage;
