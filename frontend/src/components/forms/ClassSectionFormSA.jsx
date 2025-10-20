import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../features/classSlice";
import { fetchSection } from "../../features/sectionSlice";
import { createClassSection } from "../../features/classSectionSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchAllSubjects } from "../../features/subjectSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";
import { Trash, Trash2 } from "lucide-react";

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
      dispatch(fetchSection({schoolId}));
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
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3>Create Class</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Class */}
        <div>
          <label className="block text-xs  text-gray-500">Class</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            required
          >
            <option value="">Select Class</option>
            {classList.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
            {console.log(classList)}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className="block text-xs  text-gray-500">Section</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
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
          <label className="block text-xs  text-gray-500">Academic Year</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
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
          <label className="block text-xs  text-gray-500">Class Teacher</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
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
      <div className="my-4">
        {subjectMappings.map((mapping, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end space-y-2 mb-2">
            <div>
              <label className="block text-xs  text-gray-500">Subject</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
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
              <label className="block text-xs  text-gray-500" >Teacher</label>
              <select
                className="w-full border rounded px-2 py-1 text-sm"
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

            <div className="w-50">
              {index > 0 && (
                <button
                  type="button"
                
                  onClick={() => handleRemoveMapping(index)}
                >
                  <Trash2 className="text-red-500"/>               </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className=" text-blue-600 text-xs"
          onClick={handleAddMapping}
        >
          + Add Subject
        </button>
       
      </div>
        <button
        type="submit"
        className="bg-blue-600 text-white px-3 py-2 rounded  text-sm float-end"
      >
        Map Class & Section
      </button>
     
    </form>
  );
};

export default ClassSectionForm;
