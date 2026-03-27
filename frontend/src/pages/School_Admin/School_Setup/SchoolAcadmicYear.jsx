import React, { useEffect, useState } from "react";
import {
  Card,
  DatePicker,
  Input,
  Button,
  Table,
  Switch,
  message,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";

import {
  createAcademicYear,
  fetchAllAcademicYears,
  setActiveAcademicYear,
  clearAcademicYearMessages,
} from "../../../features/academicYearSlice";

const { RangePicker } = DatePicker;

const SchoolAcademicYear = () => {
  const dispatch = useDispatch();

  const {
    academicYears,
    loading,
    error,
    message: successMessage,
  } = useSelector((state) => state.academicYear);

  const [name, setName] = useState("");
  const [dates, setDates] = useState([]);

  // ✅ Dynamic schoolId
  const user = useSelector((state) => state.auth.user);
  const schoolId = user?.school?._id;

  /* ================= FETCH ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllAcademicYears(schoolId));
    }
  }, [dispatch, schoolId]);

  /* ================= HANDLE MESSAGES ================= */
  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearAcademicYearMessages());
    }

    if (successMessage) {
      message.success(successMessage);
      dispatch(clearAcademicYearMessages());
    }
  }, [error, successMessage, dispatch]);

  /* ================= CREATE ================= */
  const handleCreate = async () => {
    if (!name || dates.length !== 2) {
      return message.warning("Please fill all fields");
    }

    const payload = {
      schoolId,
      name,
      startDate: dates[0].toISOString(),
      endDate: dates[1].toISOString(),
    };

    try {
      await dispatch(createAcademicYear(payload)).unwrap();

      setName("");
      setDates([]);
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= SET ACTIVE ================= */
  const handleActiveChange = async (id) => {
    try {
      await dispatch(setActiveAcademicYear(id)).unwrap();
    } catch (err) {
      console.log(err);
    }
  };

  /* ================= TABLE ================= */
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
          disabled={val} // ✅ already active disable
          onChange={() => handleActiveChange(record._id)}
        />
      ),
    },
  ];

  return (
    <Card title="School Academic Year">
      {/* 🔹 FORM */}
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

      {/* 🔹 TABLE */}
      <Table
        style={{ marginTop: 30 }}
        dataSource={[...academicYears].reverse()} // latest first
        columns={columns}
        rowKey="_id"
        loading={loading}
      />
    </Card>
  );
};

export default SchoolAcademicYear;
