import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Avatar, Card, Col, Empty, Row, Space, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchMyChildren } from "../../../../features/studentPortalSlice";

const { Text, Title } = Typography;

const MyChildren = () => {
  const dispatch = useDispatch();
  const { children = [], loading } = useSelector((state) => state.studentPortal || {});

  useEffect(() => {
    dispatch(fetchMyChildren());
  }, [dispatch]);

  return (
    <Card loading={loading}>
      <Space direction="vertical" style={{ width: "100%" }}>
        <Title level={4} style={{ margin: 0 }}>My Children</Title>

        {!children.length ? (
          <Empty description="No linked children found" />
        ) : (
          <Row gutter={[16, 16]}>
            {children.map((child) => (
              <Col xs={24} md={12} lg={8} key={child._id}>
                <Card size="small" bordered>
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Space>
                      <Avatar icon={<UserOutlined />} />
                      <Space direction="vertical" size={0}>
                        <Text strong>{child.name || "Student"}</Text>
                        <Text type="secondary">{child.registrationNumber || "-"}</Text>
                      </Space>
                    </Space>

                    <div>
                      <Tag color="blue">Class: {child.className || "-"}</Tag>
                      <Tag color="purple">Section: {child.sectionName || "-"}</Tag>
                    </div>

                    <Text type="secondary">Email: {child.email || "-"}</Text>
                    <Text type="secondary">DOB: {child.dateOfBirth ? dayjs(child.dateOfBirth).format("DD MMM YYYY") : "-"}</Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Space>
    </Card>
  );
};

export default MyChildren;
