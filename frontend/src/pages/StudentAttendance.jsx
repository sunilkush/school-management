import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "react-data-table-component";
import { fetchAllStudent } from "../features/studentSlice";
import { activeUser } from "../features/authSlice";
import {markAttendance} from "../features/attendanceSlice";
const StudentAttendance = () => {
  const dispatch = useDispatch();
  const { studentList = [], loading } = useSelector((state) => state.students);
  const { user: currentUser } = useSelector((state) => state.auth);

  const schoolId = currentUser?.school?._id;

  const academicYearId = currentUser?.academicYear?._id
  // 🔹 Filters

  const [filterClass, setFilterClass] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // 🔹 Local state to track marked attendance
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllStudent({ schoolId }));
    }
    dispatch(activeUser());
  }, [dispatch, schoolId]);

  // 🔹 Update attendance state
  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
   
  };

  // 🔹 Columns
  const columns = [
    {
      name: "Student Name",
      selector: (row) => row.userDetails?.name || "N/A",
      sortable: true,
    },
    {
      name: "Class",
      selector: (row) => row.classDetails?.name || "N/A",
      sortable: true,
    },
    {
      name: "School",
      selector: (row) => row.school?.name || "N/A",
      sortable: true,
    },
    {
      name: "Date",
      selector: () => new Date().toLocaleDateString(), // today's date
      sortable: true,
    },
    {
      name: "Mark Attendance",
      cell: (row) => (
        <select
          value={attendance[row._id] || ""}
          onChange={(e) => handleAttendanceChange(row._id, e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">Select</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
    },
  ];

  // 🔹 Filtering logic
  const filteredRecords = studentList.filter((item) => {
    return (
    
      (filterClass ? item.classDetails?.name === filterClass : true) &&
      (filterStatus
        ? (attendance[item._id] || item.status) === filterStatus
        : true)
    );
  });

  // 🔹 Submit Attendance (can send to backend)
const handleSubmit = () => {
  const today = new Date();

  const attendanceData = studentList
    .filter((student) => attendance[student._id])
    .map((student) => ({
      schoolId: schoolId,
      studentId: student._id,
      classId: student.classDetails?._id,
      date: today.toISOString(),
      status: attendance[student._id] || "present",
      recordedBy: currentUser?._id,
      academicYearId:academicYearId  // 🔹 don’t forget this if required in schema
    }));

  console.log("Attendance Payload:", attendanceData);

  // ✅ Correct way to call thunk
  dispatch(markAttendance({ attendanceData }));
};


  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>

      {/* 🔹 Filters */}
      <div className="flex gap-4 mb-4 justify-between">
        <div className="grid gap-3 grid-cols-2">

        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="border p-2 rounded text-xs"
        >
          <option value="">All Classes</option>
          {[...new Set(studentList.map((r) => r.classDetails?.name))].map(
            (cls) =>
              cls && (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              )
          )}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border p-2 rounded text-xs"
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
        </select>
        </div>
         {/* 🔹 Save Button */}
      <div className="">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-xs"
        >
          Save Attendance
        </button>
      </div>
      </div>

      {/* 🔹 DataTable */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        progressPending={loading}
        pagination
        highlightOnHover
        striped
      />

     
    </div>
  );
};

export default StudentAttendance;
