import React from "react";
import { Calendar, Badge } from "antd";
import "antd/dist/reset.css";

// Example attendance data
const attendanceData = {
  "2025-09-01": "Present",
  "2025-09-02": "Absent",
  "2025-09-03": "Leave",
  "2025-09-04": "Present",
  "2025-09-05": "Present",
  "2025-09-06": "Absent",
};

// Map status to badge color
const getBadgeStatus = (status) => {
  switch (status) {
    case "Present":
      return "success";
    case "Absent":
      return "error";
    case "Leave":
      return "warning";
    default:
      return "default";
  }
};

// Map status to text
const getBadgeText = (status) => status || "No Data";

const AttendanceCalendar = () => {
  const dateCellRender = (value) => {
    const dateStr = value.format("YYYY-MM-DD");
    const status = attendanceData[dateStr];

    return (
      <ul className="events">
        <li>
          <Badge status={getBadgeStatus(status)} text={getBadgeText(status)} />
        </li>
      </ul>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Daily Attendance</h3>
      <Calendar dateCellRender={dateCellRender} />
    </div>
  );
};

export default AttendanceCalendar;
