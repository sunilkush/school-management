import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSubject } from "../../features/subject/subjectSlice";
import { fetchAllUser } from "../../features/auth/authSlice"; 
import { Button } from "@/components/ui/button";

const SubjectForm = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();

  const { users = [], user } = useSelector((state) => state.auth); 
  const { loading, successMessage, error } = useSelector((state) => state.subject);
  const schoolId = user?.school?._id;
  const {activeYear} = useSelector((state)=>state.academicYear)
 

  const SubjectList = [
    "English", "Science", "History", "Geography", "Art", "Physical Education",
    "Computer Science", "Music", "Economics", "Psychology", "Sociology",
    "Political Science", "Philosophy", "Biology", "Chemistry", "Physics",
    "Literature", "Business Studies", "Accounting", "Statistics",
    "Environmental Science", "Health Education", "Foreign Language", "Drama",
    "Dance", "Media Studies", "Religious Studies", "Ethics", "Law",
    "Engineering", "Architecture", "Astronomy", "Geology", "Anthropology",
    "Linguistics", "Mathematics", "Information Technology", "Robotics",
    "Artificial Intelligence", "Cybersecurity", "Data Science",
    "Machine Learning", "Web Development", "Graphic Design", "Game Development",
    "Network Administration", "Cloud Computing", "Mobile App Development",
    "Digital Marketing", "Project Management", "Supply Chain Management",
    "Human Resource Management", "Finance", "Investment", "Marketing",
    "Public Relations", "Event Management", "Tourism Management",
    "Hospitality Management", "Culinary Arts", "Fashion Design",
    "Interior Design", "Product Design", "Industrial Design", "Textile Design",
    "Jewelry Design", "Graphic Arts", "Photography", "Film Studies",
    "Animation", "Visual Effects", "Sound Engineering", "Music Production",
    "Theater Arts", "Dance Performance", "Choreography", "Creative Writing",
    "Journalism", "Broadcasting", "Public Speaking", "Debate",
    "Forensic Science", "Criminology", "Social Work"
  ];

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "",
    teacherId: "",
    schoolId: schoolId || "",
    academicYearId: activeYear?._id || "",
  });

  useEffect(() => {
    
    dispatch(fetchAllUser({schoolId})); 
  }, [dispatch,schoolId]);

  // Filter only teachers
  const teachers = users?.filter((u) => u.role?.name?.toLowerCase() === "teacher");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createSubject(formData));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-lg w-full mx-2 bg-white shadow p-6 rounded-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>

        <h2 className="text-xl font-bold mb-4">Create Subject</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}

        <form onSubmit={handleSubmit} className=" grid grid-cols-2 gap-3">
          {/* Subject Name */}
          <div>
            <label className="block text-xs font-medium mb-1">Subject Name</label>
            <select
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-2 py-1 text-xs"
              required
            >
              <option value="">Select Subject</option>
              {SubjectList.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

       
         

          {/* Select Teacher */}
          <div>
            <label className="block text-xs font-medium mb-1">Teacher</label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="w-full border rounded-lg px-2 py-1 text-xs"
              required
            >
              <option value="">Select Teacher</option>
              {teachers?.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select Category</option>
              {["Core", "Elective", "Language", "Practical", "Optional"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
              required
            >
              <option value="">Select Type</option>
              {["Theory", "Practical", "Both"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Subject"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubjectForm;
