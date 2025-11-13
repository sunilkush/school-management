import React, { useState, useEffect } from "react";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import { fetchAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";
import * as XLSX from "xlsx";

const SubjectsAdmin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const { subjectList=[], loading } = useSelector((state) => state.subject);

  // ✅ Get logged-in user info
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const role = storedUser?.role || "";

  // ✅ Fetch subjects once when mounted
  useEffect(() => {
    if (schoolId || role === "Super Admin") {
      dispatch(fetchAllSubjects({ schoolId }));
    }
  }, [dispatch, schoolId, role]);

  // ✅ Role-based filtering
 const filteredSubjects =
  role === "Super Admin"
    ? subjectList
    : subjectList.filter(
        (subj) =>
          subj.isGlobal === true ||
          String(subj.schoolId?._id || subj.schoolId) === String(schoolId)
      );

  // ✅ Local search filter
  const searchedSubjects = filteredSubjects.filter((subj) =>
    subj.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ✅ Edit handler
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  // ✅ Delete handler
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      try {
        await dispatch(deleteSubject(id)).unwrap();
        dispatch(fetchAllSubjects({ schoolId }));
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  // ✅ Export to Excel
  const handleExport = () => {
    const exportData = filteredSubjects.map((s) => ({
      "Subject Name": s.name,
      Category: s.category || "—",
      Type: s.type || "—",
      "Max Marks": s.maxMarks ?? "—",
      "Pass Marks": s.passMarks ?? "—",
      Teacher: s.teacherId?.name || "Not Assigned",
      School: s.schoolId?.name || (s.isGlobal ? "🌐 Global" : "—"),
      Status: s.isActive ? "Active" : "Inactive",
      "Created Type": s.isGlobal ? "Global" : "School",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subjects");
    XLSX.writeFile(wb, "Subjects_List.xlsx");
  };

  // ✅ Table columns
  const columns = [
    { name: "Subject Name", selector: (row) => row.name || "—", sortable: true, wrap: true },
    { name: "Category", selector: (row) => row.category || "—", sortable: true, width: "140px" },
    { name: "Type", selector: (row) => row.type || "—", sortable: true, width: "120px" },
    {
      name: "Max Marks",
      selector: (row) => row.maxMarks ?? "—",
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "Pass Marks",
      selector: (row) => row.passMarks ?? "—",
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "Teacher",
      selector: (row) => row.teacherId?.name || "Not Assigned",
      sortable: true,
      width: "180px",
      wrap: true,
    },
    {
      name: "School",
      selector: (row) => row.schoolId?.name || (row.isGlobal ? "🌐 Global" : "—"),
      sortable: true,
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            row.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
      width: "120px",
      center: true,
    },
    {
      name: "Created Type",
      selector: (row) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            row.isGlobal ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.isGlobal ? "Global 🌐" : "School 🏫"}
        </span>
      ),
      width: "130px",
      center: true,
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:underline text-sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:underline text-sm"
            onClick={() => handleDelete(row._id)}
          >
            Delete
          </button>
        </div>
      ),
      width: "140px",
      center: true,
    },
  ];

  return (
    <>
      {/* ✅ Modal form for Add/Edit */}
      <SubjectForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
        }}
        editData={selectedSubject}
      />

      {/* ✅ Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Subjects List</h2>
          <p className="text-sm text-gray-500">
            Manage subjects for your school or global context.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-0">
          <input
            type="text"
            placeholder="Search subject..."
            className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            onClick={handleExport}
            className="bg-green-600 text-white px-3 py-2 text-sm rounded-lg hover:bg-green-700"
          >
            📥 Export Excel
          </button>
          <button
            onClick={() => {
              setSelectedSubject(null);
              setIsModalOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-blue-700"
          >
            + Add New Subject
          </button>
        </div>
      </div>

      {/* ✅ Table */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <DataTable
          keyField="_id"
          columns={columns}
          data={searchedSubjects}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          dense
          responsive
          persistTableHead
          noDataComponent={<div className="py-4 text-gray-500">No subjects found</div>}
        />
      </div>
    </>
  );
};

export default SubjectsAdmin;
