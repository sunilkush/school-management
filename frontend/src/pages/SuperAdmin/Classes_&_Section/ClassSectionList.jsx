import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSection } from "../../../features/sectionSlice";
import { fetchSchools } from "../../../features/schoolSlice";

function ClassSectionList() {
  const dispatch = useDispatch();

  const { sectionList = [], loading, error } = useSelector(
    (state) => state.section
  );
  const { schools = [] } = useSelector((state) => state.school);

  const [selectedSchool, setSelectedSchool] = useState("");

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchSection());
  }, [dispatch]);

  const handleSchoolChange = (e) => {
    setSelectedSchool(e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* School Dropdown */}
      <div className="col-span-2">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Select School
        </label>
        <select
          value={selectedSchool}
          onChange={handleSchoolChange}
          className="w-full border rounded-md p-2"
        >
          <option value="">-- Select School --</option>
          {schools.map((school) => (
            <option key={school._id} value={school._id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* Class Section Grid */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold">Class</h2>
        <p className="text-sm text-gray-500">Class data will appear here.</p>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">Section</h2>

        {loading && <p>Loading sections...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}

        {!loading && !error && sectionList.length > 0 ? (
          <table className="w-full border border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-4 py-2 text-left">Name</th>
              </tr>
            </thead>
            <tbody>
              {sectionList.map((section) => (
                <tr key={section._id}>
                  <td className="border px-4 py-2">{section.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading &&
          sectionList.length === 0 && <p>No sections available.</p>
        )}
      </div>
    </div>
  );
}

export default ClassSectionList;
