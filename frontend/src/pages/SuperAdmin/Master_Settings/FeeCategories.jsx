import React from "react";
import { CreditCard } from "lucide-react";

const FeeCategories = () => {
  const feeCategories = [
    { id: 1, name: "Tuition Fee", type: "Monthly", status: "Active" },
    { id: 2, name: "Library Fee", type: "Annual", status: "Active" },
    { id: 3, name: "Sports Fee", type: "Annual", status: "Inactive" },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <CreditCard /> Fee Categories
      </h1>

      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        ➕ Add Fee Category
      </button>

      <table className="min-w-full border mt-4 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Category Name</th>
            <th className="p-3">Type</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {feeCategories.map((f, index) => (
            <tr key={f.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{f.name}</td>
              <td className="p-3">{f.type}</td>
              <td className="p-3">{f.status}</td>
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

export default FeeCategories;
