import React from "react";
import { Breadcrumb, Space, Typography } from "antd";

const { Title, Text } = Typography;

const ExamPageHeader = ({
  title,
  subtitle,
  breadcrumbItems = [],
  actions,
}) => {
  return (
    <Space
      direction="vertical"
      size={10}
      style={{ width: "100%" }}
    >
      {breadcrumbItems.length ? <Breadcrumb items={breadcrumbItems} /> : null}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Space direction="vertical" size={2}>
          <Title level={3} style={{ margin: 0 }}>
            {title}
          </Title>
          {subtitle ? <Text type="secondary">{subtitle}</Text> : null}
        </Space>

        {actions ? <Space wrap>{actions}</Space> : null}
      </div>
    </Space>
  );
};

export default ExamPageHeader;
