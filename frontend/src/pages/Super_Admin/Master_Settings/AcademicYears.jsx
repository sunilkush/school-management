import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  createAcademicYear,
  archiveAcademicYear,
  deleteAcademicYear,
  updateAcademicYear
} from "../../../features/academicYearSlice";

import { fetchSchools } from "../../../features/schoolSlice";

import {
  Table,
  Select,
  DatePicker,
  Button,
  Card,
  Typography,
  Space,
  Tag,
  Drawer,
  Statistic,
  Row,
  Col,
  message,
  Popconfirm
} from "antd";

import {
  PlusOutlined,
  ReloadOutlined
} from "@ant-design/icons";

import dayjs from "dayjs";

const { Title } = Typography;
const { Option } = Select;

const AcademicYearPage = () => {

  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { schools } = useSelector((state) => state.school);

  const {
    academicYears = [],
    activeYear = null,
    loading
  } = useSelector((state) => state.academicYear);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [selectedSchoolId, setSelectedSchoolId] = useState(
    user?.role?.name === "Super Admin" ? "" : user?.school?._id
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  /* ================= FETCH SCHOOLS ================= */

  useEffect(() => {

    if (user?.role?.name === "Super Admin") {
      dispatch(fetchSchools());
    }

  }, [dispatch, user?.role?.name]);

  /* ================= FETCH YEARS ================= */

  useEffect(() => {

    if (selectedSchoolId) {
      dispatch(fetchAllAcademicYears(selectedSchoolId));
      dispatch(fetchActiveAcademicYear(selectedSchoolId));
    }

  }, [selectedSchoolId, dispatch]);

  /* ================= FORM RESET ================= */

  const resetForm = () => {
    setEditId(null);
    setStartDate(null);
    setEndDate(null);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    resetForm();
  };

  /* ================= YEAR NAME ================= */

  const generateYearName = (start, end) => {

    const s = dayjs(start).year();
    const e = dayjs(end).year();

    return `${s}-${e}`;
  };

  /* ================= CREATE / UPDATE ================= */

  const handleCreate = async () => {

    if (user?.role?.name === "Super Admin" && !selectedSchoolId) {
      message.error("Please select school");
      return;
    }

    if (!startDate || !endDate) {
      message.error("Select dates");
      return;
    }

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      message.error("End date must be after start date");
      return;
    }

    const name = generateYearName(startDate, endDate);

    try {

      if (editId) {

        await dispatch(
          updateAcademicYear({
            id: editId,
            schoolId: selectedSchoolId,
            name,
            startDate,
            endDate
          })
        ).unwrap();

        message.success("Academic year updated");

      } else {

        await dispatch(
          createAcademicYear({
            schoolId: selectedSchoolId,
            name,
            startDate,
            endDate
          })
        ).unwrap();

        message.success("Academic year created");

      }

      closeDrawer();

    } catch (error) {
      message.error(error || "Something went wrong");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (record) => {

    setEditId(record._id);

    setStartDate(dayjs(record.startDate));
    setEndDate(dayjs(record.endDate));

    setDrawerOpen(true);
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {

    try {

      await dispatch(deleteAcademicYear(id)).unwrap();

      message.success("Academic year deleted");

    } catch (error) {

      message.error(error);

    }
  };

  /* ================= ARCHIVE ================= */

  const handleArchive = async (id) => {

    try {

      await dispatch(archiveAcademicYear(id)).unwrap();

      message.success("Academic year archived");

    } catch (error) {

      message.error(error);

    }
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [

    {
      title: "Academic Year",
      dataIndex: "name"
    },

    {
      title: "Start Date",
      dataIndex: "startDate",
      render: (d) => dayjs(d).format("DD MMM YYYY")
    },

    {
      title: "End Date",
      dataIndex: "endDate",
      render: (d) => dayjs(d).format("DD MMM YYYY")
    },

    {
      title: "Status",
      render: (_, record) => {

        if (record.archived)
          return <Tag color="gray">Archived</Tag>;

        if (activeYear?._id === record._id)
          return <Tag color="green">Active</Tag>;

        return <Tag color="blue">Inactive</Tag>;
      }
    },

    {
      title: "Actions",
      render: (_, record) => {

        const isActive = activeYear?._id === record._id;

        return (

          <Space>

            {!isActive && !record.archived && (

              <Button
                type="link"
                onClick={() => dispatch(setActiveAcademicYear(record._id))}
              >
                Set Active
              </Button>

            )}

            {!record.archived && (

              <Button
                type="link"
                danger
                onClick={() => handleArchive(record._id)}
              >
                Archive
              </Button>

            )}

            <Button
              type="link"
              disabled={isActive}
              onClick={() => handleEdit(record)}
            >
              Edit
            </Button>

            <Popconfirm
              title="Delete Academic Year?"
              description="This action cannot be undone"
              onConfirm={() => handleDelete(record._id)}
            >

              <Button
                type="link"
                danger
                disabled={isActive}
              >
                Delete
              </Button>

            </Popconfirm>

          </Space>

        );
      }
    }

  ];

  const total = academicYears.length;
  const archivedTotal = academicYears.filter(a => a.archived).length;

  /* ================= UI ================= */

  return (

    <div>

      {/* HEADER */}

      <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>

        <Title level={3}>Academic Year Management</Title>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Create Academic Year
        </Button>

      </Row>

      {/* STATS */}

      <Row gutter={16} style={{ marginBottom: 20 }}>

        <Col span={8}>
          <Card>
            <Statistic title="Total Academic Years" value={total} />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Active Academic Year"
              value={activeYear?.name || "None"}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic title="Archived Years" value={archivedTotal} />
          </Card>
        </Col>

      </Row>

      {/* FILTER */}

      <Card style={{ marginBottom: 20 }}>

        <Space>

          {user?.role?.name === "Super Admin" && (

            <Select
              placeholder="Select School"
              style={{ width: 220 }}
              value={selectedSchoolId || undefined}
              onChange={setSelectedSchoolId}
            >

              {schools.map((s) => (
                <Option key={s._id} value={s._id}>
                  {s.name}
                </Option>
              ))}

            </Select>

          )}

          <Button
            icon={<ReloadOutlined />}
            onClick={() =>
              selectedSchoolId &&
              dispatch(fetchAllAcademicYears(selectedSchoolId))
            }
          >
            Refresh
          </Button>

        </Space>

      </Card>

      {/* TABLE */}

      <Card>

        <Table
          columns={columns}
          dataSource={academicYears}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          locale={{
            emptyText: "No academic year found"
          }}
        />

      </Card>

      {/* DRAWER */}

      <Drawer
        title={editId ? "Edit Academic Year" : "Create Academic Year"}
        width={350}
        open={drawerOpen}
        onClose={closeDrawer}
      >

        <Space direction="vertical" style={{ width: "100%" }}>

          <DatePicker
            style={{ width: "100%" }}
            placeholder="Start Date"
            value={startDate}
            onChange={(d) => setStartDate(d)}
          />

          <DatePicker
            style={{ width: "100%" }}
            placeholder="End Date"
            value={endDate}
            onChange={(d) => setEndDate(d)}
          />

          <Button
            type="primary"
            block
            loading={loading}
            onClick={handleCreate}
          >
            {editId ? "Update Academic Year" : "Create Academic Year"}
          </Button>

        </Space>

      </Drawer>

    </div>

  );
};

export default AcademicYearPage;