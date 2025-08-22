import React, { useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch } from "react-redux";
import { bulkCreateQuestions } from "../features/questions/questionSlice";

const BulkUploadQuestions = () => {
  // Removed unused 'file' state
  const [preview, setPreview] = useState([]);
  const dispatch = useDispatch();

  // Parse Excel file
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // Removed setFile(selectedFile) as 'file' state is not used

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setPreview(jsonData); // preview before upload
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  // Upload to backend
 const handleUpload = () => {
  if (preview.length === 0) {
    alert("Please select a valid Excel file!");
    return;
  }

  // ✅ wrap with "questions"
  dispatch(bulkCreateQuestions({ questions: preview }));
};

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg">
      <h2 className="text-xl font-bold mb-4">Bulk Upload Questions</h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="mb-4"
      />

      {preview.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium">Preview (first 5 rows)</h3>
          <pre className="bg-gray-100 p-2 rounded text-sm max-h-40 overflow-auto">
            {JSON.stringify(preview.slice(0, 5), null, 2)}
          </pre>
        </div>
      )}

      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>
    </div>
  );
};

export default BulkUploadQuestions;
