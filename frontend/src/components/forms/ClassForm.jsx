import { useState, useEffect } from "react";
import {  useDispatch, useSelector } from "react-redux";
import { createClass, updateClass} from "../../features/classSlice";

const ClassForm = ({ onClose, onSuccess, initialData }) => {
  const dispatch = useDispatch();
  const { loading} = useSelector((state)=>state.class)
  
  const [formData, setFormData] = useState({
    name: "",
    schoolId: "", // auto from user
    academicYearId: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ name: initialData.name || "", schoolId: initialData.schoolId, academicYearId: initialData.academicYearId });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (initialData?._id) {
        await dispatch(updateClass({ id: initialData._id, classData: formData })).unwrap();
      } else {
        await dispatch(createClass(formData)).unwrap();
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label>Class Name</label>
      <select
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full border rounded px-2 py-1 text-sm"
      >
        <option value="">Select Class</option>
        {["1st","2nd","3rd","4th","5th","6th","7th","8th","9th","10th","11th","12th"].map(cls => (
          <option key={cls} value={cls}>{cls}</option>
        ))}
      </select>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
        <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">{loading ? "Saving..." : initialData ? "Update" : "Create"}</button>
      </div>
    </form>
  );
};

export default ClassForm;
