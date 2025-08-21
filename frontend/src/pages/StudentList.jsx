import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import DataTable from "react-data-table-component"
import { fetchAllStudent } from "../features/students/studentSlice"
import { User, Download, SquarePen, Trash, X } from "lucide-react"
import AdmissionForm from "../components/forms/AdmissionForm"

const StudentList = () => {
  const dispatch = useDispatch()
  const { students } = useSelector((state) => state.students)
  const [isOpen, setIsOpen] = useState(false) // ✅ modal state

  useEffect(() => {
    dispatch(fetchAllStudent())
  }, [dispatch])

  // ✅ transform nested data
  const formattedStudents = Array.isArray(students)
    ? students.map((stu) => ({
        id: stu._id,
        registrationNumber: stu.registrationNumber,
        name: stu.userDetails?.name || "N/A",
        email: stu.userDetails?.email || "N/A",
        admissionDate: stu.admissionDate?.split("T")[0] || "N/A",
        fatherName: stu.fatherInfo?.name || "N/A",
        motherName: stu.motherInfo?.name || "N/A",
        className: `${stu.classDetails?.name || "N/A"} - ${
          stu.classDetails?.section || ""
        }`,
        status: stu.status,
      }))
    : []

  const columns = [
    { name: "Reg. No", selector: (row) => row.registrationNumber, sortable: true },
    { name: "Name", selector: (row) => row.name, sortable: true },
    { name: "Email", selector: (row) => row.email },
    { name: "Class", selector: (row) => row.className, sortable: true },
    { name: "Admission Date", selector: (row) => row.admissionDate },
    { name: "Father", selector: (row) => row.fatherName },
    { name: "Mother", selector: (row) => row.motherName },
    { name: "Status", selector: (row) => row.status },
    {
      name: "Action",
      cell: (row) => (
        <div className="grid gap-2 grid-cols-2">
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded"
            onClick={() => alert(`Edit ${row.name}`)}
          >
            <SquarePen className="inline-flex w-4" />
          </button>
          <button
            className="px-2 py-1 bg-red-500 text-white rounded"
            onClick={() => alert(`Delete ${row.name}`)}
          >
            <Trash className="inline-flex w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      {/* ✅ Popup Modal for AdmissionForm */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl relative">
            {/* Close button */}
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Admission form inside modal */}
            <div className="">
           
              <AdmissionForm onClose={() => setIsOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-3 border rounded-md bg-white">
        <div className="grid grid-cols-2 gap-3 py-">
          <div className="flex items-center">
            <h2 className="font-bold text-xl">Student List</h2>
          </div>
          <div className="flex gap-2 justify-end">
            <button className="px-3 py-2 bg-gray-200 rounded-md text-sm text-black ">
              <Download className="inline-flex w-4" /> Export
            </button>
            <button
              onClick={() => setIsOpen(true)} // ✅ open modal
              className="px-3 py-2 bg-blue-600 rounded-md text-sm text-white "
            >
              <User className="inline-flex w-4" /> Add Student
            </button>
          </div>
        </div>
        <div className="py-3">
          <DataTable
            columns={columns}
            data={formattedStudents}
            pagination={true}
            highlightOnHover
            striped
            responsive
            className="border rounded-lg"
          />
        </div>
      </div>
    </>
  )
}

export default StudentList
