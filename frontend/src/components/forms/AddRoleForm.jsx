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
const roleOptions = [
  "School Admin","Principal","Vice Principal","Teacher","Student","Parent","Accountant","Staff",
  "Librarian","Hostel Warden","Transport Manager","Exam Coordinator","Receptionist",
  "IT Support","Counselor","Subject Coordinator",""
];

const AddRoleForm = () => {
  const dispatch = useDispatch();
  const { schools } = useSelector((state) => state.school);
  const { error, loading, message } = useSelector((state) => state.role);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("custom");
  const [level, setLevel] = useState(1);
  const [schoolId, setSchoolId] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // Handle role change
  const handleRoleChange = (value) => {
    setName(value);
    setPermissions([]);

    // Auto-fill full permissions for School Admin
    if (value === "School Admin") {
      const fullPermissions = moduleOptions.map((m) => ({
        module: m,
        actions: [...actionOptions],
      }));
      setPermissions(fullPermissions);
    }
  };

  // Module selection
  const handleModuleChange = (index, module) => {
    const updated = [...permissions];
    updated[index].module = module;
    setPermissions(updated);
  };

  // Action checkbox
  const handleActionChange = (index, action) => {
    const updated = [...permissions];
    const exists = updated[index].actions.includes(action);
    updated[index].actions = exists
      ? updated[index].actions.filter((a) => a !== action)
      : [...updated[index].actions, action];
    setPermissions(updated);
  };

  // Add/Remove permissions
  const addPermission = () => setPermissions([...permissions, { module: "", actions: [] }]);
  const removePermission = (index) => setPermissions(permissions.filter((_, i) => i !== index));

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) return alert("Please select a role");
    if (name !== "Super Admin" && !schoolId) return alert("Please select a school");

    const payload = {
      name,
      code: code || name.toUpperCase().replace(/\s+/g, "_"), // fallback
      description,
      type,
      level,
      schoolId: name !== "Super Admin" ? schoolId : null,
      permissions: permissions.length > 0 ? permissions : undefined,
      isActive,
    };

    try {
      await dispatch(createRole(payload)).unwrap();
      setName(""); setCode(""); setDescription("");
      setType("custom"); setLevel(1);
      setSchoolId(""); setPermissions([]); setIsActive(true);
    } catch (err) {
      console.error("Role creation failed", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-2 bg-white rounded shadow">
      <h2 className="text-xl font-semibold">Create Role</h2>

      {loading && <p className="text-blue-500">Creating role...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      {/* Role Name */}
      <div>
        <label className="block text-sm font-medium">Role Name</label>
        <select
          value={name}
          onChange={(e) => handleRoleChange(e.target.value)}
          className="mt-1 block w-full border px-2 py-1 rounded"
          required
        >
          <option value="">Select Role</option>
          {roleOptions.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {/* Code */}
      <div>
        <label className="block text-sm font-medium">Code</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SA, TEACH, ADMIN"
          className="mt-1 block w-full border px-2 py-1 rounded"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter role description"
          className="mt-1 block w-full border px-2 py-1 rounded"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="mt-1 block w-full border px-2 py-1 rounded"
        >
          <option value="system">System</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      {/* Level */}
      <div>
        <label className="block text-sm font-medium">Level (Hierarchy)</label>
        <input
          type="number"
          value={level}
          min="1"
          onChange={(e) => setLevel(Number(e.target.value))}
          className="mt-1 block w-full border px-2 py-1 rounded"
        />
      </div>

      {/* School Selection */}
      {name && name !== "Super Admin" && (
        <div>
          <label className="block text-sm font-medium">School</label>
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className="mt-1 block w-full border px-2 py-1 rounded"
            required
          >
            <option value="">Select School</option>
            {schools.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label className="text-sm">Is Active</label>
      </div>

      {/* Permissions */}
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

      {/* Add & Submit */}
      <div className="flex justify-between items-center gap-4">
        {name !== "School Admin" && (
          <button
            type="button"
            onClick={addPermission}
            className="text-blue-500 text-sm"
          >
            + Add Permission
          </button>
        )}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
          Create Role
        </button>
      </div>
    </form>
  );
};

export default AddRoleForm;
