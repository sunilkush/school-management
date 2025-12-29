import React, { useState } from "react";
import { Layout, Typography, Button, Space, Affix, Card } from "antd";

import QuestionCard from "./components/QuestionCard";
import ExamTimer from "./components/ExamTimer";
import AutosaveIndicator from "./components/AutosaveIndicator";

const { Content } = Layout;
const { Title } = Typography;

const ExamLive = ({ questions, duration }) => {
  const [answers, setAnswers] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState("idle");

  const handleAnswerChange = (qid, answer) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }));
    setAutosaveStatus("saving");

    // simulate autosave
    setTimeout(() => setAutosaveStatus("saved"), 1000);
  };

  const handleSubmit = () => {
    console.log("Submitted:", answers);
  };

  return (
    <Layout>
      {/* Timer Fixed Top Right */}
      <Affix offsetTop={16} style={{ position: "absolute", right: 24 }}>
        <ExamTimer
          duration={duration * 60}
          onTimeUp={handleSubmit}
        />
      </Affix>

      <Content style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <Title level={3}>🚀 Exam Live</Title>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          {questions?.map((q, i) => (
            <QuestionCard
              key={q._id}
              index={i}
              question={q}
              userAnswer={answers[q._id]}
              onAnswerChange={handleAnswerChange}
            />
          ))}

          <Card>
            <AutosaveIndicator status={autosaveStatus} />
          </Card>

          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            block
          >
            Submit Exam
          </Button>
        </Space>
      </Content>
    </Layout>
  );
};

export default ExamLive;
