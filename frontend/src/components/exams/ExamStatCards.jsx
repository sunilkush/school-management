import React from "react";
import { Card, Col, Row, Statistic } from "antd";

const ExamStatCards = ({ items = [] }) => {
  return (
    <Row gutter={[12, 12]}>
      {items.map((item) => (
        <Col key={item.key || item.title} xs={24} sm={12} lg={6}>
          <Card size="small" style={{ borderRadius: 12 }}>
            <Statistic
              title={item.title}
              value={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              valueStyle={item.valueStyle}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ExamStatCards;
