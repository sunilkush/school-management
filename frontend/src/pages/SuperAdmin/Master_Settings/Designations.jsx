import React from "react";
import { UserCog } from "lucide-react";

const Designations = () => {
  const designations = [
    { id: 1, name: "Principal", level: "Senior", status: "Active" },
    { id: 2, name: "Teacher", level: "Mid", status: "Active" },
    { id: 3, name: "Accountant", level: "Junior", status: "Inactive" },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <UserCog /> Designations
      </h1>

      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        ➕ Add Designation
      </button>

      <table className="min-w-full border mt-4 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Designation</th>
            <th className="p-3">Level</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {designations.map((d, index) => (
            <tr key={d.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{d.name}</td>
              <td className="p-3">{d.level}</td>
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

export default Designations;
