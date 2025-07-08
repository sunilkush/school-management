import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRole, fetchRoles } from "../../features/roles/roleSlice";
import { fetchSchools } from "../../features/schools/schoolSlice";

const AddRoleForm = () => {
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  
  const { schools } = useSelector((state) => state.school);
  console.log(name,schoolId,permissions)
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

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleModuleToggle = (moduleName) => {
    const exists = permissions.find((p) => p.module === moduleName);
    if (exists) {
      setPermissions(permissions.filter((p) => p.module !== moduleName));
    } else {
      setPermissions([...permissions, { module: moduleName, actions: [] }]);
    }
  };

  const handleActionToggle = (moduleIndex, action) => {
    const updated = [...permissions];
    const existingActions = updated[moduleIndex].actions;
    if (existingActions.includes(action)) {
      updated[moduleIndex].actions = existingActions.filter(
        (a) => a !== action
      );
    } else {
      updated[moduleIndex].actions.push(action);
    }
    setPermissions(updated);
  };

  const handleRoleChange = (value) => {
    setName(value);
    if (value === "School Admin") {
      const full = moduleOptions.map((m) => ({
        module: m,
        actions: [...actionOptions],
      }));
      setPermissions(full);
    } else {
      setPermissions([]);
    }
  };

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
      setPermissions([]);
    } catch (error) {
      setErrorMessage(error?.message || "Failed to create role");
    }
  };

  return (
    <div className="p-4 w-full  mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Create Role</h2>

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
        <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3   gap-4">
        {/* Role */}
        <div>
          <label className="block mb-1">Role Name <span className="text-red-700 text-xs">*</span></label>
          <select
            value={name}
            onChange={(e) => handleRoleChange(e.target.value)}
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

        {/* School */}
        <div>
          <label className="block mb-1">School <span className="text-red-700 text-xs">*</span></label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select School</option>
            {schools?.map((school) => (
              <option key={school._id} value={school._id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>
        </div>
        {/* Modules Selection */}
        {name !== "School Admin" && (
          <div>
            <label className="block font-semibold mb-1">Select Modules <span className="text-red-700 text-xs">(Required)</span></label>
            <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
              {moduleOptions.map((module) => (
                <label key={module} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={permissions.some((p) => p.module === module)}
                    onChange={() => handleModuleToggle(module)}
                  />
                  {module}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Actions per module */}
        <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5  gap-4">
          {permissions.map((perm, index) => (
            <div key={perm.module} className="border rounded p-3">
              <p className="font-medium">{perm.module}</p>
              <div className="flex gap-4 flex-wrap mt-2">
                {actionOptions.map((action) => (
                  <label
                    key={action}
                    className="capitalize flex items-center gap-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={perm.actions.includes(action)}
                      onChange={() => handleActionToggle(index, action)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Submit */}
        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          Create Role
        </button>
      </form>
    </div>
  );
};

export default AddRoleForm;
