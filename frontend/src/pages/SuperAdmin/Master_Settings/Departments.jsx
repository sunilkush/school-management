import React from "react";
import { Building2 } from "lucide-react";

const Departments = () => {
  const departments = [
    { id: 1, name: "Science", head: "Mr. Sharma", status: "Active" },
    { id: 2, name: "Mathematics", head: "Ms. Gupta", status: "Active" },
    { id: 3, name: "Commerce", head: "Mr. Singh", status: "Inactive" },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Building2 /> Departments
      </h1>

      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        ➕ Add Department
      </button>

      <table className="min-w-full border mt-4 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Department Name</th>
            <th className="p-3">Head</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((d, index) => (
            <tr key={d.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{d.name}</td>
              <td className="p-3">{d.head}</td>
              <td className="p-3">{d.status}</td>
              <td className="p-3 text-center">
                <button className="text-blue-600 hover:underline">Edit</button> |
                <button className="text-red-600 hover:underline"> Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Departments;
