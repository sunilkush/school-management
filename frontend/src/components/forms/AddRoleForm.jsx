import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createRole, fetchRoles } from './roleSlice';

const AddRoleForm = () => {
    const dispatch = useDispatch();
    const [name, setName] = useState('');
    const [schoolId, setSchoolId] = useState('');
    const [permissions, setPermissions] = useState([{ module: '', actions: [] }]);

    const moduleOptions = [
        "Schools", "Users", "Teachers", "Students", "Parents", "Classes", "Subjects",
        "Exams", "Attendance", "Finance", "Settings", "Fees", "Reports", "Hostel",
        "Transport", "Assignments", "Timetable", "Notifications", "Expenses", "Library",
        "Books", "IssuedBooks", "Rooms", "Routes", "Vehicles"
    ];

    const actionOptions = ["create", "read", "update", "delete"];

    const handlePermissionChange = (index, key, value) => {
        const updated = [...permissions];
        if (key === 'module') updated[index].module = value;
        else if (key === 'actions') {
            updated[index].actions = updated[index].actions.includes(value)
                ? updated[index].actions.filter(a => a !== value)
                : [...updated[index].actions, value];
        }
        setPermissions(updated);
    };

    const addPermission = () => setPermissions([...permissions, { module: '', actions: [] }]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(createRole({ name, schoolId, permissions }))
            .then(() => dispatch(fetchRoles()));
        setName('');
        setSchoolId('');
        setPermissions([{ module: '', actions: [] }]);
    };

    return (
        <div className="p-4 border rounded-lg shadow-md w-full max-w-xl">
            <h2 className="text-xl font-bold mb-4">Create Role</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block mb-1">Role Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" required />
                </div>
                <div>
                    <label className="block mb-1">School ID</label>
                    <input type="text" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="w-full border p-2 rounded" required />
                </div>

                <div>
                    <label className="block mb-2 font-semibold">Permissions</label>
                    {permissions.map((perm, index) => (
                        <div key={index} className="mb-4 border p-2 rounded">
                            <select
                                value={perm.module}
                                onChange={(e) => handlePermissionChange(index, 'module', e.target.value)}
                                className="w-full border p-2 rounded mb-2"
                                required
                            >
                                <option value="">Select Module</option>
                                {moduleOptions.map((mod) => (
                                    <option key={mod} value={mod}>{mod}</option>
                                ))}
                            </select>
                            <div className="flex gap-4 flex-wrap">
                                {actionOptions.map((action) => (
                                    <label key={action} className="flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            checked={perm.actions.includes(action)}
                                            onChange={() => handlePermissionChange(index, 'actions', action)}
                                        />
                                        {action}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button type="button" onClick={addPermission} className="bg-green-600 text-white px-3 py-1 rounded mt-2">Add Module</button>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Role</button>
            </form>
        </div>
    );
};

export default AddRoleForm;
