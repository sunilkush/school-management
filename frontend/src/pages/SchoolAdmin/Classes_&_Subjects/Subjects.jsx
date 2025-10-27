import SubjectForm from "../../../components/forms/SubjectFrom.jsx";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import { fetchAllSubjects, deleteSubject } from "../../../features/subjectSlice.js";

const Subjects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const dispatch = useDispatch();
  const { subjectList, loading } = useSelector((state) => state.subject);

  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";
  const role = storedUser?.role || "";

  // ✅ Fetch all subjects once
  useEffect(() => {
    if (schoolId || role === "Super Admin") {
      dispatch(fetchAllSubjects({schoolId}));
    }
  }, [dispatch, schoolId, isModalOpen]);
  console.log("Subjects List:", subjectList);
  // ✅ Filter based on role
  const filteredSubjects =
    role === "super-admin"
      ? subjectList
      : subjectList.filter(
          (subj) =>
            subj.isGlobal === true ||
            String(subj.schoolId?._id || subj.schoolId) === String(schoolId)
        );

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

  // ✅ Columns aligned with latest schema
  const columns = [
    {
      name: "Subject Name",
      selector: (row) => row.name || "—",
      sortable: true,
      wrap: true,
    },
    {
      name: "Category",
      selector: (row) => row.category || "—",
      sortable: true,
      width: "140px",
    },
    {
      name: "Type",
      selector: (row) => row.type || "—",
      sortable: true,
      width: "120px",
    },
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
      selector: (row) => row.teacherId?.name || "—",
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
      selector: (row) => (row.isActive ? "🟢 Active" : "🔴 Inactive"),
      sortable: true,
      width: "120px",
      center: true,
    },
    {
      name: "Created Type",
      selector: (row) => (row.isGlobal ? "Global" : "School"),
      sortable: true,
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
      {/* ✅ Modal Form */}
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
        <div className="mt-3 md:mt-0">
          <button
            type="button"
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
          columns={columns}
          data={filteredSubjects}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          dense
          responsive
          persistTableHead
        />
      </div>
    </>
  );
};

export default Subjects;
