import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getQuestions, deleteQuestion } from "../../../features/questionSlice";
import CreateQuestion from "./CreateQuestion";
import BulkUploadQuestions from "./BulkUploadQuestions";
import { Plus, Trash2 } from "lucide-react";

const QuestionBank = () => {
  const dispatch = useDispatch();
  const { questions = [], loading } = useSelector((s) => s.questions);

  const [modalType, setModalType] = useState(null); // single | bulk | null
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    dispatch(getQuestions());
  }, [dispatch]);

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this question?")) {
      return;
    }
    setDeletingId(id);
    dispatch(deleteQuestion(id)).finally(() => setDeletingId(null));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 🔹 Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Question Bank
          </h2>
          <p className="text-sm text-gray-500">
            Manage, create and organize all questions
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setModalType("single")}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Add Question
          </button>

          <button
            onClick={() => setModalType("bulk")}
            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
          >
            <Plus size={16} /> Bulk Upload
          </button>
        </div>
      </div>

      {/* 🔹 Loading State */}
      {loading && (
        <p className="text-center text-gray-500 py-10">
          Loading questions...
        </p>
      )}

      {/* 🔹 Empty State */}
      {!loading && questions.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500 mb-3">
            No questions found
          </p>
          <button
            onClick={() => setModalType("single")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add First Question
          </button>
        </div>
      )}

      {/* 🔹 Question List */}
      <div className="grid gap-4">
        {questions.map((q) => (
          <div
            key={q._id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition flex justify-between items-start"
          >
            <div>
              <p className="font-medium text-gray-800">
                {q.statement}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {q.questionType} • Difficulty: {q.difficulty}
              </p>
            </div>

            <button
              onClick={() => handleDelete(q._id)}
              disabled={deletingId === q._id}
              className="text-red-600 hover:text-red-800 disabled:opacity-50"
              title="Delete Question"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* 🔹 Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg relative h-[85vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setModalType(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✖
            </button>

            <div className="p-5">
              {modalType === "single" && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    Create New Question
                  </h3>
                  <CreateQuestion onClose={() => setModalType(null)} />
                </>
              )}

              {modalType === "bulk" && (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    Bulk Upload Questions
                  </h3>
                  <BulkUploadQuestions onClose={() => setModalType(null)} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
