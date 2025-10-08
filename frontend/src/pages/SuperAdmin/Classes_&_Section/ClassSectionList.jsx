import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSection } from '../../../features/sectionSlice';
import { fetchAllClasses } from '../../../features/classSlice';
import { fetchSchools } from '../../../features/schoolSlice';

function ClassSectionList() {
  const dispatch = useDispatch();
  const [selectedSchool, setSelectedSchool] = useState('');

  const { classList = [] } = useSelector((state) => state.class);
  const { sectionList = [], loading, error } = useSelector((state) => state.section);
  const { schools = [] } = useSelector((state) => state.school);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // Fetch classes and sections whenever a school is selected
  useEffect(() => {
    if (selectedSchool) {
      dispatch(fetchAllClasses(selectedSchool));
      dispatch(fetchSection(selectedSchool));
    }
  }, [dispatch, selectedSchool]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* School Dropdown */}
      <div className="col-span-2">
        <select
          className="border p-2 rounded-lg w-1/4"
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
        >
          <option value="">Select school</option>
          {schools.map((sch) => (
            <option key={sch._id} value={sch._id}>
              {sch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Classes Table */}
      <div className="border p-2 rounded-lg">
        <h1 className="font-semibold mb-2">Class</h1>
        {selectedSchool ? (
          classList.length > 0 ? (
            <table className="w-full border mt-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {classList.map((cls) => (
                  <tr key={cls._id}>
                    <td className="border px-2 py-1">{cls.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No classes found for this school.</p>
          )
        ) : (
          <p>Please select a school to view classes.</p>
        )}
      </div>

      {/* Sections Table */}
      <div className="border p-2 rounded-lg">
        <h1 className="font-semibold mb-2">Section</h1>

        {loading && <p>Loading sections...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && selectedSchool ? (
          sectionList.length > 0 ? (
            <table className="w-full border mt-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Name</th>
                </tr>
              </thead>
              <tbody>
                {sectionList.map((s) => (
                  <tr key={s._id}>
                    <td className="border px-2 py-1">{s.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No sections found for this school.</p>
          )
        ) : (
          <p>Please select a school to view sections.</p>
        )}
      </div>
    </div>
  );
}

export default ClassSectionList;
