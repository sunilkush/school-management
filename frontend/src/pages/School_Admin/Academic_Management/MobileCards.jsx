import React from "react";
import {
  Card,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Empty,
  Button,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

const MobileCards = ({ data = [] }) => {
  if (!data.length) return <Empty description="No Classes Found" />;

  return (
    <Row gutter={[12, 12]}>
      {data.map((cls, index) => (
        <Col xs={24} key={cls._id}>
          <Card size="small" bordered>
            <Space direction="vertical" style={{ width: "100%" }}>
              
              {/* Header */}
              <Space
                style={{
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Space>
                  <ApartmentOutlined />
                  <Text strong>
                    {index + 1}. {cls.name}
                  </Text>
                </Space>
              </Space>

              {/* Sections */}
              <div>
                <Text strong>Sections:</Text>
                <br />
                <Space wrap>
                  {cls.sections?.length ? (
                    cls.sections.map((sec) => (
                      <Tag key={sec._id} color="blue">
                        {sec.name}
                      </Tag>
                    ))
                  ) : (
                    <Text type="secondary">—</Text>
                  )}
                </Space>
              </div>

              {/* Subjects (Section Wise) */}
              <div>
                <Text strong>Subjects:</Text>
                <br />
                {cls.sections?.length ? (
                  cls.sections.map((sec) => (
                    <div key={sec._id}>
                      <b>{sec.name}:</b>{" "}
                      {sec.subjects?.length
                        ? sec.subjects.map((s) => s.name).join(", ")
                        : "—"}
                    </div>
                  ))
                ) : (
                  <Text type="secondary">—</Text>
                )}
              </div>

              {/* Actions */}
              <Space>
                <Tooltip title="Edit">
                  <Button size="small" icon={<EditOutlined />} aria-label="Edit class" />
                </Tooltip>
                <Tooltip title="Delete">
                  <Button size="small" danger icon={<DeleteOutlined />} aria-label="Delete class" />
                </Tooltip>
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default MobileCards;