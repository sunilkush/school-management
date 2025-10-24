import React from "react";
import { BookOpen } from "lucide-react";

const SubjectsAdmin = () => {
  const subjects = [
    { id: 1, name: "Mathematics", code: "MTH101", status: "Active" },
    { id: 2, name: "Science", code: "SCI102", status: "Active" },
    { id: 3, name: "History", code: "HIS103", status: "Inactive" },
  ];

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <BookOpen /> Subjects
      </h1>

      <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
        ➕ Add New Subject
      </button>

      <table className="min-w-full border mt-4 bg-white rounded-lg shadow-md">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Subject Name</th>
            <th className="p-3">Code</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s, index) => (
            <tr key={s.id} className="border-t hover:bg-gray-50">
              <td className="p-3">{index + 1}</td>
              <td className="p-3">{s.name}</td>
              <td className="p-3">{s.code}</td>
              <td className="p-3">{s.status}</td>
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

export default SubjectsAdmin;
