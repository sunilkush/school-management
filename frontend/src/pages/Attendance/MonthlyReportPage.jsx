import React, { useMemo, useState } from "react";
import { Button, Card, DatePicker, Input, Table } from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMonthlyReport } from "../../features/attendanceSlice";

const MonthlyReportPage = () => {
  const dispatch = useDispatch();
  const { monthlyReport, reportLoading } = useSelector((state) => state.attendance);

  const [schoolId, setSchoolId] = useState("");
  const [monthDate, setMonthDate] = useState(dayjs());

  const summary = useMemo(() => {
    if (!monthlyReport.length) return 0;
    return (
      monthlyReport.reduce((acc, row) => acc + (row.attendancePercentage || 0), 0) / monthlyReport.length
    ).toFixed(2);
  }, [monthlyReport]);

  return (
    <Card title={`Monthly Report (Avg ${summary}%)`}>
      <Input
        style={{ width: 280, marginRight: 8 }}
        value={schoolId}
        placeholder="School ID"
        onChange={(e) => setSchoolId(e.target.value)}
      />
      <DatePicker picker="month" value={monthDate} onChange={setMonthDate} />
      <Button
        type="primary"
        style={{ marginLeft: 8 }}
        onClick={() =>
          dispatch(
            fetchMonthlyReport({
              schoolId,
              month: monthDate.month() + 1,
              year: monthDate.year(),
            })
          )
        }
      >
        Generate
      </Button>
      <Table
        rowKey="userId"
        loading={reportLoading}
        style={{ marginTop: 16 }}
        dataSource={monthlyReport}
        columns={[
          { title: "Name", dataIndex: "name" },
          { title: "Email", dataIndex: "email" },
          { title: "Present Days", dataIndex: "presentDays" },
          { title: "Total Days", dataIndex: "totalDays" },
          { title: "Attendance %", dataIndex: "attendancePercentage" },
        ]}
      />
    </Card>
  );
};

export default MonthlyReportPage;
