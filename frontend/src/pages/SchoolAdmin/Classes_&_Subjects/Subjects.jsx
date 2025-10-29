import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import SubjectForm from "../../../components/forms/SubjectForm.jsx";
import {
  fetchAllSubjects,
  deleteSubject,
} from "../../../features/subjectSlice.js";

const Subjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const dispatch = useDispatch();
  const { subjectList, loading } = useSelector((state) => state.subject);

  // ✅ User from localStorage
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const role = storedUser?.role || "";

  // ✅ Fetch all subjects
  useEffect(() => {
    dispatch(fetchAllSubjects({ schoolId }));
  }, [dispatch, schoolId]);

  // ✅ Filter based on role
  const filteredSubjects =
    role === "Super Admin"
      ? subjectList
      : subjectList.filter(
          (subj) =>
            subj.isGlobal === true ||
            String(subj.schoolId?._id || subj.schoolId) === String(schoolId)
        );

  // ✅ Edit & Delete Handlers
  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this subject?")) {
      await dispatch(deleteSubject(id));
      dispatch(fetchAllSubjects({ schoolId }));
    }
  };

  // ✅ DataTable Columns
  const columns = [
    {
      name: "Subject",
      selector: (row) => row.name || "—",
      sortable: true,
      wrap: true,
      grow: 2,
    },
    {
      name: "Category",
      selector: (row) => row.category || "—",
      sortable: true,
      hide: "sm", // hides on small devices
    },
    {
      name: "Type",
      selector: (row) => row.type || "—",
      sortable: true,
      hide: "md", // hides on medium and below
    },
    {
      name: "Max Marks",
      selector: (row) => row.maxMarks ?? "—",
      sortable: true,
      center: true,
      hide: "sm",
    },
    {
      name: "Pass Marks",
      selector: (row) => row.passMarks ?? "—",
      sortable: true,
      center: true,
      hide: "sm",
    },
    {
      name: "School / Scope",
      selector: (row) =>
        row.schoolId?.name || (row.isGlobal ? "🌐 Global" : "—"),
      sortable: true,
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (row.isActive ? "🟢 Active" : "🔴 Inactive"),
      center: true,
      hide: "md",
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex gap-1 sm:gap-2 justify-center">
          <button
            className="text-blue-600 hover:underline text-xs sm:text-sm"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:underline text-xs sm:text-sm"
            onClick={() => handleDelete(row._id)}
          >
            Delete
          </button>
        </div>
      ),
      center: true,
      minWidth: "120px",
    },
  ];

  return (
    <>
      {/* ✅ Modal */}
      <SubjectForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSubject(null);
          dispatch(fetchAllSubjects({ schoolId }));
        }}
        editData={selectedSubject}
      />

      {/* ✅ Header */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            Subjects List
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Manage subjects for your school or global context.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedSubject(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 text-white px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition"
        >
          + Add New Subject
        </button>
      </div>

      {/* ✅ Responsive Table Wrapper */}
      <div className="bg-white p-2 sm:p-4 rounded-lg shadow-md overflow-x-auto">
        <div className="min-w-[600px] sm:min-w-full">
          <DataTable
            columns={columns}
            data={filteredSubjects || []}
            progressPending={loading}
            pagination
            highlightOnHover
            striped
            dense
            responsive
            persistTableHead
            customStyles={{
              table: {
                style: { minWidth: "100%" },
              },
              headCells: {
                style: {
                  fontWeight: "600",
                  fontSize: "0.8rem",
                  padding: "8px",
                },
              },
              cells: {
                style: {
                  fontSize: "0.75rem",
                  padding: "6px",
                  whiteSpace: "normal",
                },
              },
            }}
          />
        </div>
      </div>
    </>
  );
};

export default Subjects;
