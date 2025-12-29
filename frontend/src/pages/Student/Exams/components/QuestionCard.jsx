import React from "react";
import { Card, Radio, Input, Typography, Space } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;

const QuestionCard = ({ question, index, onAnswerChange, userAnswer }) => {
  return (
    <Card
      style={{ marginBottom: 16 }}
      bordered
    >
      <Title level={5} style={{ marginBottom: 12 }}>
        Q{index + 1}. {question.text}
      </Title>

      {/* MCQ */}
      {question.type === "mcq" && (
        <Radio.Group
          value={userAnswer}
          onChange={(e) =>
            onAnswerChange(question._id, e.target.value)
          }
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {question.options?.map((opt, i) => (
              <Radio
                key={i}
                value={opt}
                style={{
                  padding: 8,
                  border: "1px solid #f0f0f0",
                  borderRadius: 6,
                }}
              >
                {opt}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}

      {/* Subjective */}
      {question.type === "subjective" && (
        <TextArea
          rows={4}
          placeholder="Write your answer..."
          value={userAnswer || ""}
          onChange={(e) =>
            onAnswerChange(question._id, e.target.value)
          }
        />
      )}
    </Card>
  );
};

export default QuestionCard;
