import { useState } from "react";

const ManageSchools = () => {
  const [schools, setSchools] = useState([
    { id: 1, name: "Green Valley High", city: "Delhi", contact: "9999988888" },
    { id: 2, name: "Sunrise Public School", city: "Mumbai", contact: "8888877777" },
    { id: 3, name: "Modern Academy", city: "Kolkata", contact: "7777766666" },
  ]);

  const handleEdit = (id) => {
    alert(`Edit school with ID: ${id}`);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this school?")) {
      setSchools(schools.filter((school) => school.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 w-full">
        <h2 className="text-2xl font-bold">🏫 Manage Schools</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          ➕ Add New School
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 text-gray-700 text-left">
            <tr>
              <th className="px-6 py-3">School Name</th>
              <th className="px-6 py-3">City</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {schools.map((school) => (
              <tr key={school.id}>
                <td className="px-6 py-4">{school.name}</td>
                <td className="px-6 py-4">{school.city}</td>
                <td className="px-6 py-4">{school.contact}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => handleEdit(school.id)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(school.id)}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {schools.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No schools found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageSchools;
