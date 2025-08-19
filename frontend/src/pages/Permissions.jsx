import DataTable from "react-data-table-component";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools } from "../features/schools/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../features/roles/roleSlice"; // ✅ add fetchRoles

const Permissions = () => {
  const dispatch = useDispatch();
  const [selectedSchoolId, setSelectedSchoolId] = useState("");

  const { schools } = useSelector((state) => state.school);
  const { roles = [], loading } = useSelector((state) => state.role);

  // Load all schools
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // Load roles depending on school selection
  useEffect(() => {
    if (selectedSchoolId) {
      dispatch(fetchRoleBySchool(selectedSchoolId));
    } else {
      dispatch(fetchRoles()); // ✅ load global roles
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
    .sort((a, b) => a.localeCompare(b))
    .map((module) => {
      const row = { module };
      roles.forEach((role) => {
        const hasPerm = role.permissions?.some(
          (perm) => perm.module === module && perm.actions.length > 0
        );
        row[role._id] = hasPerm;
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
      selector: (row) => row[role._id],
      cell: (row) =>
        row[role._id] ? (
          <span className="text-green-600 font-bold text-lg">✔️</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
      center: true,
    })),
  ];

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold">Check Permissions</h2>

      <div className="mt-4 max-w-md">
        <label className="block mb-1 font-semibold">Select School (optional):</label>
        {!schools.length ? (
          <p className="text-gray-500">Loading schools...</p>
        ) : (
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          >
            <option value="">-- Global Roles --</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <DataTable
        className="border border-gray-200 p-3"
        title={`Role-wise Permissions Matrix ${
          selectedSchoolId ? "(School Specific)" : "(Global)"
        }`}
        columns={columns}
        data={rows}
        striped
        highlightOnHover
        progressPending={loading}
        pagination
        dense
        responsive
        noDataComponent="No permissions found."
      />
    </div>
  );
};

export default Permissions;
