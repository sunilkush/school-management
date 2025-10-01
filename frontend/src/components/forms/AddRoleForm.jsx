import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createRole } from "../../features/roleSlice";
import { fetchSchools } from "../../features/schoolSlice";
import { Select, Checkbox, Button, Input } from "antd";

const { Option } = Select;

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
      <h2 className="text-lg font-semibold">Create Role</h2>

      {loading && <p className="text-blue-500">Creating role...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {message && <p className="text-green-500">{message}</p>}

      {/* Role Name */}
      <div>
        <label className="block text-xs font-medium">Role Name</label>
        <Select
          value={name || undefined}
          onChange={handleRoleChange}
          placeholder="Select Role"
          className="w-full"
        >
          {roleOptions.map((role) => (
            <Option key={role} value={role}>{role}</Option>
          ))}
        </Select>
      </div>

      {/* Code */}
      <div>
        <label className="block text-xs font-medium">Code</label>
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. SA, TEACH, ADMIN"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-medium">Description</label>
        <Input.TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter role description"
          rows={3}
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-xs font-medium">Type</label>
        <Select
          value={type}
          onChange={(value) => setType(value)}
          className="w-full"
        >
          <Option value="system">System</Option>
          <Option value="custom">Custom</Option>
        </Select>
      </div>

      {/* Level */}
      <div>
        <label className="block text-xs font-medium">Level (Hierarchy)</label>
        <Input
          type="number"
          value={level}
          min={1}
          onChange={(e) => setLevel(Number(e.target.value))}
        />
      </div>

      {/* School Selection */}
      {name && name !== "Super Admin" && (
        <div>
          <label className="block text-xs font-medium">School</label>
          <Select
            value={schoolId || undefined}
            onChange={(value) => setSchoolId(value)}
            placeholder="Select School"
            className="w-full"
          >
            {schools.map((s) => (
              <Option key={s._id} value={s._id}>{s.name}</Option>
            ))}
          </Select>
        </div>
      )}

      {/* Active Status */}
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        >
          Is Active
        </Checkbox>
      </div>

      {/* Permissions */}
      {permissions.map((perm, index) => (
        <div key={index} className="border p-4 rounded mb-2">
          <div className="flex justify-between items-center mb-2">
            <label className="block font-medium text-xs">Module</label>
            <Button type="link" danger size="small" onClick={() => removePermission(index)}>
              Remove
            </Button>
          </div>
          <Select
            value={perm.module || undefined}
            onChange={(value) => handleModuleChange(index, value)}
            placeholder="Select Module"
            className="w-full mb-2"
          >
            {moduleOptions.map((m) => <Option key={m} value={m}>{m}</Option>)}
          </Select>
          <div className="flex flex-wrap gap-2">
            {actionOptions.map((action) => (
              <Checkbox
                key={action}
                checked={perm.actions.includes(action)}
                onChange={() => handleActionChange(index, action)}
              >
                {action}
              </Checkbox>
            ))}
          </div>
        </div>
      ))}

      {/* Add & Submit */}
      <div className="flex justify-between items-center gap-4">
        {name !== "School Admin" && (
          <Button type="dashed" onClick={addPermission}>
            + Add Permission
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={loading}>
          Create Role
        </Button>
      </div>
    </form>
  );
};

export default AddRoleForm;
