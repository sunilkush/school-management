import React, { useEffect, useState } from 'react';

import { useSelector,useDispatch } from 'react-redux';
import { activeUser,fetchAllUser } from '../features/auth/authSlice'; // Adjust the import path as necessary
const statusColors = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  leave: 'bg-yellow-100 text-yellow-800',
};

const StudentAttendance = () => {
  //const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substr(0, 10));
  const dispatch = useDispatch();
  const {users} = useSelector((state) => state.auth);
  // Fetch students from backend
  useEffect(() => {
    dispatch(activeUser())
    dispatch(fetchAllUser())
  }, [dispatch]);
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const schoolId = userData?.school?._id;
  
  const students = users.filter(user => user.role.name === 'Student' &&  user.school._id === schoolId );
  // Handle attendance status change
  const handleChange = (studentId, status) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  // Submit attendance
  const handleSubmit = async () => {
    
  };

  return (
    <div className="p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Mark Attendance</h2>

      <div className="mb-4">
        <label className="mr-2 font-medium">Select Date:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border p-1 rounded"
        />
      </div>

      <table className="min-w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border">#</th>
            <th className="py-2 px-4 border text-left">Student Name</th>
            <th className="py-2 px-4 border text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={student._id || student.id}>
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">{student.name.toUpperCase()}</td>
            
              <td className="border px-4 py-2">
                <div className="flex gap-2">
                  {['present', 'absent', 'leave'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleChange(student._id || student.id, status)}
                      className={`px-3 py-1 text-sm rounded border ${
                        attendance[student._id || student.id] === status
                          ? statusColors[status]
                          : 'bg-white text-gray-600'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Submit Attendance
      </button>
    </div>
  );
};

export default StudentAttendance;
