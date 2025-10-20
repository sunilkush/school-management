import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Select } from "antd";
import DataTable from "react-data-table-component";
import { fetchSchools } from "../../../features/schoolSlice";
import { fetchRoles, fetchRoleBySchool } from "../../../features/roleSlice";

const { Option } = Select;

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
      dispatch(fetchRoles()); // load global roles
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
        <label className="block mb-1 font-semibold">
          Select School (optional):
        </label>
        {!schools.length ? (
          <p className="text-gray-500">Loading schools...</p>
        ) : (
          <Select
            value={selectedSchoolId || undefined}
            onChange={(value) => setSelectedSchoolId(value)}
            allowClear
            placeholder="-- Global Roles --"
            className="w-full"
          >
            {schools.map((school) => (
              <Option key={school._id} value={school._id}>
                {school.name}
              </Option>
            ))}
          </Select>
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
