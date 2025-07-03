import React, { useEffect, useState } from "react";
import axios from "axios";
import { fetchSchools } from "../features/schools/schoolSlice";
import { useDispatch,useSelector } from "react-redux";

const Report = () => {
 
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("All");
   const { schools } = useSelector((state) => state.school);
  const  dispatch = useDispatch();
  // Fetch all schools on mount 
    useEffect(()=>{
       dispatch(fetchSchools());
    },[dispatch])
  // Apply filter when inputs change
  useEffect(() => {
    const filtered = schools.filter((item) => {
      const created = new Date(item.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const matchesDate =
        (!start || created >= start) && (!end || created <= end);
      const matchesStatus =
        status === "All" || item.status?.toLowerCase() === status.toLowerCase();

      return matchesDate && matchesStatus;
    });

    setFilteredData(filtered);
  }, [startDate, endDate, status, schools]);

  const exportCSV = () => {
    const headers = ["Name", "Status", "Created At"];
    const rows = filteredData.map((item) => [
      item.name,
      item.status || "N/A",
      new Date(item.createdAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "school_report.csv";
    link.click();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Super Admin Report - Schools</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <button
          onClick={exportCSV}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-sm font-medium"
        >
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow border rounded">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{item.name}</td>
                  <td className="px-4 py-2">
                    {item.status || "N/A"}
                  </td>
                  <td className="px-4 py-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
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

export default Report;
