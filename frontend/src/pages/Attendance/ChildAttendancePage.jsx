import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Empty,
  Alert,
  Space,
} from "antd";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAttendance } from "../../features/attendanceSlice";
import { fetchMyChildren } from "../../features/studentPortalSlice";

const { Title, Text } = Typography;

const ChildAttendancePage = () => {
  const dispatch = useDispatch();

  const { children = [], loading: childLoading } = useSelector(
    (s) => s.studentPortal || {}
  );

  const { myAttendance = [], loading: attendanceLoading } = useSelector(
    (s) => s.attendance || {}
  );

  const [childId, setChildId] = useState(null);

  /* ---------------- FETCH CHILDREN ---------------- */
  useEffect(() => {
    dispatch(fetchMyChildren());
  }, []);

  /* ---------------- AUTO SELECT FIRST CHILD ---------------- */
  useEffect(() => {
    if (!childId && children.length) {
      setChildId(children[0].userId);
    }
  }, [children]);

  /* ---------------- FETCH ATTENDANCE ---------------- */
  useEffect(() => {
    if (childId) {
      dispatch(fetchMyAttendance({ childId }));
    }
  }, [childId]);

  /* ---------------- CHILD OPTIONS ---------------- */
  const childOptions = useMemo(
    () =>
      children.map((c) => ({
        label: c?.name || "Child",
        value: c?.userId,
      })),
    [children]
  );

  /* ---------------- SUMMARY ---------------- */
  const summary = useMemo(() => {
    const s = {
      total: myAttendance.length,
      present: 0,
      absent: 0,
      leave: 0,
    };

    myAttendance.forEach((r) => {
      const status = (r.status || "").toLowerCase();
      if (status === "present") s.present++;
      else if (status === "absent") s.absent++;
      else s.leave++;
    });

    const percent = s.total
      ? Math.round((s.present / s.total) * 100)
      : 0;

    return { ...s, percent };
  }, [myAttendance]);

  /* ---------------- TABLE ---------------- */
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (s) => {
        const v = (s || "").toLowerCase();

        return (
          <Tag color={v === "present" ? "green" : v === "absent" ? "red" : "gold"}>
            {v.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (v) => v || "—",
    },
  ];

  const loading = childLoading || attendanceLoading;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-4">
        <Title level={4} className="!mb-0">
          Child Attendance
        </Title>
        <Text type="secondary">
          View your child’s attendance summary and history
        </Text>
      </div>

      {/* CHILD SELECT */}
      <Card className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <Text strong>Select Child</Text>

          <Select
            placeholder="Choose child"
            value={childId}
            onChange={setChildId}
            loading={childLoading}
            options={childOptions}
            className="w-full md:w-80"
            disabled={!childOptions.length}
            showSearch
          />
        </div>

        {!childOptions.length && !childLoading && (
          <Alert
            className="mt-3"
            type="info"
            showIcon
            message="No child linked with this account"
          />
        )}
      </Card>

      {/* EMPTY STATE */}
      {!childId ? (
        <Card>
          <Empty description="Select a child to view attendance" />
        </Card>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <Row gutter={[12, 12]} className="mb-4">
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Total" value={summary.total} />
              </Card>
            </Col>

            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Present"
                  value={summary.present}
                  valueStyle={{ color: "#389e0d" }}
                />
              </Card>
            </Col>

            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Absent"
                  value={summary.absent}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>

            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic
                  title="Attendance %"
                  value={summary.percent}
                  suffix="%"
                  valueStyle={{
                    color: summary.percent >= 75 ? "#1677ff" : "#d46b08",
                  }}
                />
              </Card>
            </Col>
          </Row>

          {/* TABLE */}
          <Card title="Attendance History" loading={loading}>
            {myAttendance.length ? (
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={myAttendance}
                pagination={{ pageSize: 8 }}
                scroll={{ x: true }}
              />
            ) : (
              <Empty description="No attendance records found" />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default ChildAttendancePage;