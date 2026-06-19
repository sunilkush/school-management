import React, { useEffect, useState } from "react";
import { Card, Typography, Space, Tag } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ExamTimer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isWarning = timeLeft <= 60;

  return (
    <div
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <Card
        size="small"
        bordered={false}
        style={{
          background: isWarning ? "#fff1f0" : "rgba(184,224,210,0.15)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
        }}
      >
        <Space>
          <ClockCircleOutlined
            style={{ color: isWarning ? "#D96B7A" : "#5BA89A" }}
          />
          <Text strong style={{ color: isWarning ? "#D96B7A" : "#389e0d" }}>
            Time Left:
          </Text>
          <Tag color={isWarning ? "red" : "green"}>
            {formatTime(timeLeft)}
          </Tag>
        </Space>
      </Card>
    </div>
  );
};

export default ExamTimer;
