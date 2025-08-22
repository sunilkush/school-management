import React from "react";

const QuestionCard = ({ question, index, onAnswerChange, userAnswer }) => {
  return (
    <div className="p-4 border rounded-lg shadow mb-4 bg-white">
      <h3 className="font-semibold text-lg mb-2">
        Q{index + 1}. {question.text}
      </h3>

      {/* Render options if MCQ */}
      {question.type === "mcq" &&
        question.options?.map((opt, i) => (
          <label
            key={i}
            className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-100"
          >
            <input
              type="radio"
              name={`q-${question._id}`}
              value={opt}
              checked={userAnswer === opt}
              onChange={() => onAnswerChange(question._id, opt)}
            />
            <span>{opt}</span>
          </label>
        ))}

      {/* Subjective answer */}
      {question.type === "subjective" && (
        <textarea
          className="w-full p-2 border rounded mt-2"
          rows={4}
          placeholder="Write your answer..."
          value={userAnswer || ""}
          onChange={(e) => onAnswerChange(question._id, e.target.value)}
        />
      )}
    </div>
  );
};

export default QuestionCard;
