import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRole, fetchRoles } from "../../features/roles/roleSlice.js";
import { fetchSchools } from "../../features/schools/schoolSlice.js";

const AddRoleForm = () => {
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [permissions, setPermissions] = useState([{ module: "", actions: [] }]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { schools } = useSelector((state) => state.school);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const roleOptions = [
    "School Admin",
    "Teacher",
    "Student",
    "Parent",
    "Accountant",
    "Staff",
    "Librarian",
    "Hostel Warden",
    "Transport Manager",
    "Exam Coordinator",
    "Receptionist",
    "IT Support",
    "Counselor",
    "Subject Coordinator",
  ];

  const moduleOptions = [
    "Schools",
    "Users",
    "Teachers",
    "Students",
    "Parents",
    "Classes",
    "Subjects",
    "Exams",
    "Attendance",
    "Finance",
    "Settings",
    "Fees",
    "Reports",
    "Hostel",
    "Transport",
    "Assignments",
    "Timetable",
    "Notifications",
    "Expenses",
    "Library",
    "Books",
    "IssuedBooks",
    "Rooms",
    "Routes",
    "Vehicles",
  ];

  const actionOptions = ["create", "read", "update", "delete"];

  const handlePermissionChange = (index, key, value) => {
    const updated = [...permissions];

    // ✅ Ensure object exists
    if (!updated[index]) {
      updated[index] = { module: "", actions: [] };
    }

    // ✅ Ensure actions is a valid array
    if (!Array.isArray(updated[index].actions)) {
      updated[index].actions = [];
    }

    if (key === "module") {
      updated[index].module = value;
    } else if (key === "actions") {
      const alreadyIncluded = updated[index].actions.includes(value);
      updated[index].actions = alreadyIncluded
        ? updated[index].actions.filter((a) => a !== value)
        : [...updated[index].actions, value];
    }

    setPermissions(updated);
  };

  const addPermission = () =>
    setPermissions([...permissions, { module: "", actions: [] }]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await dispatch(createRole({ name, schoolId, permissions })).unwrap();
      dispatch(fetchRoles());
      setSuccessMessage("Role created successfully!");
      setName("");
      setSchoolId("");
      setPermissions([{ module: "", actions: [] }]);
    } catch (error) {
      setErrorMessage(error.message || "Failed to create role.");
    }
  };

  return (
    <div className="p-4  w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Create Role</h2>

      {/* Success & Error Messages */}
      {successMessage && (
        <div className="bg-green-100 text-green-700 p-2 rounded mb-2">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-100 text-red-700 p-2 rounded mb-2">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Dropdown */}
        <div>
          <label className="block mb-1">Role Name</label>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Role</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* School Dropdown */}
        <div>
          <label className="block mb-1">School</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select School</option>
            {schools.map((school) => (
              <option key={school._id} value={school._id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {/* Permissions */}
        <div>
          <label className="block mb-2 font-semibold">Permissions</label>
          {permissions.map((perm, index) => (
            <div key={index} className="mb-4 border p-2 rounded">
              <select
                value={perm.module}
                onChange={(e) =>
                  handlePermissionChange(index, "module", e.target.value)
                }
                className="w-full border p-2 rounded mb-2"
                required
              >
                <option value="">Select Module</option>
                {moduleOptions.map((mod) => (
                  <option key={mod} value={mod}>
                    {mod}
                  </option>
                ))}
              </select>
              <div className="flex gap-4 flex-wrap">
                {actionOptions.map((action) => (
                  <label key={action} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={perm.actions.includes(action)}
                      onChange={() =>
                        handlePermissionChange(index, "actions", action)
                      }
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPermission}
            className="bg-green-600 text-white px-3 py-1 rounded mt-2"
          >
            Add Module
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Role
        </button>
      </form>
    </div>
  );
};

export default AddRoleForm;
