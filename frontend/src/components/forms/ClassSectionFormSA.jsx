import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createClass, updateClass } from "../../features/classSlice.js";
import { fetchSection } from "../../features/sectionSlice.js";
import { fetchAllSubjects } from "../../features/subjectSlice.js";
import { fetchAllUser } from "../../features/authSlice.js";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { Trash2 } from "lucide-react";

const ClassFormSA = ({ onSuccess, initialData, onClose }) => {
  const dispatch = useDispatch();

  const { sectionList = [] } = useSelector((state) => state.section || {});
  const { subjectList = [] } = useSelector((state) => state.subject || {});
  const { users = [], user } = useSelector((state) => state.auth || {});
  const { activeYear } = useSelector((state) => state.academicYear || {});
  const schoolId = user?.school?._id || null;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    academicYearId: "",
    teacherId: "",
    isGlobal: false,
    isActive: true,
    sections: [{ sectionId: "", inChargeId: "" }],
    subjects: [{ subjectId: "", teacherId: "", periodPerWeek: 0, isCompulsory: true }],
  });

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchSection({ schoolId }));
      dispatch(fetchAllSubjects({ schoolId }));
      dispatch(fetchAllUser({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        code: initialData.code || "",
        description: initialData.description || "",
        academicYearId: initialData.academicYearId?._id || "",
        teacherId: initialData.teacherId?._id || "",
        isGlobal: initialData.isGlobal || false,
        isActive: initialData.isActive || true,
        sections:
          initialData.sections?.map((s) => ({
            sectionId: s.sectionId?._id,
            inChargeId: s.inChargeId?._id,
          })) || [{ sectionId: "", inChargeId: "" }],
        subjects:
          initialData.subjects?.map((s) => ({
            subjectId: s.subjectId?._id,
            teacherId: s.teacherId?._id,
            periodPerWeek: s.periodPerWeek || 0,
            isCompulsory: s.isCompulsory ?? true,
          })) || [{ subjectId: "", teacherId: "", periodPerWeek: 0, isCompulsory: true }],
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleArrayChange = (type, index, field, value) => {
    const updated = [...formData[type]];
    updated[index][field] = value;
    setFormData({ ...formData, [type]: updated });
  };

  const addArrayItem = (type, itemTemplate) => {
    setFormData({ ...formData, [type]: [...formData[type], itemTemplate] });
  };

  const removeArrayItem = (type, index) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData) {
        await dispatch(updateClass({ id: initialData._id, data: { ...formData, schoolId } })).unwrap();
      } else {
        await dispatch(createClass({ ...formData, schoolId })).unwrap();
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error("Error saving class:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-sm">
      <h3 className="text-lg font-semibold mb-2">
        {initialData ? "Edit Class" : "Create Class"}
      </h3>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500">Class Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Academic Year & Teacher */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500">Academic Year</label>
          <select
            name="academicYearId"
            value={formData.academicYearId}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          >
            <option value="">Select Academic Year</option>
            {activeYear && <option value={activeYear._id}>{activeYear.name}</option>}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500">Class Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            required
            className="w-full border rounded px-2 py-1"
          >
            <option value="">Select Teacher</option>
            {users
              .filter((u) => u.role?.name === "Teacher")
              .map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Sections */}
      <div>
        <label className="block text-xs text-gray-500">Sections</label>
        {formData.sections.map((sec, idx) => (
          <div key={idx} className="flex items-center gap-2 my-1">
            <select
              value={sec.sectionId}
              onChange={(e) => handleArrayChange("sections", idx, "sectionId", e.target.value)}
              className="w-1/2 border rounded px-2 py-1"
            >
              <option value="">Select Section</option>
              {sectionList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={sec.inChargeId}
              onChange={(e) => handleArrayChange("sections", idx, "inChargeId", e.target.value)}
              className="w-1/2 border rounded px-2 py-1"
            >
              <option value="">Select In-Charge</option>
              {users
                .filter((u) => u.role?.name === "Teacher")
                .map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
            </select>
            {idx > 0 && (
              <button type="button" onClick={() => removeArrayItem("sections", idx)}>
                <Trash2 size={16} className="text-red-500" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-blue-600 text-xs mt-1"
          onClick={() =>
            addArrayItem("sections", { sectionId: "", inChargeId: "" })
          }
        >
          + Add Section
        </button>
      </div>

      {/* Subjects */}
      <div>
        <label className="block text-xs text-gray-500">Subjects</label>
        {formData.subjects.map((sub, idx) => (
          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 my-1 items-center">
            <select
              value={sub.subjectId}
              onChange={(e) => handleArrayChange("subjects", idx, "subjectId", e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select Subject</option>
              {subjectList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={sub.teacherId}
              onChange={(e) => handleArrayChange("subjects", idx, "teacherId", e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select Teacher</option>
              {users
                .filter((u) => u.role?.name === "Teacher")
                .map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
            </select>
            <input
              type="number"
              placeholder="Periods"
              value={sub.periodPerWeek}
              onChange={(e) =>
                handleArrayChange("subjects", idx, "periodPerWeek", e.target.value)
              }
              className="border rounded px-2 py-1"
            />
            <label className="flex items-center text-xs gap-1">
              <input
                type="checkbox"
                checked={sub.isCompulsory}
                onChange={(e) =>
                  handleArrayChange("subjects", idx, "isCompulsory", e.target.checked)
                }
              />
              Compulsory
            </label>
            {idx > 0 && (
              <button
                type="button"
                onClick={() => removeArrayItem("subjects", idx)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-blue-600 text-xs mt-1"
          onClick={() =>
            addArrayItem("subjects", {
              subjectId: "",
              teacherId: "",
              periodPerWeek: 0,
              isCompulsory: true,
            })
          }
        >
          + Add Subject
        </button>
      </div>

      {/* Toggles */}
      <div className="flex gap-4 mt-2">
        <label className="flex items-center text-xs gap-1">
          <input
            type="checkbox"
            name="isGlobal"
            checked={formData.isGlobal}
            onChange={handleChange}
          />
          Global
        </label>
        <label className="flex items-center text-xs gap-1">
          <input
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
          />
          Active
        </label>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-2 rounded text-sm"
        >
          {initialData ? "Update Class" : "Create Class"}
        </button>
      </div>
    </form>
  );
};

export default ClassFormSA;
