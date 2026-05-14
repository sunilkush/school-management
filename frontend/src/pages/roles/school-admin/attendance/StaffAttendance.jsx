import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  Table,
  Row,
  Col,
  Select,
  Button,
  Typography,
  Radio,
  Tag,
  Space,
  DatePicker,
  TimePicker,
  Divider,
  message,
  Input,
  Statistic,
} from "antd";
import { SaveOutlined, ReloadOutlined, SearchOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../../../features/authSlice";
import { submitAttendance } from "../../../../features/attendanceSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;


const StaffAttendance = () => {
  const dispatch = useDispatch();
   const { users = [], user: currentUser } = useSelector((state) => state.auth || {});
 

  const [attendance, setAttendance] = useState({});
  const [timings, setTimings] = useState({});
  const [filterDept, setFilterDept] = useState();
  const [filterRole, setFilterRole] = useState();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const schoolId = currentUser?.school?._id;

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllUser({ schoolId, roleName: ["Teacher", "Staff", "Super Admin"], isActive: true }));
    }
  }, [dispatch, schoolId]);

  /* ------------------ HELPERS ------------------ */
  const getRoleName = (staff) =>
     staff?.role?.name || staff?.roleId?.name || staff?.role?.title || staff?.roleId?.title || "";

  const normalizeTimestamp = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return undefined;

    return dateValue.hour(timeValue.hour()).minute(timeValue.minute()).second(0).millisecond(0).toISOString();
  };

  /* ------------------ FILTER ------------------ */
  const departmentOptions = useMemo(() => {
    const values = users.map((u) => u.department).filter(Boolean);
    return [...new Set(values)].map((v) => ({ value: v, label: v }));
  }, [users]);

  const roleOptions = useMemo(() => {
    const values = users.map((u) => getRoleName(u)).filter(Boolean);
    return [...new Set(values)].map((v) => ({ value: v, label: v }));
  }, [users]);

  const filteredStaff = useMemo(() => {
    const excludedRoles = ["Student", "Parent"];
     const query = searchText.trim().toLowerCase();

    return users.filter((s) => {
      const roleName = getRoleName(s);
      if (excludedRoles.includes(roleName)) return false;
       const fullName = (s.name || s.fullName || "").toLowerCase();
      const employeeCode = `${s.employeeId || s.staffId || ""}`.toLowerCase();
      return (
         (!filterDept || s.department === filterDept) &&
        (!filterRole || roleName === filterRole) &&
        (!query || fullName.includes(query) || employeeCode.includes(query))
      );
    });
 }, [users, filterDept, filterRole, searchText]);
  const summary = useMemo(() => {
    const counts = { present: 0, absent: 0, leave: 0, marked: 0 };

    Object.values(attendance).forEach((status) => {
      if (!status) return;
      counts.marked += 1;
      counts[status] += 1;
    });

    return { ...counts, total: filteredStaff.length };
  }, [attendance, filteredStaff.length]);
  /* ------------------ ACTIONS ------------------ */
  const handleAttendanceChange = (id, status) => {
    setAttendance((p) => ({ ...p, [id]: status }));

    if (status !== "present") {
      setTimings((p) => ({ ...p, [id]: {} }));
    }
  };
  const markAllVisiblePresent = () => {
    const updates = {};
    filteredStaff.forEach((staff) => {
      updates[staff._id] = "present";
    });
    setAttendance((prev) => ({ ...prev, ...updates }));
  };
  const calculateHours = (inTime, outTime) => {
    if (!inTime || !outTime) return "—";
    const diff = outTime.diff(inTime, "minute");
    return diff > 0 ? `${(diff / 60).toFixed(2)} hrs` : "—";
  };

  /* ------------------ SUBMIT ------------------ */
  const handleSubmit = async () => {
    if (!selectedDate) {
      return message.warning("Please select date");
    }

    if (!schoolId) {
      return message.error("School not found");
    }

    const records = Object.entries(attendance)
      .filter(([, status]) => status)
      .map(([userId, status]) => ({
        userId,
        status,
        checkInAt: normalizeTimestamp(selectedDate, timings[userId]?.in),
        checkOutAt: normalizeTimestamp(selectedDate, timings[userId]?.out),
      }));

    if (!records.length) {
      return message.warning("Mark at least one attendance");
    }

    try {
      await dispatch(
        submitAttendance({
          schoolId,
          date: selectedDate.toISOString(),
          role: "staff",
          records,
        })
      ).unwrap();

     message.success("Attendance saved successfully");
    } catch (err) {
      message.error(err || "Error saving attendance");
    }
  };

  /* ------------------ COLUMNS ------------------ */
  const columns = [
    {
      title: "Staff",
      dataIndex: "name",
       render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record?.name || record?.fullName || "Unnamed"}</Text>
          <Text type="secondary">{record?.employeeId || record?.regId || "ID: N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Role",
      render: (_, r) => getRoleName(r) || "—",
    },
    {
      title: "Department",
      dataIndex: "department",
        render: (dept) => dept || "—",
    },
    {
      title: "Attendance",
      align: "center",
      render: (_, r) => (
        <Radio.Group
          size="small"
          value={attendance[r._id]}
          onChange={(e) => handleAttendanceChange(r._id, e.target.value)}
          optionType="button"
          buttonStyle="solid"
        >
         <Radio.Button value="present">Present</Radio.Button>
          <Radio.Button value="absent">Absent</Radio.Button>
          <Radio.Button value="leave">Leave</Radio.Button>
        </Radio.Group>
      ),
    },
    {
     title: "In/Out Time",
      render: (_, r) =>
        attendance[r._id] === "present" ? (
          <Space>
            <TimePicker
              size="small"
              format="HH:mm"
              value={timings[r._id]?.in}
              onChange={(time) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], in: time },
                }))
              }
            />
            <TimePicker
              size="small"
              format="HH:mm"
              value={timings[r._id]?.out}
              onChange={(time) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], out: time },
                }))
              }
            />
          </Space>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Hours",
       render: (_, r) => <Tag color="blue">{calculateHours(timings[r._id]?.in, timings[r._id]?.out)}</Tag>,
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size={4} style={{ width: "100%", marginBottom: 14 }}>
        <Title level={4} style={{ marginBottom: 0 }}>
          Staff Attendance
        </Title>
        <Text type="secondary">Modern, quick-mark flow with smart filters and shift timing support.</Text>
      </Space>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={4}>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            style={{ width: "100%" }}
             disabledDate={(current) => current && current > dayjs().endOf("day")}
          />
        </Col>

          <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder="Department"
            style={{ width: "100%" }}
            value={filterDept}
            onChange={setFilterDept}
         options={departmentOptions}
          />
        </Col>

         <Col xs={24} md={4}>
          <Select
            allowClear
            placeholder="Role"
            style={{ width: "100%" }}
             value={filterRole}
            onChange={setFilterRole}
            options={roleOptions}
          />
        </Col>

       <Col xs={24} md={6}>
          <Input
            placeholder="Search staff / employee id"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} md={6} style={{ textAlign: "right" }}>
          <Space wrap style={{ justifyContent: "flex-end" }}>
            <Button icon={<CheckCircleOutlined />} onClick={markAllVisiblePresent}>
              Mark visible present
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setAttendance({});
                setTimings({});
              }}
            >
              Reset
            </Button>

            <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit}>
              Save
            </Button>
          </Space>
        </Col>
      </Row>

     <Divider style={{ margin: "14px 0" }} />

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Visible Staff" value={summary.total} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small">
            <Statistic title="Marked" value={summary.marked} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Tag color="green" style={{ padding: "6px 10px" }}>Present: {summary.present}</Tag>
        </Col>
        <Col xs={12} md={4}>
          <Tag color="red" style={{ padding: "6px 10px" }}>Absent: {summary.absent}</Tag>
        </Col>
        <Col xs={12} md={4}>
          <Tag color="orange" style={{ padding: "6px 10px" }}>Leave: {summary.leave}</Tag>
        </Col>
        </Row>

      {/* TABLE */}
     <Table rowKey="_id" columns={columns} dataSource={filteredStaff} pagination={{ pageSize: 8, showSizeChanger: true }} />
    </Card>
  );
};

export default StaffAttendance;