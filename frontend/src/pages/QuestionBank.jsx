import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getQuestions } from "../features/questions/questionSlice";

const QuestionBank = () => {
  const dispatch = useDispatch();
  const { questions, loading } = useSelector((s) => s.questions);

  useEffect(() => {
    dispatch(getQuestions());
  }, [dispatch]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">📚 Question Bank</h2>
      {loading && <p>Loading...</p>}
      <ul className="space-y-2">
        {questions?.map((q) => (
          <li key={q._id} className="p-4 border rounded shadow-sm bg-white">
            {q.text} ({q.type})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QuestionBank;
