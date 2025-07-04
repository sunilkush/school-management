import DataTable from "react-data-table-component";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools } from "../features/schools/schoolSlice";
import { fetchRoleBySchool } from "../features/roles/roleSlice";

const Permissions = () => {
  const dispatch = useDispatch();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const { schools } = useSelector((state) => state.school);
  const { roles = [], loading } = useSelector((state) => state.role);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchRoleBySchool(selectedSchoolId));
    }
  }, [dispatch, selectedSchoolId]);

  // Extract unique modules
  const allModules = Array.from(
    new Set(
      roles.flatMap((role) => role.permissions?.map((perm) => perm.module))
    )
  );

  // Prepare rows
  const rows = allModules
  .sort((a, b) => a.localeCompare(b)) // <-- SORT HERE
  .map((module) => {
    const row = { module };
    roles.forEach((role) => {
      const hasPerm = role.permissions?.some(
        (perm) => perm.module === module && perm.actions.length > 0
      );
      row[role.name] = hasPerm;
    });
    return row;
  });

  // Prepare columns
  const columns = [
    {
      name: "Module",
      selector: (row) => row.module,
      sortable: true,
      wrap: true,
    },
    ...roles.map((role) => ({
      name: role.name,
      selector: (row) => row[role.name],
      cell: (row) =>
        row[role.name] ? (
          <span className="text-green-600 font-bold text-lg">✔️</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
      center: true,
    })),
  ];

  return (
    <div className="p-4 space-y-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl">Check Parmissions</h2>
      <div className="mt-4 max-w-md">
        
        <label className="block mb-1 font-semibold">Select School:</label>
        <select
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Select School --</option>
          {schools.map((school) => (
            <option key={school._id} value={school._id}>
              {school.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conditional rendering: show only if a school is selected */}
      {selectedSchoolId && (
        <DataTable
          className="border border-gray-200"
          title="Role-wise Permissions Matrix"
          columns={columns}
          data={rows}
          striped
          highlightOnHover
          progressPending={loading}
          pagination
          dense
          responsive
          noDataComponent="No permissions found for selected school."
        />
      )}
    </div>
  );
};

export default Permissions;
