import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../features/classes/classSlice";
import { fetchSection } from "../../features/sections/sectionSlice";
import { createClassSection } from "../../features/classes/classSectionSlice";
import { fetchAllUser } from "../../features/auth/authSlice";
import { fetchAllSubjects } from "../../features/subject/subjectSlice";
import { fetchActiveAcademicYear } from "../../features/academicYear/academicYearSlice";

const ClassSectionForm = ({ onSuccess, initialData }) => {
  const dispatch = useDispatch();

  const { classList = [] } = useSelector((state) => state.class || {});
  const { sectionList = [] } = useSelector((state) => state.section || {});
  const { users = [], user } = useSelector((state) => state.auth || {});
  const { subjectList } = useSelector((state) => state.subject);
  const { activeYear } = useSelector((state) => state.academicYear || {});

  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [classTeacherId, setClassTeacherId] = useState("");
  const [subjectMappings, setSubjectMappings] = useState([{ subjectId: "", teacherId: "" }]);

  const schoolId = user?.school?._id || null;

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllClasses(schoolId));
      dispatch(fetchSection(schoolId));
      dispatch(fetchAllUser({ schoolId }));
      dispatch(fetchAllSubjects({ schoolId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  // ✅ prefill when editing
  useEffect(() => {
    if (initialData) {
      setClassId(initialData.classId?._id || "");
      setSectionId(initialData.sectionId?._id || "");
      setClassTeacherId(initialData.teacherId?._id || "");
      setAcademicYearId(initialData.academicYearId?._id || "");
      setSubjectMappings(
        initialData.subjects?.map((s) => ({
          subjectId: s.subjectId?._id,
          teacherId: s.teacherId?._id,
        })) || [{ subjectId: "", teacherId: "" }]
      );
    }
  }, [initialData]);

  const handleAddMapping = () => {
    setSubjectMappings([...subjectMappings, { subjectId: "", teacherId: "" }]);
  };

  const handleRemoveMapping = (index) => {
    setSubjectMappings(subjectMappings.filter((_, i) => i !== index));
  };

  const handleMappingChange = (index, field, value) => {
    const newMappings = [...subjectMappings];
    newMappings[index][field] = value;
    setSubjectMappings(newMappings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(
        createClassSection({
          classId,
          sectionId,
          academicYearId,
          teacherId: classTeacherId,
          subjects: subjectMappings,
          schoolId,
        })
      ).unwrap();

      // reset
      setClassId("");
      setSectionId("");
      setAcademicYearId("");
      setClassTeacherId("");
      setSubjectMappings([{ subjectId: "", teacherId: "" }]);

      onSuccess?.();
    } catch (err) {
      console.error("Error creating mapping:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class */}
        <div>
          <label className="block text-xs font-semibold">Class</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
          >
            <option value="">Select Class</option>
            {classList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block text-xs font-semibold">Section</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            required
          >
            <option value="">Select Section</option>
            {sectionList.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-xs font-semibold">Academic Year</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={academicYearId}
            onChange={(e) => setAcademicYearId(e.target.value)}
            required
          >
            <option value="">Select Academic Year</option>
            {activeYear && (
              <option key={activeYear._id} value={activeYear._id}>{activeYear.name}</option>
            )}
          </select>
        </div>

        {/* Class Teacher */}
        <div>
          <label className="block text-xs font-semibold">Class Teacher</label>
          <select
            className="w-full border rounded px-2 py-1"
            value={classTeacherId}
            onChange={(e) => setClassTeacherId(e.target.value)}
            required
          >
            <option value="">Select Teacher</option>
            {users
              .filter((u) => u.role.name === "Teacher")
              .map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Subject-Teacher mappings */}
      <div className="space-y-2 mt-4">
        {subjectMappings.map((mapping, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold">Subject</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={mapping.subjectId}
                onChange={(e) => handleMappingChange(index, "subjectId", e.target.value)}
                required
              >
                <option value="">Select Subject</option>
                {subjectList.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold">Teacher</label>
              <select
                className="w-full border rounded px-2 py-1"
                value={mapping.teacherId}
                onChange={(e) => handleMappingChange(index, "teacherId", e.target.value)}
                required
              >
                <option value="">Select Teacher</option>
                {users
                  .filter((u) => u.role.name === "Teacher")
                  .map((t) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
              </select>
            </div>

            <div>
              {index > 0 && (
                <button
                  type="button"
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleRemoveMapping(index)}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="bg-green-600 text-white px-3 py-1 rounded mt-2"
          onClick={handleAddMapping}
        >
          Add Subject
        </button>
      </div>

      <button
        type="submit"
        className="bg-purple-600 text-white px-3 py-1 rounded mt-4"
      >
        Map Class & Section
      </button>
    </form>
  );
};

export default ClassSectionForm;
