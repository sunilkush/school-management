import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { createReport, fetchReports } from "../../../../features/reportSlice";
import { fetchSchools } from "../../../../features/schoolSlice";
import { fetchAllAcademicYears } from "../../../../features/academicYearSlice";
import { useNavigate } from "react-router-dom";

const CreateReportForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [payload, setPayload] = useState({
    title: "",
    data: "",
    type: "",
    school: "",
    session: "",
    meta: [],
  });

  const typeOptions = [
    { value: "students", label: "Students" },
    { value: "fees", label: "Fees" },
    { value: "attendance", label: "Attendance" },
  ];

  const metaOptions = [
    "Transport",
    "Hostel",
    "Library",
    "Sports",
    "Extra Curricular",
  ];

  // Schools list load
  useEffect(() => {
    dispatch(fetchSchools()).unwrap().then(setSchools);
  }, [dispatch]);

  // Sessions list load when school changes
  useEffect(() => {
    if (payload.school) {
      dispatch(fetchAllAcademicYears(payload.school))
        .unwrap()
        .then((data) => {
          setSessions(data);
          // Auto select active session
          const activeSession = data.find((sess) => sess.isActive);
          if (activeSession) {
            setPayload((prev) => ({
              ...prev,
              session: activeSession._id,
            }));
          }
        });
    } else {
      setSessions([]);
      setPayload((prev) => ({ ...prev, session: "" }));
    }
  }, [dispatch, payload.school]);

  const toggleMeta = (option) => {
    setPayload((prev) => ({
      ...prev,
      meta: prev.meta.includes(option)
        ? prev.meta.filter((m) => m !== option)
        : [...prev.meta, option],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    await dispatch(createReport(payload)).unwrap();
    await dispatch(fetchReports());
    navigate("/dashboard/superadmin/reports");
  };

  const inputClass =
    "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50";

  return (
    <form
      onSubmit={submit}
      className="p-4 border border-gray-300 rounded-lg shadow-sm mb-4 bg-white"
    >
      <h2 className="text-lg font-semibold mb-4">Create Report</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          placeholder="Report Title"
          value={payload.title}
          onChange={(e) => setPayload({ ...payload, title: e.target.value })}
          className={inputClass}
        />

        <textarea
          placeholder="Report Data (JSON or text)"
          value={payload.data}
          onChange={(e) => setPayload({ ...payload, data: e.target.value })}
          className={inputClass}
        />

        <select
          value={payload.type}
          onChange={(e) => setPayload({ ...payload, type: e.target.value })}
          className={inputClass}
        >
          <option value="">Select Type</option>
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={payload.school}
          onChange={(e) => setPayload({ ...payload, school: e.target.value })}
          className={inputClass}
        >
          <option value="">Select School</option>
          {schools.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={payload.session}
          onChange={(e) => setPayload({ ...payload, session: e.target.value })}
          className={inputClass}
          disabled={!payload.school}
        >
          <option value="">Select Session</option>
          {sessions.map((sess) => (
            <option key={sess._id} value={sess._id}>
              {sess.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <div className="flex flex-wrap gap-2 border border-gray-300 rounded-lg p-2 min-h-[42px]">
            {payload.meta.map((item) => (
              <span
                key={item}
                className="flex items-center bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs"
              >
                {item}
                <button
                  type="button"
                  onClick={() => toggleMeta(item)}
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
            <select
              className="bg-transparent text-sm outline-none"
              onChange={(e) => {
                if (e.target.value) toggleMeta(e.target.value);
                e.target.value = "";
              }}
            >
              <option value="">Add Meta</option>
              {metaOptions
                .filter((m) => !payload.meta.includes(m))
                .map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1"
        >
          Create Report
        </button>
      </div>
    </form>
  );
};

export default CreateReportForm;
