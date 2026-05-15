import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Select,
  Button,
  Typography,
  Radio,
  Tag,
  Space,
  DatePicker,
  TimePicker,
  message,
  Input,
  Statistic,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../../features/authSlice";
import { submitAttendance } from "../../../features/attendanceSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const StaffAttendance = () => {
  const dispatch = useDispatch();
  const { users = [], user: currentUser } = useSelector(
    (state) => state.auth || {}
  );

  const schoolId = currentUser?.school?._id;

  const [attendance, setAttendance] = useState({});
  const [timings, setTimings] = useState({});
  const [filterDept, setFilterDept] = useState();
  const [filterRole, setFilterRole] = useState();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    if (!schoolId) return;

    dispatch(
      fetchAllUser({
        schoolId,
        roleName: ["Teacher", "Staff", "Super Admin"],
        isActive: true,
      })
    );
  }, [schoolId,dispatch]);

  /* ---------------- HELPERS ---------------- */
  const getRole = (u) =>
    u?.role?.name || u?.roleId?.name || u?.role?.title || "";

  const filteredStaff = useMemo(() => {
    const q = searchText.toLowerCase();
    const excluded = ["Student", "Parent"];

    return users.filter((u) => {
      const role = getRole(u);
      if (excluded.includes(role)) return false;

      const name = (u.name || u.fullName || "").toLowerCase();
      const emp = `${u.employeeId || ""}`.toLowerCase();

      return (
        (!filterDept || u.department === filterDept) &&
        (!filterRole || role === filterRole) &&
        (!q || name.includes(q) || emp.includes(q))
      );
    });
  }, [users, filterDept, filterRole, searchText]);

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    const s = { present: 0, absent: 0, leave: 0, marked: 0 };

    Object.values(attendance).forEach((v) => {
      if (!v) return;
      s[v]++;
      s.marked++;
    });

    return { ...s, total: filteredStaff.length };
  }, [attendance, filteredStaff]);

  /* ---------------- ACTIONS ---------------- */
  const handleChange = (id, value) => {
    setAttendance((p) => ({ ...p, [id]: value }));
    if (value !== "present") {
      setTimings((p) => ({ ...p, [id]: {} }));
    }
  };

  const markAllPresent = () => {
    const updated = {};
    filteredStaff.forEach((s) => (updated[s._id] = "present"));
    setAttendance((p) => ({ ...p, ...updated }));
  };

  const resetAll = () => {
    setAttendance({});
    setTimings({});
  };

  const handleSubmit = async () => {
    if (!schoolId) return message.error("School not found");

    const records = Object.entries(attendance).map(([userId, status]) => ({
      userId,
      status,
    }));

    if (!records.length) return message.warning("Mark attendance first");

    try {
      await dispatch(
        submitAttendance({
          schoolId,
          date: selectedDate.toISOString(),
          role: "staff",
          records,
        })
      ).unwrap();

      message.success("Attendance saved");
    } catch (e) {
      message.error("Failed to save attendance",e);
    }
  };

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      title: "Staff",
      render: (_, r) => (
        <div className="flex flex-col">
          <span className="font-medium">{r?.name || r?.fullName}</span>
          <span className="text-xs text-gray-500">
            {r?.employeeId || "ID N/A"}
          </span>
        </div>
      ),
    },
    {
      title: "Role",
      render: (_, r) => getRole(r) || "—",
    },
    {
      title: "Attendance",
      render: (_, r) => (
        <Radio.Group
          value={attendance[r._id]}
          onChange={(e) => handleChange(r._id, e.target.value)}
          buttonStyle="solid"
          size="small"
        >
          <Radio.Button value="present">P</Radio.Button>
          <Radio.Button value="absent">A</Radio.Button>
          <Radio.Button value="leave">L</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      title: "Time",
      render: (_, r) =>
        attendance[r._id] === "present" ? (
          <Space>
            <TimePicker
              size="small"
              format="HH:mm"
              onChange={(t) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], in: t },
                }))
              }
            />
            <TimePicker
              size="small"
              format="HH:mm"
              onChange={(t) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], out: t },
                }))
              }
            />
          </Space>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
  ];

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Staff Attendance
        </Title>
        <Text type="secondary">
          Quick attendance with role-based staff tracking
        </Text>
      </div>

      {/* FILTER BAR */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            className="w-full"
          />

          <Select
            placeholder="Department"
            allowClear
            onChange={setFilterDept}
          />

          <Select placeholder="Role" allowClear onChange={setFilterRole} />

          <Input
            placeholder="Search staff"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />

          <div className="flex gap-2 justify-end">
            <Button onClick={markAllPresent} icon={<CheckCircleOutlined />}>
              All Present
            </Button>
            <Button onClick={resetAll} icon={<ReloadOutlined />}>
              Reset
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>
              Save
            </Button>
          </div>
        </div>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card size="small">
          <Statistic title="Total" value={summary.total} />
        </Card>
        <Card size="small">
          <Statistic title="Marked" value={summary.marked} />
        </Card>
        <Card size="small">
          <Tag color="green">Present: {summary.present}</Tag>
        </Card>
        <Card size="small">
          <Tag color="red">Absent: {summary.absent}</Tag>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredStaff}
          pagination={{ pageSize: 8 }}
        />
      </Card>
    </div>
  );
};

export default StaffAttendance;