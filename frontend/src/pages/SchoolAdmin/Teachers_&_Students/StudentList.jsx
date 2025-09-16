import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import { fetchAllStudent } from "../../../features/studentSlice";
import { User, Download, SquarePen, Trash, X } from "lucide-react";
import AdmissionForm from "../../../components/forms/AdmissionForm";
import { fetchClassSections } from "../../../features/classSectionSlice";
import { activeUser } from "../../../features/authSlice";

const StudentList = () => {
  const dispatch = useDispatch();
  const { studentList } = useSelector((state) => state.students);

  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);

  const [searchText, setSearchText] = useState(""); // 🔹 track search text

  const schoolId = user?.school?._id;

  useEffect(() => {
    dispatch(fetchAllStudent());
    if (schoolId) {
      dispatch(fetchClassSections({ schoolId })); // ✅ pass as object
    }
    dispatch(activeUser());
  }, [dispatch, schoolId, isOpen]);
  console.log("studentList", studentList);
  // ✅ format data
  const formattedStudents = Array.isArray(studentList)
    ? studentList.map((stu) => ({
      id: stu._id,
      name: stu.userDetails?.name ?? "N/A",
      class: stu.classDetails?.name ?? "N/A",
      section: stu.sectionDetails?.name ?? "N/A",
      dateOfBirth: stu.studentInfo?.dateOfBirth
        ? new Date(stu.studentInfo?.dateOfBirth).toISOString().split("T")[0]
        : "N/A",
      mobileNumber: stu.mobileNumber ?? "N/A",
      admissionDate: stu.admissionDate
        ? new Date(stu.admissionDate).toISOString().split("T")[0]
        : "N/A",
      bloodGroup: stu.studentInfo?.bloodGroup ?? "N/A",
      attendance: stu.attendance ?? "Not Marked",
    }))
    : [];

  // 🔹 Filter students by selected class and search text
  const filteredStudents = formattedStudents.filter((stu) => {

    const matchesSearch = searchText
      ? stu.name.toLowerCase().includes(searchText.toLowerCase())
      : true;

    return matchesSearch;
  });
  // ✅ columns
  const columns = [
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2">
          <img
            src={`https://ui-avatars.com/api/?name=${row.name}&background=random`}
            alt={row.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    { name: "Class", selector: (row) => row.class },
    { name: "Section", selector: (row) => row.section },
    { name: "Date of Birth", selector: (row) => row.dateOfBirth },
    { name: "Attendance", selector: (row) => row.attendance },
    { name: "Phone Number", selector: (row) => row.mobileNumber },
    { name: "Date of Joined", selector: (row) => row.admissionDate },
    { name: "Blood Group", selector: (row) => row.bloodGroup },
  ];

  return (
    <>
      {/* ✅ Popup Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <AdmissionForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      )}

      {/* ✅ Main Card */}
      <div className="p-4 border rounded-md bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="font-bold text-xl">Students Details</h2>
          <div className="flex gap-2">
            {/* 🔹 Search filter */}
            <input
              type="text"
              placeholder="Search your Student"
              className="border px-2 py-1 rounded-md text-xs"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            <button className="px-2 py-1 bg-gray-200 rounded-md text-xs text-black flex items-center gap-1">
              <Download className="w-4" /> Export
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="px-2 py-1 bg-blue-600 rounded-md text-xs text-white flex items-center gap-1"
            >
              <User className="w-4" /> Add Student
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={filteredStudents} // 🔹 use filtered data
            pagination
            highlightOnHover
            striped
            responsive
            className="border rounded-lg"
          />
        </div>
      </div>
    </>
  );
};

export default StudentList;
