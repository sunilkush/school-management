import SubjectForm from '../components/forms/SubjectFrom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataTable from 'react-data-table-component';
import { fetchAllSubjects, deleteSubject } from '../features/subject/subjectSlice';

const Subjects = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const dispatch = useDispatch();
  const { subjectList, loading } = useSelector((state) => state.subject);

  // Instant read from localStorage to avoid flash
  const storedUser = JSON.parse(localStorage.getItem("user")) || {};
  const schoolId = storedUser?.school?._id || "";

  // Filter subjects for this school
  const filteredSubjects = subjectList.filter((subj) => subj.schoolId === schoolId);

  // Fetch subjects only once
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllSubjects());
    }
  }, [dispatch, schoolId]);

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setIsOpen(true);
  };

  const handleDelete = (id) => {
    dispatch(deleteSubject(id)).then(() => {
      dispatch(fetchAllSubjects());
    });
  };

  const columns = [
    { name: 'Subject Name', selector: (row) => row.name, sortable: true },
    { name: 'School', selector: (row) => row.school?.name || 'N/A', sortable: true },
    { name: 'Teacher', selector: (row) => row.teacher?.name || 'N/A', sortable: true },
    {
      name: 'Actions',
      cell: (row) => (
        <>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => handleEdit(row)}
          >
            Edit
          </button>
          <button
            className="text-red-600 hover:underline ml-2"
            onClick={() => handleDelete(row._id)}
          >
            Delete
          </button>
        </>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold">Subjects List</h2>
          <p className="text-sm text-gray-500">Manage all subjects here.</p>
        </div>
        <div className="text-right">
          <button
            type="button"
            onClick={() => {
              setSelectedSubject(null);
              setIsOpen(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded shadow">
        <DataTable
          columns={columns}
          data={filteredSubjects}
          progressPending={loading}
          pagination
          highlightOnHover
          striped
          responsive
        />
      </div>

      {/* Modal */}
      {isOpen && (
        <SubjectForm
          editData={selectedSubject}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Subjects;
