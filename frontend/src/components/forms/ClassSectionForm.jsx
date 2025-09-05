import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../features/classes/classSlice";
import { fetchSection } from "../../features/sections/sectionSlice";
import { createClassSection } from "../../features/classes/classSectionSlice";

const ClassSectionForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { classList = [] } = useSelector(state => state.class || {});
  const { sectionList = [] } = useSelector(state => state.sections || {});
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  useEffect(() => {
    dispatch(fetchAllClasses());
    dispatch(fetchSection());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createClassSection({ classId, sectionId })).unwrap();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-xs font-semibold">Class</label>
      <select
        className="w-full border rounded px-2 py-1"
        value={classId}
        onChange={(e) => setClassId(e.target.value)}
        required
      >
        <option value="">Select Class</option>
        {classList.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
      </select>

      <label className="block text-xs font-semibold">Section</label>
      <select
        className="w-full border rounded px-2 py-1"
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
        required
      >
        <option value="">Select Section</option>
        {sectionList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
      </select>

      <button type="submit" className="bg-purple-600 text-white px-3 py-1 rounded">Map Class & Section</button>
    </form>
  );
};

export default ClassSectionForm;
