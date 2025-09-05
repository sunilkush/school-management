import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSection } from "../../features/sections/sectionSlice";

const SectionForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(state => state.sections || {});
  const [name, setName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createSection({ name })).unwrap();
      onSuccess?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-xs font-semibold">Section Name</label>
      <select
        className="w-full border rounded px-2 py-1"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      >
        <option value="">Select Section</option>
        {["A","B","C","D","E"].map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">{loading ? "Saving..." : "Next"}</button>
    </form>
  );
};

export default SectionForm;
