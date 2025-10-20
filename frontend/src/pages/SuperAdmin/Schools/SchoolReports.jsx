import React from "react";

// Sample data
const schoolReports = [
  { id: 1, name: "ABC Public School", students: 500, teachers: 35, status: "Active" },
  { id: 2, name: "XYZ International", students: 300, teachers: 20, status: "Active" },
  { id: 3, name: "Sunrise Academy", students: 450, teachers: 28, status: "Inactive" },
];

const SchoolReports = () => {
  return (
    <div className="bg-white">
      <h1 className="text-2xl font-bold mb-4">School Reports</h1>
      <table className="min-w-full border rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">#</th>
            <th className="px-4 py-2 border">School Name</th>
            <th className="px-4 py-2 border">Students</th>
            <th className="px-4 py-2 border">Teachers</th>
            <th className="px-4 py-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {schoolReports.map((school) => (
            <tr key={school.id} className="text-center hover:bg-gray-50">
              <td className="px-4 py-2 border">{school.id}</td>
              <td className="px-4 py-2 border">{school.name}</td>
              <td className="px-4 py-2 border">{school.students}</td>
              <td className="px-4 py-2 border">{school.teachers}</td>
              <td className="px-4 py-2 border">{school.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SchoolReports;
