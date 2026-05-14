import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Descriptions, Empty, Tag, Typography } from "antd";
import { fetchStudentTransport } from "../../../../features/studentPortalSlice";

const { Title } = Typography;

const StudentTransport = () => {
  const dispatch = useDispatch();
  const { transportAssignment, loading } = useSelector((state) => state.studentPortal);

  useEffect(() => {
    dispatch(fetchStudentTransport());
  }, [dispatch]);

  return (
    <Card loading={loading}>
      <Title level={4}>My Transport</Title>
      {!transportAssignment ? (
        <Empty description="No transport assigned" />
      ) : (
        <Descriptions bordered column={1} size="small">
          <Descriptions.Item label="Route">
            {transportAssignment.routeId?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Bus">
            {transportAssignment.vehicleId?.busNumber || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Driver">
            {transportAssignment.vehicleId?.driverName || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Driver Contact">
            {transportAssignment.vehicleId?.driverContact || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Pickup Stop">
            {transportAssignment.pickupStop || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Drop Stop">
            {transportAssignment.dropStop || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Vehicle Status">
            <Tag color="green">{transportAssignment.vehicleId?.status || "Available"}</Tag>
          </Descriptions.Item>
        </Descriptions>
      )}
    </Card>
  );
};

export default StudentTransport;
