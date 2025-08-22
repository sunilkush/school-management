import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReports, exportReportPDF } from "../features/examReport/examReportSlice";

const ExamReports = () => {
  const dispatch = useDispatch();
  const { reports, loading } = useSelector((s) => s.reports);

  useEffect(() => {
    dispatch(fetchReports());
  }, [dispatch]);

  const handleExport = (format) => {
    dispatch(exportReportPDF(format));
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📑 Reports</h2>
      {loading && <p>Loading...</p>}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Exam</th>
            <th className="p-2 border">Student</th>
            <th className="p-2 border">Score</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {reports?.map((r) => (
            <tr key={r._id}>
              <td className="p-2 border">{r.examTitle}</td>
              <td className="p-2 border">{r.studentName}</td>
              <td className="p-2 border">{r.score}</td>
              <td className="p-2 border">{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-x-2">
        <button
          onClick={() => handleExport("excel")}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Export Excel
        </button>
        <button
          onClick={() => handleExport("pdf")}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default ExamReports;
