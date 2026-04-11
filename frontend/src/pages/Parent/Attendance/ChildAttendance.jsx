import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Alert,
  Card,
  Col,
  Empty,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { fetchMyAttendance } from "../../../features/attendanceSlice.js";
import { fetchMyChildren } from "../../../features/studentPortalSlice.js";
const { Title, Text } = Typography;

const ChildAttendancePage = () => {
  const dispatch = useDispatch();
  const { children = [], loading: childLoading } = useSelector((state) => state.studentPortal || {});
  const { myAttendance = [], loading: attendanceLoading } = useSelector((state) => state.attendance || {});

  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) {
      setSelectedChildId(children[0].userId);
    }
  }, [children, selectedChildId]);

  useEffect(() => {
    if (selectedChildId) {
      dispatch(fetchMyAttendance({ childId: selectedChildId }));
    }
  }, [dispatch, selectedChildId]);

  const summary = useMemo(() => {
    const initial = {
      totalDays: myAttendance.length,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
    };

    myAttendance.forEach((record) => {
      const status = String(record.status || "").toLowerCase();
      if (status === "present") initial.presentDays += 1;
      else if (status === "absent") initial.absentDays += 1;
      else initial.leaveDays += 1;
    });

    const attendancePercent = initial.totalDays
      ? Math.round((initial.presentDays / initial.totalDays) * 100)
      : 0;

    return { ...initial, attendancePercent };
  }, [myAttendance]);

  const childOptions = useMemo(
    () =>
      children.map((child) => ({
        label: child?.name || "Unnamed Child",
        value: child?.userId,
      })),
    [children]
  );

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (value) => (value ? dayjs(value).format("DD MMM YYYY") : "-"),
      width: 170,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) => {
        const normalizedStatus = String(status || "-").toLowerCase();
        const color =
          normalizedStatus === "present"
            ? "green"
            : normalizedStatus === "absent"
              ? "red"
              : "gold";
        return <Tag color={color}>{normalizedStatus.toUpperCase()}</Tag>;
      },
      width: 120,
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      render: (value) => value || "No remark",
    },
  ];

  const loading = childLoading || attendanceLoading;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Card>
        <Space direction="vertical" size={6} style={{ width: "100%" }}>
          <Title level={4} style={{ margin: 0 }}>
            Child Attendance
          </Title>
          <Text type="secondary">
            Child select karo and attendance summary + daily records ek hi screen par dekh lo.
          </Text>
          <Select
            placeholder="Select child"
            value={selectedChildId}
            onChange={setSelectedChildId}
            loading={childLoading}
            style={{ width: "100%", maxWidth: 360 }}
            options={childOptions}
            showSearch
            optionFilterProp="label"
            disabled={!childOptions.length}
          />
          {!childOptions.length && !childLoading && (
            <Alert
              type="info"
              showIcon
              message="No linked child found for this parent account."
            />
          )}
        </Space>
      </Card>

      {selectedChildId ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Total Days" value={summary.totalDays} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Present" value={summary.presentDays} valueStyle={{ color: "#389e0d" }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic title="Absent" value={summary.absentDays} valueStyle={{ color: "#cf1322" }} />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Attendance %"
                  value={summary.attendancePercent}
                  suffix="%"
                  valueStyle={{ color: summary.attendancePercent >= 75 ? "#1677ff" : "#d46b08" }}
                />
              </Card>
            </Col>
          </Row>

          <Card title="Attendance History" loading={loading}>
            {myAttendance.length ? (
              <Table
                rowKey="_id"
                columns={columns}
                dataSource={myAttendance}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 700 }}
              />
            ) : (
              <Empty description="Attendance records not found" />
            )}
          </Card>
        </>
      ) : (
        <Card>
          <Empty description="Please select a child to view attendance" />
        </Card>
      )}
    </Space>
  );
};

export default ChildAttendancePage;