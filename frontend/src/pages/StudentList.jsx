import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import { fetchAllStudent } from "../features/students/studentSlice";
import { User, Download, SquarePen, Trash, X } from "lucide-react";
import AdmissionForm from "../components/forms/AdmissionForm";

const StudentList = () => {
  const dispatch = useDispatch();
  const { studentList } = useSelector((state) => state.students);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchAllStudent());
  }, [dispatch]);

  // ✅ format data
  const formattedStudents = Array.isArray(studentList)
    ? studentList.map((stu) => ({
        id: stu._id,
        name: stu.userDetails?.name || "N/A",
        class: stu.classDetails?.name || "N/A",
        section: stu.classDetails?.section || "N/A",
        dob: stu.dob?.split("T")[0] || "N/A",
        phone: stu.userDetails?.phone || "N/A",
        admissionDate: stu.admissionDate?.split("T")[0] || "N/A",
        bloodGroup: stu.bloodGroup || "N/A",
        attendance: stu.attendance || "N/A",
      }))
    : [];

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
    { name: "Date of Birth", selector: (row) => row.dob },
    { name: "Attendance", selector: (row) => row.attendance },
    { name: "Phone Number", selector: (row) => row.phone },
    { name: "Date of Joined", selector: (row) => row.admissionDate },
    { name: "Blood Group", selector: (row) => row.bloodGroup },
    {
      name: "Action",
      cell: (row) => (
        <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md text-sm">
          See More Details
        </button>
      ),
    },
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
            <select className="border px-3 py-2 rounded-md text-sm">
              <option>Select Class</option>
              <option>4th Std</option>
              <option>5th Std</option>
              <option>7th Std</option>
              <option>8th Std</option>
              <option>9th Std</option>
              <option>10th Std</option>
            </select>
            <input
              type="text"
              placeholder="Search your Student"
              className="border px-3 py-2 rounded-md text-sm"
            />
            <button className="px-3 py-2 bg-gray-200 rounded-md text-sm text-black flex items-center gap-1">
              <Download className="w-4" /> Export
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="px-3 py-2 bg-blue-600 rounded-md text-sm text-white flex items-center gap-1"
            >
              <User className="w-4" /> Add Student
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={formattedStudents}
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
