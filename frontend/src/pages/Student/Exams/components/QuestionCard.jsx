import React from "react";
import { Card, Radio, Checkbox, Input, Typography, Space, Tag } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;

const getOptionValue = (option, index) => {
  if (typeof option === "string") return option;
  if (typeof option === "object") return option?.value || option?.text || option?.label || `${index + 1}`;
  return `${index + 1}`;
};

const getOptionLabel = (option, index) => {
  if (typeof option === "string") return option;
  if (typeof option === "object") return option?.label || option?.text || option?.value || `Option ${index + 1}`;
  return `Option ${index + 1}`;
};

const getNormalizedOptions = (type, options) => {
  if (Array.isArray(options) && options.length) return options;
  if (type === "true_false") return ["true", "false"];
  return [];
};

const QuestionCard = ({ question, index, onAnswerChange, userAnswer }) => {
  const type = question?.type;
  const options = getNormalizedOptions(type, question?.options);

  return (
    <Card style={{ marginBottom: 12 }} bordered>
      <Space direction="vertical" style={{ width: "100%" }} size={10}>
        <Space>
          <Tag color="blue">Q{index + 1}</Tag>
          <Tag color="purple">{type || "subjective"}</Tag>
          <Tag>{question?.marks ?? 0} marks</Tag>
        </Space>

        <Title level={5} style={{ marginBottom: 0 }}>{question.text}</Title>

        {["mcq", "mcq_single", "true_false"].includes(type) && (
          <Radio.Group value={userAnswer} onChange={(e) => onAnswerChange(question._id, e.target.value)}>
            <Space direction="vertical" style={{ width: "100%" }}>
              {options.map((opt, i) => {
                const value = getOptionValue(opt, i);
                return (
                  <Radio key={value} value={value} style={{ padding: 8, border: "1px solid #f0f0f0", borderRadius: 6 }}>
                    {getOptionLabel(opt, i)}
                  </Radio>
                );
              })}
            </Space>
          </Radio.Group>
        )}

        {type === "mcq_multi" && (
          <Checkbox.Group
            value={Array.isArray(userAnswer) ? userAnswer : []}
            onChange={(vals) => onAnswerChange(question._id, vals)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {(question.options || []).map((opt, i) => {
                const value = getOptionValue(opt, i);
                return (
                  <Checkbox key={value} value={value}>
                    {getOptionLabel(opt, i)}
                  </Checkbox>
                );
              })}
            </Space>
          </Checkbox.Group>
        )}

        {["subjective", "short_answer", "long_answer"].includes(type) && (
          <TextArea
            rows={4}
            placeholder="Write your answer..."
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(question._id, e.target.value)}
          />
        )}

        {type === "fill_blank" && (
          <Input
            placeholder="Type your answer"
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(question._id, e.target.value)}
          />
        )}

        {type === "match" && (
          <TextArea
            rows={4}
            placeholder="Write matching pairs (e.g., A-1, B-2)"
            value={userAnswer || ""}
            onChange={(e) => onAnswerChange(question._id, e.target.value)}
          />
        )}

        {!type && <Text type="secondary">Answer type unavailable for this question.</Text>}
        {type && !["mcq", "mcq_single", "mcq_multi", "true_false", "subjective", "short_answer", "long_answer", "fill_blank", "match"].includes(type) && (
          <Text type="secondary">This question type is not fully supported yet. Please provide answer in text format.</Text>
        )}
      </Space>
    </Card>
  );
};

export default QuestionCard;
