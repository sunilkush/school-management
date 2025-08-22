import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getQuestions } from "../features/questions/questionSlice";
import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";

const QuestionBank = () => {
  const dispatch = useDispatch();
  const { questions, loading } = useSelector((s) => s.questions);

  const [modalType, setModalType] = useState(null); // "single", "bulk", or null

  useEffect(() => {
    dispatch(getQuestions());
  }, [dispatch]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">📚 Question Bank</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setModalType("single")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
          >
            ➕ Add Question
          </button>
          <button
            onClick={() => setModalType("bulk")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
          >
            ➕ Bulk Questions
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}

      <ul className="space-y-2">
        {questions?.map((q) => (
          <li
            key={q._id}
            className="p-4 border rounded shadow-sm bg-white hover:shadow-md"
          >
            <p className="font-medium">{q.statement}</p>
            <span className="text-sm text-gray-500">
              {q.questionType} • {q.difficulty}
            </span>
          </li>
        ))}
      </ul>

      {/* Modal Popup */}
      {modalType && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg p-3 relative overflow-auto h-4/5">
            {/* Close Button */}
            <button
              onClick={() => setModalType(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✖
            </button>

            {/* Render correct form */}
            {modalType === "single" && (
              <>
                <h3 className="text-xl font-semibold mb-4">Create New Question</h3>
                <CreateQuestion onClose={() => setModalType(null)} />
              </>
            )}

            {modalType === "bulk" && (
              <>
                <h3 className="text-xl font-semibold mb-4">Bulk Create Questions</h3>
                <BulkUploadQuestions onClose={() => setModalType(null)} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
