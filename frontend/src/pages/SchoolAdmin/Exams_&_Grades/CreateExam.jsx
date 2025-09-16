import React, { useState } from "react";

const CreateExam = () => {

  const [formData, setFormData] = useState({
    schoolId: "",
    title: "",
    classId: "",
    sectionId: "",
    subjectId: "",
    examType: "objective",
    startTime: "",
    endTime: "",
    durationMinutes: "",
    totalMarks: "",
    passingMarks: "",
    questionOrder: "random",
    shuffleOptions: true,
    settings: {
      negativeMarking: 0,
      allowPartialScoring: false,
      maxAttempts: 1,
    },
    questions: [],
    status: "draft",
  });

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, { questionId: "", marks: 0 }],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (parseInt(formData.passingMarks) > parseInt(formData.totalMarks)) {
      alert("⚠️ Passing marks cannot be greater than total marks!");
      return;
    }

    console.log("✅ Exam Data:", formData);
    alert("Exam saved successfully!");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white shadow-lg rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">📝 Create Exam</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Title */}
          <div>
            <label className="block font-medium mb-1">Exam Title</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
              placeholder="Enter exam title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Class / Section / Subject */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["classId", "sectionId", "subjectId"].map((field, i) => (
              <div key={i}>
                <label className="block font-medium mb-1 capitalize">
                  {field.replace("Id", "")}
                </label>
                <input
                  type="text"
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
                  placeholder={`${field.replace("Id", "")} ID`}
                  value={formData[field]}
                  onChange={(e) =>
                    setFormData({ ...formData, [field]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          {/* Exam Type */}
          <div>
            <label className="block font-medium mb-1">Exam Type</label>
            <select
              className="w-full border rounded-lg p-2"
              value={formData.examType}
              onChange={(e) =>
                setFormData({ ...formData, examType: e.target.value })
              }
            >
              <option value="objective">Objective</option>
              <option value="subjective">Subjective</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          {/* Timing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: "Start Time", key: "startTime", type: "datetime-local" },
              { label: "End Time", key: "endTime", type: "datetime-local" },
              { label: "Duration (Minutes)", key: "durationMinutes", type: "number", min: 1 },
            ].map(({ label, key, type, min }) => (
              <div key={key}>
                <label className="block font-medium mb-1">{label}</label>
                <input
                  type={type}
                  min={min}
                  className="w-full border rounded-lg p-2 focus:ring focus:ring-indigo-300"
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  required
                />
              </div>
            ))}
          </div>

          {/* Marks */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Marks", key: "totalMarks", min: 1 },
              { label: "Passing Marks", key: "passingMarks", min: 0 },
            ].map(({ label, key, min }) => (
              <div key={key}>
                <label className="block font-medium mb-1">{label}</label>
                <input
                  type="number"
                  min={min}
                  className="w-full border rounded-lg p-2"
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  required
                />
              </div>
            ))}
          </div>

          {/* Question Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Question Order</label>
              <select
                className="w-full border rounded-lg p-2"
                value={formData.questionOrder}
                onChange={(e) =>
                  setFormData({ ...formData, questionOrder: e.target.value })
                }
              >
                <option value="fixed">Fixed</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={formData.shuffleOptions}
                onChange={(e) =>
                  setFormData({ ...formData, shuffleOptions: e.target.checked })
                }
              />
              <span>Shuffle Options</span>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block font-medium mb-1">Negative Marking</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                value={formData.settings.negativeMarking}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      negativeMarking: e.target.value,
                    },
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                type="checkbox"
                checked={formData.settings.allowPartialScoring}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allowPartialScoring: e.target.checked,
                    },
                  })
                }
              />
              <span>Allow Partial Scoring</span>
            </div>
            <div>
              <label className="block font-medium mb-1">Max Attempts</label>
              <input
                type="number"
                className="w-full border rounded-lg p-2"
                value={formData.settings.maxAttempts}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      maxAttempts: e.target.value,
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="font-medium">Questions</label>
              <button
                type="button"
                onClick={addQuestion}
                className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
              >
                + Add Question
              </button>
            </div>
            {formData.questions.map((q, index) => (
              <div key={index} className="flex gap-4 mb-2">
                <input
                  type="text"
                  className="border rounded-lg p-2 w-2/3"
                  placeholder="Question ID"
                  value={q.questionId}
                  onChange={(e) => {
                    const updated = [...formData.questions];
                    updated[index].questionId = e.target.value;
                    setFormData({ ...formData, questions: updated });
                  }}
                />
                <input
                  type="number"
                  className="border rounded-lg p-2 w-1/3"
                  placeholder="Marks"
                  value={q.marks}
                  onChange={(e) => {
                    const updated = [...formData.questions];
                    updated[index].marks = e.target.value;
                    setFormData({ ...formData, questions: updated });
                  }}
                />
              </div>
            ))}
          </div>

          {/* Status */}
          <div>
            <label className="block font-medium mb-1">Status</label>
            <select
              className="w-full border rounded-lg p-2"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
          >
            Save Exam
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
