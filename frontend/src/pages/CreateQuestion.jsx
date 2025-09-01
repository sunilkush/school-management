import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllSubjects } from "../features/subject/subjectSlice";
import { createQuestion } from "../features/questions/questionSlice"
import { fetchAllClasses } from "../features/classes/classSlice";
const CreateQuestion = () => {
  const dispatch = useDispatch();
  const { subjectList } = useSelector((state) => state.subject)
  const { classList } = useSelector((state) => state.class)
  console.log(subjectList)
  useEffect(() => {
    dispatch(fetchAllSubjects())
    dispatch(fetchAllClasses())
  }, [dispatch])
  const user = JSON.parse(localStorage.getItem("user"));
  const SchoolId = user?.school?._id


  const [formData, setFormData] = useState({
    schoolId: SchoolId,
    classId: "",
    subjectId: "",
    chapter: "",
    topic: "",
    questionType: "mcq_single",
    statement: "",
    options: [],
    correctAnswers: [],
    difficulty: "medium",
    marks: 1,
    negativeMarks: 0,
    tags: "",
    isActive: true,
  });

  // Add option for MCQ/Match
  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { key: "", text: "" }],
    }));
  };

  // Add correct answer
  const addCorrectAnswer = () => {
    setFormData((prev) => ({
      ...prev,
      correctAnswers: [...prev.correctAnswers, ""],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createQuestion({
      ...formData,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim().toLowerCase())
        : []
    }));
  };

  return (
    <div className="max-w-4xl mx-auto ">
      <div className="">


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* School / Subject */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

            <div>
              <label className="block font-medium mb-1">Class
              </label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.classId}
                onChange={(e) =>
                  setFormData({ ...formData, classId: e.target.value })
                }
                required
              >
                <option value="">Select Class</option>
                {classList.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

            <div>
              <label className="block font-medium mb-1">Subject</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.subjectId}
                onChange={(e) =>
                  setFormData({ ...formData, subjectId: e.target.value })
                }
                required
              >
                <option value="">Select Subject</option>
                {subjectList.map((subj) => (
                  <option key={subj._id} value={subj._id}>
                    {subj.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Chapter & Topic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Chapter</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={formData.chapter}
                onChange={(e) =>
                  setFormData({ ...formData, chapter: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Topic</label>
              <input
                type="text"
                className="w-full border rounded-lg p-2"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
              />
            </div>
          </div>

          {/* Question Type */}
          <div>
            <label className="block font-medium mb-1">Question Type</label>
            <select
              className="w-full border rounded-lg p-2"
              value={formData.questionType}
              onChange={(e) =>
                setFormData({ ...formData, questionType: e.target.value, options: [], correctAnswers: [] })
              }
            >
              <option value="mcq_single">MCQ (Single Answer)</option>
              <option value="mcq_multi">MCQ (Multiple Answer)</option>
              <option value="true_false">True / False</option>
              <option value="fill_blank">Fill in the Blank</option>
              <option value="match">Match the Following</option>
            </select>
          </div>

          {/* Statement */}
          <div>
            <label className="block font-medium mb-1">Question Statement</label>
            <textarea
              className="w-full border rounded-lg p-2"
              rows="3"
              value={formData.statement}
              onChange={(e) =>
                setFormData({ ...formData, statement: e.target.value })
              }
              required
            />
          </div>

          {/* Dynamic Options for MCQ / Match */}
          {(formData.questionType === "mcq_single" ||
            formData.questionType === "mcq_multi" ||
            formData.questionType === "match") && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium">Options</label>
                  <button
                    type="button"
                    onClick={addOption}
                    className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                  >
                    + Add Option
                  </button>
                </div>
                {formData.options.map((opt, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      className="border p-2 rounded-lg w-1/4"
                      placeholder="Key"
                      value={opt.key}
                      onChange={(e) => {
                        const updated = [...formData.options];
                        updated[index].key = e.target.value;
                        setFormData({ ...formData, options: updated });
                      }}
                    />
                    <input
                      type="text"
                      className="border p-2 rounded-lg w-3/4"
                      placeholder="Option Text"
                      value={opt.text}
                      onChange={(e) => {
                        const updated = [...formData.options];
                        updated[index].text = e.target.value;
                        setFormData({ ...formData, options: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

          {/* Correct Answers */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-medium">Correct Answers</label>
              <button
                type="button"
                onClick={addCorrectAnswer}
                className="bg-green-500 text-white px-3 py-1 rounded-lg"
              >
                + Add Answer
              </button>
            </div>
            {formData.correctAnswers.map((ans, index) => (
              <input
                key={index}
                type="text"
                className="border p-2 rounded-lg w-full mb-2"
                placeholder="Correct Answer"
                value={ans}
                onChange={(e) => {
                  const updated = [...formData.correctAnswers];
                  updated[index] = e.target.value;
                  setFormData({ ...formData, correctAnswers: updated });
                }}
              />
            ))}
          </div>

          {/* Difficulty / Marks */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Difficulty</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.difficulty}
                onChange={(e) =>
                  setFormData({ ...formData, difficulty: e.target.value })
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Marks</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                value={formData.marks}
                onChange={(e) =>
                  setFormData({ ...formData, marks: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Negative Marks</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                value={formData.negativeMarks}
                onChange={(e) =>
                  setFormData({ ...formData, negativeMarks: e.target.value })
                }
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <span>Active</span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
          >
            Save Question
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestion;
