import React from "react";
import { Card, Typography, List, Tag, Divider, Spin, Empty } from "antd";

const { Title, Text } = Typography;

const AttemptReview = ({ attempt }) => {
  // ✅ Guard clause
  if (!attempt) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>📊 Attempt Review</Title>

      <Card style={{ marginBottom: 16 }}>
        <Text strong>Exam:</Text> {attempt.examTitle || "N/A"}
        <br />
        <Text strong>Score:</Text> {attempt.score ?? 0}
        <br />
        <Text strong>Status:</Text>{" "}
        <Tag color={attempt.status === "Passed" ? "green" : "red"}>
          {attempt.status || "Pending"}
        </Tag>
      </Card>

      <Divider orientation="left">Question-wise Review</Divider>

      {attempt.answers?.length ? (
        <List
          dataSource={attempt.answers}
          renderItem={(ans, index) => (
            <List.Item>
              <Card style={{ width: "100%" }}>
                <Text strong>
                  Q{index + 1}: {ans.question}
                </Text>
                <br />
                <Text>Answer: {ans.answer || "-"}</Text>
                <br />
                <Text>Marks: {ans.marks ?? 0}</Text>
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No answers found" />
      )}
    </div>
  );
};

export default AttemptReview;
