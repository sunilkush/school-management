import { useState } from "react";

const AddEditDeleteSchools = () => {
  const [schools, setSchools] = useState([
    { id: 1, name: "Green Valley School" },
    { id: 2, name: "Sunrise Public School" },
  ]);
  const [form, setForm] = useState({ name: "", id: null });
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, name: e.target.value });
  };

  const handleAdd = () => {
    if (!form.name.trim()) return;
    setSchools([...schools, { id: Date.now(), name: form.name }]);
    setForm({ name: "", id: null });
  };

  const handleEdit = (school) => {
    setIsEditing(true);
    setForm(school);
  };

  const handleUpdate = () => {
    setSchools(
      schools.map((s) => (s.id === form.id ? { ...s, name: form.name } : s))
    );
    setForm({ name: "", id: null });
    setIsEditing(false);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this school?")) {
      setSchools(schools.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🏫 Add / Edit / Delete Schools</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter school name"
          className="border p-2 w-full rounded"
        />
        {isEditing ? (
          <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded">
            Update
          </button>
        ) : (
          <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded">
            Add
          </button>
        )}
      </div>

      <table className="w-full table-auto border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-2 py-2">#</th>
            <th className="border px-2 py-2 text-left">School Name</th>
            <th className="border px-2 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {schools.map((school, index) => (
            <tr key={school.id}>
              <td className="border px-2 py-1 text-center">{index + 1}</td>
              <td className="border px-2 py-1">{school.name}</td>
              <td className="border px-2 py-1 text-center space-x-2">
                <button
                  onClick={() => handleEdit(school)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(school.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {schools.length === 0 && (
            <tr>
              <td colSpan={3} className="text-center py-4 text-gray-500">No schools available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AddEditDeleteSchools;
