import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRole } from "../../features/roles/roleSlice";
import { fetchSchools } from "../../features/schools/schoolSlice";

// Modules & Actions
const moduleOptions = [
  "Schools","Users","Teachers","Students","Parents","Classes","Subjects","Exams",
  "Attendance","Finance","Settings","Fees","Reports","Hostel","Transport","Assignments",
  "Timetable","Notifications","Expenses","Library","Books","IssuedBooks","Rooms","Routes","Vehicles"
];
const actionOptions = ["create","read","update","delete","export","collect","return","assign"];

// Predefined Roles
const roles = [
  "Super Admin","School Admin","Teacher","Student","Parent","Accountant","Staff",
  "Librarian","Hostel Warden","Transport Manager","Exam Coordinator","Receptionist",
  "IT Support","Counselor","Subject Coordinator"
];

const AddRoleForm = () => {
  const dispatch = useDispatch();
  const { schools } = useSelector((state) => state.school);
  const { error, loading, message } = useSelector((state) => state.role);

  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // Handle role change
  const handleRoleChange = (value) => {
    setName(value);
    setPermissions([]);

    // Auto-fill default permissions for certain roles
    if (value === "School Admin") {
      const fullPermissions = moduleOptions.map((m) => ({
        module: m,
        actions: [...actionOptions],
      }));
      setPermissions(fullPermissions);
    }
  };

  // Handle module selection in custom permissions
  const handleModuleChange = (index, module) => {
    const updated = [...permissions];
    updated[index].module = module;
    setPermissions(updated);
  };

  // Handle action checkbox
  const handleActionChange = (index, action) => {
    const updated = [...permissions];
    const exists = updated[index].actions.includes(action);
    updated[index].actions = exists
      ? updated[index].actions.filter((a) => a !== action)
      : [...updated[index].actions, action];
    setPermissions(updated);
  };

  // Add new permission block
  const addPermission = () => {
    setPermissions([...permissions, { module: "", actions: [] }]);
  };

  // Remove permission block
  const removePermission = (index) => {
    const updated = [...permissions];
    updated.splice(index, 1);
    setPermissions(updated);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) return alert("Please select a role");
    if (name !== "Super Admin" && !schoolId) return alert("Please select a school");

    const payload = { name };
    if (name !== "Super Admin") payload.schoolId = schoolId;
    if (permissions.length > 0) payload.permissions = permissions;

    try {
      await dispatch(createRole(payload)).unwrap();
      setName("");
      setSchoolId("");
      setPermissions([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white rounded shadow">
      <h2 className="text-xl font-semibold">Create Role</h2>

      {loading && <p className="text-blue-500">Creating role...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium">Role Name</label>
        <select
          value={name}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="mt-1 block w-full border p-2 rounded"
          required
        >
          <option value="">Select Role</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* School Selection */}
      {name && name !== "Super Admin" && (
        <div>
          <label className="block text-sm font-medium">School</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="mt-1 block w-full border p-2 rounded"
            required
          >
            <option value="">Select School</option>
            {schools.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Default Permission Note */}
      {name && name !== "School Admin" && permissions.length === 0 && (
        <div className="text-xs text-gray-500">
          Default permissions will be applied automatically if left empty.
        </div>
      )}

      {/* Custom Permissions */}
      {permissions.map((perm, index) => (
        <div key={index} className="border p-4 rounded mb-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block font-medium">Module</label>
            <button
              type="button"
              className="text-red-500 text-sm"
              onClick={() => removePermission(index)}
            >
              Remove
            </button>
          </div>
          <select
            value={perm.module}
            onChange={(e) => handleModuleChange(index, e.target.value)}
            className="block w-full border p-2 rounded mb-2"
            required
          >
            <option value="">Select Module</option>
            {moduleOptions.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>

          <div className="flex flex-wrap gap-2">
            {actionOptions.map((action) => (
              <label key={action} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={perm.actions.includes(action)}
                  onChange={() => handleActionChange(index, action)}
                />
                <span>{action}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Add Permission & Submit */}
      <div className="flex justify-between items-center gap-4">
        <button type="button" onClick={addPermission} className="text-blue-500 text-sm">
          + Add Permission
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Create Role
        </button>
      </div>
    </form>
  );
};

export default AddRoleForm;
