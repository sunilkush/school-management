import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSubject } from "../../features/subject/subjectSlice";
import { fetchAllClasses } from "../../features/classes/classSlice";
import { fetchAllUser } from "../../features/auth/authSlice"; 
import { Button } from "@/components/ui/button";

const SubjectForm = () => {
  const dispatch = useDispatch();

  const { classList = [] } = useSelector((state) => state.class);
  const { users = [], user } = useSelector((state) => state.auth); 
  const { loading, successMessage, error } = useSelector((state) => state.subject);

  // ✅ Parse academicYear from localStorage
  const storedAcademicYear = localStorage.getItem("academicYear");
  const academicYear = storedAcademicYear ? JSON.parse(storedAcademicYear) : null;
  const SubjectList = ["English", "Science", "History", "Geography", "Art", "Physical Education",
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
        "Forensic Science", "Criminology", "Social Work"]
  const [formData, setFormData] = useState({
    name: "",
    classId: "",
    teacherId: "",
    schoolId: user?.school?._id || "",
    academicYearId: academicYear?._id || "",
  });

  useEffect(() => {
    dispatch(fetchAllClasses());
    dispatch(fetchAllUser()); 
  }, [dispatch]);

  // ✅ Filter only teachers
  const teachers = users?.filter((u) => u.role?.name?.toLowerCase() === "teacher");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createSubject(formData));
  };

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded-2xl">
      <h2 className="text-xl font-bold mb-4">Create Subject</h2>

      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      {successMessage && <p className="text-green-500 text-sm mb-2">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Subject Name</label>
         <select  name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required>
           <option>Select Subject</option>
           {SubjectList.map((item)=>
           <option key={item}>{item}</option>
          )}
         </select>
        </div>

        {/* Select Class */}
        <div>
          <label className="block text-sm font-medium mb-1">Class</label>
          <select
            name="classId"
            value={formData.classId}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">Select Class</option>
            {Array.isArray(classList) &&
              classList.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} - {cls.section}
                </option>
              ))}
          </select>
        </div>

        {/* Select Teacher */}
        <div>
          <label className="block text-sm font-medium mb-1">Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            required
          >
            <option value="">Select Teacher</option>
            {teachers?.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Subject"}
        </Button>
      </form>
    </div>
  );
};

export default SubjectForm;
