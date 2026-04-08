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
  Badge,
  message,
  Tooltip,
} from "antd";
import { SaveOutlined, ReloadOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUser } from "../../../features/authSlice";
import { submitAttendance } from "../../../features/attendanceSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

const StaffAttendance = () => {
  const dispatch = useDispatch();

  const { users = [], user: currentUser } = useSelector(
    (state) => state.auth || {}
  );

  const [attendance, setAttendance] = useState({});
  const [timings, setTimings] = useState({});
  const [filterDept, setFilterDept] = useState();
  const [filterRole, setFilterRole] = useState();
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const schoolId = currentUser?.school?._id;

  useEffect(() => {
    dispatch(fetchAllUser({schoolId,roleName: ["Teacher","Staff","Super Admin"], isActive: true }));
  }, [dispatch,schoolId]);

  /* ------------------ HELPERS ------------------ */
  const getRoleName = (staff) =>
    staff?.role?.name ||
    staff?.roleId?.name ||
    staff?.role?.title ||
    staff?.roleId?.title ||
    "";

  const normalizeTimestamp = (dateValue, timeValue) => {
    if (!dateValue || !timeValue) return undefined;

    return dateValue
      .hour(timeValue.hour())
      .minute(timeValue.minute())
      .second(0)
      .millisecond(0)
      .toISOString();
  };

  /* ------------------ FILTER ------------------ */
  const filteredStaff = useMemo(() => {
    const excludedRoles = ["Student", "Parent"];

    return users.filter((s) => {
      const roleName = getRoleName(s);
      if (excludedRoles.includes(roleName)) return false;

      return (
        (!filterDept || s.department === filterDept) &&
        (!filterRole || roleName === filterRole)
      );
    });
  }, [users, filterDept, filterRole]);

  /* ------------------ ACTIONS ------------------ */
  const handleAttendanceChange = (id, status) => {
    setAttendance((p) => ({ ...p, [id]: status }));

    if (status !== "present") {
      setTimings((p) => ({ ...p, [id]: {} }));
    }
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

      message.success("Attendance saved ✅");
    } catch (err) {
      message.error(err || "Error saving attendance");
    }
  };

  /* ------------------ COLUMNS ------------------ */
  const columns = [
    {
      title: "Staff",
      dataIndex: "name",
      render: (t) => <Text strong>{t}</Text>,
    },
    {
      title: "Role",
      render: (_, r) => getRoleName(r) || "—",
    },
    {
      title: "Department",
      dataIndex: "department",
    },
    {
      title: "Attendance",
      align: "center",
      render: (_, r) => (
        <Radio.Group
          size="small"
          value={attendance[r._id]}
          onChange={(e) =>
            handleAttendanceChange(r._id, e.target.value)
          }
        >
          <Radio.Button value="present">P</Radio.Button>
          <Radio.Button value="absent">A</Radio.Button>
          <Radio.Button value="leave">L</Radio.Button>
        </Radio.Group>
      ),
    },
    {
      title: "Timing",
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
      render: (_, r) => (
        <Tag color="blue">
          {calculateHours(
            timings[r._id]?.in,
            timings[r._id]?.out
          )}
        </Tag>
      ),
    },
  ];

  return (
    <Card>
      {/* HEADER */}
      <Title level={4}>Staff Attendance</Title>
      <Text type="secondary">
        Mark daily attendance for staff
      </Text>

      <Divider />

      {/* FILTERS */}
      <Row gutter={16}>
        <Col md={4}>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            style={{ width: "100%" }}
          />
        </Col>

        <Col md={4}>
          <Select
            allowClear
            placeholder="Department"
            style={{ width: "100%" }}
            onChange={setFilterDept}
          >
            <Option value="Admin">Admin</Option>
            <Option value="Accounts">Accounts</Option>
          </Select>
        </Col>

        <Col md={4}>
          <Select
            allowClear
            placeholder="Role"
            style={{ width: "100%" }}
            onChange={setFilterRole}
          >
            <Option value="Staff">Staff</Option>
            <Option value="Teacher">Teacher</Option>
          </Select>
        </Col>

        <Col md={12} style={{ textAlign: "right" }}>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                setAttendance({});
                setTimings({});
              }}
            >
              Reset
            </Button>

            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* TABLE */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredStaff}
        pagination={{ pageSize: 8 }}
      />
    </Card>
  );
};

export default StaffAttendance;