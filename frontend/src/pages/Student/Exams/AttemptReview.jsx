import React from "react";

const AttemptReview = ({ attempt }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📊 Attempt Review</h2>
      <p>Exam: {attempt.examTitle}</p>
      <p>Score: {attempt.score}</p>
      <p>Status: {attempt.status}</p>
      <div className="mt-4 space-y-4">
        {attempt.answers?.map((ans, i) => (
          <div key={i} className="p-4 border rounded bg-white">
            <p className="font-semibold">
              Q{i + 1}: {ans.question}
            </p>
            <p>Answer: {ans.answer}</p>
            <p>Marks: {ans.marks}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttemptReview;
