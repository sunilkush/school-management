import React, { useState, useMemo } from "react";
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
import {fetchAllUser} from "../../../features/authSlice";
import { useEffect } from "react";

const { Title, Text } = Typography;
const { Option } = Select;

const StaffAttendance = () => {
   const dispatch = useDispatch();
   const { users = [] } = useSelector((state) => state.auth);
  const [attendance, setAttendance] = useState({});
  const [timings, setTimings] = useState({});
  const [filterDept, setFilterDept] = useState();
  const [filterRole, setFilterRole] = useState();
  const [selectedDate, setSelectedDate] = useState();
  useEffect(() =>{
    dispatch(fetchAllUser());
  },[dispatch])
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

  const filteredStaff = useMemo(() => {
    return users.filter(
      (s) =>
        (!filterDept || s.department === filterDept) &&
        (!filterRole || s.role === filterRole)
    );
  }, [filterDept, filterRole, users]);

  const summary = useMemo(() => {
    return {
      present: Object.values(attendance).filter((a) => a === "present").length,
      absent: Object.values(attendance).filter((a) => a === "absent").length,
      leave: Object.values(attendance).filter((a) => a === "leave").length,
    };
  }, [attendance]);

  const handleSubmit = () => {
    if (!selectedDate) {
      return message.warning("Please select attendance date");
    }
    message.success("Attendance saved successfully");
  };

  const columns = [
    {
      title: "Staff",
      dataIndex: "name",
      render: (t) => <Text strong>{t}</Text>,
    },
   {
    title: "Role",
    render: (_, r) => r.role?.name || "—", // use populated role name
  },
    { title: "Department", dataIndex: "department" },

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
          <Space size={6}>
            <TimePicker
              format="HH:mm"
              size="small"
              placeholder="In"
              onChange={(t) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], in: t },
                }))
              }
            />
            <TimePicker
              format="HH:mm"
              size="small"
              placeholder="Out"
              onChange={(t) =>
                setTimings((p) => ({
                  ...p,
                  [r._id]: { ...p[r._id], out: t },
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
      align: "center",
      render: (_, r) => (
        <Tag color="blue">
          {calculateHours(timings[r._id]?.in, timings[r._id]?.out)}
        </Tag>
      ),
    },
  ];

  return (
    <Card bordered={false}>
      {/* Header */}
      <Row justify="space-between" align="middle">
        <Title level={4}>Staff Attendance</Title>

        <Space>
          <Badge status="success" text={`Present: ${summary.present}`} />
          <Badge status="error" text={`Absent: ${summary.absent}`} />
          <Badge status="warning" text={`Leave: ${summary.leave}`} />
        </Space>
      </Row>

      <Divider />

      {/* Filters */}
      <Row gutter={12}>
        <Col md={5}>
          <DatePicker
            style={{ width: "100%" }}
            placeholder="Attendance Date"
            onChange={setSelectedDate}
          />
        </Col>

        <Col md={4}>
          <Select
            allowClear
            placeholder="Department"
            style={{ width: "100%" }}
            onChange={setFilterDept}
          >
            <Option value="Math">Math</Option>
            <Option value="Accounts">Accounts</Option>
            <Option value="Admin">Admin</Option>
          </Select>
        </Col>

        <Col md={4}>
          <Select
            allowClear
            placeholder="Role"
            style={{ width: "100%" }}
            onChange={setFilterRole}
          >
            <Option value="Teacher">Teacher</Option>
            <Option value="Accountant">Accountant</Option>
            <Option value="Peon">Peon</Option>
          </Select>
        </Col>

        <Col md={11} style={{ textAlign: "right" }}>
          <Space>
            <Tooltip title="Clear attendance">
              <Button
                icon={<ReloadOutlined />}
                onClick={() => setAttendance({})}
              >
                Reset
              </Button>
            </Tooltip>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              onClick={handleSubmit}
            >
              Save Attendance
            </Button>
          </Space>
        </Col>
      </Row>

      <Divider />

      {/* Table */}
      <Table
        rowKey="_id"
        size="middle"
        columns={columns}
        dataSource={filteredStaff}
        pagination={{ pageSize: 8 }}
        locale={{ emptyText: "No staff found" }}
      />
    </Card>
  );
};

export default StaffAttendance;
