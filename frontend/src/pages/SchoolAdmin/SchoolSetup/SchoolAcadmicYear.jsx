import React, { useEffect, useState } from "react";
import { Card, DatePicker, Input, Button, Table, Switch, message, Space } from "antd";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const SchoolAcademicYear = () => {
  const [years, setYears] = useState([]);
  const [name, setName] = useState("");
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);

  const schoolId = "123"; // 👉 dynamic karna later

  // 🔹 Fetch existing academic years
  const fetchYears = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/academic-years/${schoolId}`);
      const data = await res.json();
      setYears(data.data || []);
    } catch (err) {
      message.error("Failed to load academic years");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  // 🔹 Create new academic year
  const handleCreate = async () => {
    if (!name || dates.length !== 2) {
      return message.warning("Please fill all fields");
    }

    try {
      setLoading(true);

      await fetch("/api/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          name,
          startDate: dates[0],
          endDate: dates[1],
        }),
      });

      message.success("Academic Year Created ✅");
      setName("");
      setDates([]);
      fetchYears();
    } catch (err) {
      message.error("Failed to create");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Set Active Year
  const handleActiveChange = async (id) => {
    try {
      await fetch(`/api/academic-years/set-active/${id}`, {
        method: "PATCH",
      });

      message.success("Active year updated ✅");
      fetchYears();
    } catch (err) {
      message.error("Failed to update active year");
    }
  };

  // 🔹 Table columns
  const columns = [
    {
      title: "Year",
      dataIndex: "name",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      render: (date) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Active",
      dataIndex: "isActive",
      render: (val, record) => (
        <Switch
          checked={val}
          onChange={() => handleActiveChange(record._id)}
        />
      ),
    },
  ];

  return (
    <Card
      title="School Academic Year"
      style={{ maxWidth: 800, margin: "auto" }}
    >
      {/* 🔹 Create Form */}
      <Space direction="vertical" style={{ width: "100%" }}>
        <Input
          placeholder="Academic Year (e.g. 2024-2025)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <RangePicker
          style={{ width: "100%" }}
          value={dates}
          onChange={(val) => setDates(val)}
        />

        <Button type="primary" onClick={handleCreate} loading={loading}>
          Create Academic Year
        </Button>
      </Space>

      {/* 🔹 Table */}
      <Table
        style={{ marginTop: 30 }}
        dataSource={years}
        columns={columns}
        rowKey="_id"
        loading={loading}
      />
    </Card>
  );
};

export default SchoolAcademicYear;