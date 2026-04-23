import React, { useEffect, useMemo, useState } from "react";
import { Alert, Card, Drawer, Empty, Input, Select, Space, Spin, Table, Tag, Typography, message } from "antd";
import { useSelector } from "react-redux";
import httpClient from "../api/httpClient";

const { Title, Text } = Typography;

const DAY_OPTIONS = [
  { label: "All Days", value: "all" },
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
];

const ACCESS_ROLES = ["Super Admin", "School Admin", "Teacher", "Student", "Principal", "Vice Principal"];

const normalizeData = (payload) => payload?.data || payload || [];

const SchedulePage = () => {
  const user = useSelector((state) => state.auth?.user);
  const roleName = user?.role?.name || "";

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const canViewSchedule = ACCESS_ROLES.includes(roleName);

  const loadSchedule = async () => {
    setLoading(true);
    try {
      if (roleName === "Student") {
        const response = await httpClient.get("/student-portal/me/timetable");
        setRows(normalizeData(response?.data));
      } else if (roleName === "Teacher") {
        const response = await httpClient.get("/timetables/teacher", {
          params: user?._id ? { teacherId: user._id } : {},
        });
        setRows(normalizeData(response?.data));
      } else {
        const response = await httpClient.get("/timetables/class");
        setRows(normalizeData(response?.data));
      }
    } catch (error) {
      message.error(error?.response?.data?.message || "Failed to load schedule");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canViewSchedule) {
      loadSchedule();
    } else {
      setLoading(false);
    }
  }, [canViewSchedule, roleName]);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      const dayValue = row?.day || row?.weekday || "";
      const subject = row?.subjectId?.name || row?.subject?.name || row?.subject || "";
      const className = row?.schoolClassId?.name || row?.className || "";
      const section = row?.sectionId?.name || row?.sectionName || "";
      const teacher = row?.teacherId?.name || row?.teacher?.name || "";

      const matchesDay = dayFilter === "all" || dayValue === dayFilter;
      const matchesSearch = !query || [subject, className, section, teacher].join(" ").toLowerCase().includes(query);
      return matchesDay && matchesSearch;
    });
  }, [rows, search, dayFilter]);

  if (!canViewSchedule) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Schedule module access is unavailable for your role"
        description="Please contact your administrator to get timetable access."
      />
    );
  }

  const columns = [
    {
      title: "Day",
      key: "day",
      render: (_value, record) => record?.day || record?.weekday || "-",
    },
    {
      title: "Time",
      key: "time",
      render: (_value, record) => `${record?.startTime || "--:--"} - ${record?.endTime || "--:--"}`,
    },
    {
      title: "Subject",
      key: "subject",
      render: (_value, record) => record?.subjectId?.name || record?.subject?.name || record?.subject || "-",
    },
    {
      title: "Class / Section",
      key: "classSection",
      render: (_value, record) => {
        const className = record?.schoolClassId?.name || record?.className || "-";
        const section = record?.sectionId?.name || record?.sectionName || "-";
        return `${className} / ${section}`;
      },
    },
    {
      title: "Teacher",
      key: "teacher",
      render: (_value, record) => record?.teacherId?.name || record?.teacher?.name || "-",
    },
    {
      title: "Room",
      dataIndex: "room",
      key: "room",
      render: (value) => value || "-",
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={2}>
          <Title level={4} style={{ margin: 0 }}>Schedule</Title>
          <Text type="secondary">Timetable list with filters, quick search and period detail view.</Text>
        </Space>
      </Card>

      <Card>
        <Space wrap>
          <Input.Search
            allowClear
            placeholder="Search subject, class, section, teacher"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: 290 }}
          />
          <Select value={dayFilter} onChange={setDayFilter} options={DAY_OPTIONS} style={{ width: 180 }} />
        </Space>
      </Card>

      <Card title="Timetable">
        {loading ? (
          <div style={{ textAlign: "center", padding: 20 }}><Spin /></div>
        ) : filteredRows.length === 0 ? (
          <Empty description="No schedule entries found" />
        ) : (
          <Table
            rowKey={(record) => record._id || `${record.day}-${record.startTime}-${record.subjectId?._id || record.subject}`}
            columns={columns}
            dataSource={filteredRows}
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => setSelected(record),
              style: { cursor: "pointer" },
            })}
          />
        )}
      </Card>

      <Drawer
        title="Schedule Detail"
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        width={460}
      >
        {selected && (
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Tag color="blue">{selected?.day || selected?.weekday || "-"}</Tag>
            <Text><strong>Time:</strong> {selected?.startTime || "--:--"} - {selected?.endTime || "--:--"}</Text>
            <Text><strong>Subject:</strong> {selected?.subjectId?.name || selected?.subject?.name || selected?.subject || "-"}</Text>
            <Text><strong>Class:</strong> {selected?.schoolClassId?.name || selected?.className || "-"}</Text>
            <Text><strong>Section:</strong> {selected?.sectionId?.name || selected?.sectionName || "-"}</Text>
            <Text><strong>Teacher:</strong> {selected?.teacherId?.name || selected?.teacher?.name || "-"}</Text>
            <Text><strong>Room:</strong> {selected?.room || "-"}</Text>
          </Space>
        )}
      </Drawer>
    </Space>
  );
};

export default SchedulePage;
