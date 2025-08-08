import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const mockStudents = [
  { id: 1, name: 'Amit Sharma' },
  { id: 2, name: 'Riya Verma' },
  { id: 3, name: 'Sunil Kushwaha' },
];

const AttendanceCalendar = () => {
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
  };

  const handleMarkAttendance = () => {
    if (!selectedStudent || !selectedStatus) return alert("Select student and status");

    let color;
    switch (selectedStatus) {
      case 'Present':
        color = '#B6E2A1'; break;
      case 'Absent':
        color = '#FF8787'; break;
      case 'Leave':
        color = '#CDC1FF'; break;
      default:
        color = '#ccc';
    }

    const student = mockStudents.find((s) => s.id === parseInt(selectedStudent));

    setAttendanceEvents([
      ...attendanceEvents,
      {
        title: `${student.name} - ${selectedStatus}`,
        date: selectedDate,
        color,
      },
    ]);

    // Clear form
    setSelectedStudent('');
    setSelectedStatus('');
    setSelectedDate('');
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold mb-4">Teacher Attendance Marking</h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        events={attendanceEvents}
        height="auto"
      />

      {selectedDate && (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">
          <h3 className="font-semibold mb-2">Mark Attendance for {selectedDate}</h3>
          <div className="flex gap-4 mb-2">
            <select
              className="border p-2 rounded"
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              <option value="">Select Student</option>
              {mockStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>

            <select
              className="border p-2 rounded"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">Select Status</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>

            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleMarkAttendance}
            >
              Mark
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceCalendar;
