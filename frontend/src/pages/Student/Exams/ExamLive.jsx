import React, { useState } from "react";
import QuestionCard from "./components/QuestionCard";
import ExamTimer from "./components/ExamTimer";
import AutosaveIndicator from "./components/AutosaveIndicator";

const ExamLive = ({ questions, duration }) => {
  const [answers, setAnswers] = useState({});
  const [autosaveStatus, setAutosaveStatus] = useState("idle");

  const handleAnswerChange = (qid, answer) => {
    setAnswers((prev) => ({ ...prev, [qid]: answer }));
    setAutosaveStatus("saving");
    setTimeout(() => setAutosaveStatus("saved"), 1000); // simulate autosave
  };

  const handleSubmit = () => {
    console.log("Submitted:", answers);
  };

  return (
    <div className="p-6">
      <ExamTimer duration={duration * 60} onTimeUp={handleSubmit} />
      <h2 className="text-2xl font-bold mb-4">🚀 Exam Live</h2>
      {questions?.map((q, i) => (
        <QuestionCard
          key={q._id}
          index={i}
          question={q}
          userAnswer={answers[q._id]}
          onAnswerChange={handleAnswerChange}
        />
      ))}
      <AutosaveIndicator status={autosaveStatus} />
      <button
        onClick={handleSubmit}
        className="px-4 py-2 bg-green-600 text-white rounded mt-4"
      >
        Submit Exam
      </button>
    </div>
  );
};

export default ExamLive;
