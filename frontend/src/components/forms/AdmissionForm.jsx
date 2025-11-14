import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLastRegisteredStudent, createStudent } from "../../features/studentSlice";
import { fetchAllClasses } from "../../features/classSlice"



const Tab = ({ label, isActive, onClick }) => (
  <button
    className={`px-4 py-2 rounded-t-md border-b-2 font-medium text-sm focus:outline-none transition-all duration-150 ${isActive
      ? "bg-white border-purple-600 text-blue-600"
      : "bg-gray-100 border-transparent text-gray-500 hover:text-blue-600"
      }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const AdmissionForm = () => {
  const [activeTab, setActiveTab] = useState("Student Info");
  const { lastStudent,registrationNumber } = useSelector((state) => state.students);
  console.log("Last Student in Admission Form:", lastStudent);
  const { user } = useSelector((state) => state.auth);
  const schoolId = user?.school?._id
  const { classList = [] } = useSelector((state) => state.class);
  const selectAcademicYear = localStorage.getItem("selectedAcademicYear");
  const academicYearObj = selectAcademicYear ? JSON.parse(selectAcademicYear) : null;
  const academicYearId = academicYearObj?._id || "";
  const [availableSections, setAvailableSections] = useState([]);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    studentName: "",
    email: "",
    password: "",
    role: "student",
    schoolId: schoolId || "",
    classId: "",
    sectionId: "",
    registrationNumber: "",
    admissionDate: new Date().toISOString().split("T")[0],
    feeDiscount: 0,
    mobileNumber: "",
    picture: null,
    academicYearId,
    dateOfBirth: "",
    birthFormId: "",
    orphan: "",
    gender: "",
    caste: "",
    isOSC: "",
    identificationMark: "",
    previousSchool: "",
    religion: "",
    bloodGroup: "",
    previousId: "",
    family: "",
    disease: "",
    notes: "",
    siblings: 0,
    address: "",

    fatherName: "",
    fatherNID: "",
    fatherOccupation: "",
    fatherEducation: "",
    fatherMobile: "",
    fatherProfession: "",
    fatherIncome: 0,

    motherName: "",
    motherNID: "",
    motherOccupation: "",
    motherEducation: "",
    motherMobile: "",
    motherProfession: "",
    motherIncome: 0,
  });

  useEffect(() => {
    if (schoolId && academicYearId) {
       dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId }));
    }
    if (schoolId) {
      dispatch(fetchAllClasses({ schoolId }));
    }
  }, [dispatch, schoolId, academicYearId]);

  useEffect(() => {
  if (registrationNumber) {
    setFormData((prev) => ({
      ...prev,
      registrationNumber,
       role: "student",
    }));
  }
}, [registrationNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ If class+section select changes
    if (name === "classId") {
      const [classId, sectionId] = value.split("|"); // split both IDs
      setFormData((prev) => ({
        ...prev,
        classId,
        sectionId,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value);
    });

    const studentData = Object.fromEntries(data);
    dispatch(createStudent(studentData));
    dispatch(fetchLastRegisteredStudent({ schoolId, academicYearId })); // get next reg no
  };

  const inputClass = "w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs";

  const labelClass = "block text-xs font-medium text-gray-700 mb-1";
  const tabList = ["Student Info", "Other Info", "Father Info", "Mother Info"];
  const tabFields = {
    "Student Info": ["studentName", "email", "password", "classId","sectionId", "admissionDate","mobileNumber"],
    "Other Info": ["dateOfBirth", "birthFormId", "gender", "religion"],
    "Father Info": ["fatherName", "fatherOccupation", "fatherMobile","motherMobile","fatherNationalId"],
    "Mother Info": ["motherName", "motherOccupation", "motherMobile","motherMobile","motherNationalId"],
  };
  const isTabValid = () => {
    const requiredFields = tabFields[activeTab] || [];
    return requiredFields.every((field) => {
      const value = formData[field];
      return value !== undefined && value !== null && value.toString().trim() !== "";
    });
  };
  const handleNext = () => {
    const currentIndex = tabList.indexOf(activeTab);
    if (currentIndex < tabList.length - 1) {
      setActiveTab(tabList[currentIndex + 1]);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tabList.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabList[currentIndex - 1]);
    }
  };
  return (
    <div className="max-w-full mx-auto bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold mb-6">Student Admission Form</h1>

      {/* Tabs */}
      <div className="flex space-x-2 border-b mb-6">
        {tabList.map((tab) => (
          <Tab
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === "Student Info" && (
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Student Name <sup className="text-red-900">*</sup></label>
              <input
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email <sup className="text-red-900">*</sup></label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Password <sup className="text-red-900">*</sup></label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass}
                required
                maxLength={6}
              />
            </div>
            {/* ✅ Class Dropdown */}
<div>
  <label className={labelClass}>Class <sup className="text-red-900">*</sup></label>
  <select
    name="classId"
    value={formData.classId}
    onChange={(e) => {
      const selectedClassId = e.target.value;
      const selectedClass = classList.find((cls) => cls._id === selectedClassId);

      setFormData((prev) => ({
        ...prev,
        classId: selectedClassId,
        sectionId: "", // reset section when class changes
      }));

      // ✅ Update available sections for the selected class
      setAvailableSections(selectedClass?.sections || []);
    }}
    className={inputClass}
    required
  >
    <option value="">Select Class </option>
    {classList && classList.length > 0 ? (
      classList.map((cls) => (
        <option key={cls._id} value={cls._id}>
          {cls.name}
        </option>
      ))
    ) : (
      <option disabled>No Classes Available</option>
    )}
  </select>
</div>

{/* ✅ Section Dropdown */}
<div>
  <label className={labelClass}>Section <sup className="text-red-900">*</sup></label>
  <select
    name="sectionId"
    value={formData.sectionId}
    onChange={handleChange}
    className={inputClass}
    required
    disabled={!availableSections.length}
  >
    <option value="">Select Section</option>
    {availableSections.length > 0 ? (
      availableSections.map((sec) => (
        <option key={sec._id} value={sec._id}>
          {sec.name}
        </option>
      ))
    ) : (
      <option disabled>No Sections Available</option>
    )}
  </select>
</div>

           <div>
  <label className={labelClass}>Registration No.</label>
  <input
    name="registrationNumber"
    value={formData.registrationNumber || registrationNumber}
    disabled
    className={`${inputClass} bg-gray-100`}
  />

  {lastStudent && (
    <span className="text-xs text-red-500 mb-0 mt-1">
      Last Student: {lastStudent?.registrationNumber}
    </span>
  )}
</div>

            <div>
              <label className={labelClass}>Admission Date <sup className="text-red-900">*</sup></label>
              <input
                name="admissionDate"
                type="date"
                value={formData.admissionDate}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Fee Discount (%)</label>
              <input
                name="feeDiscount"
                type="number"
                value={formData.feeDiscount}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile Number <sup className="text-red-900">*</sup></label>
              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={inputClass}
                maxLength={10}
              />
            </div>
            <div>
              <label className={labelClass}>Photo</label>
              <input
                name="picture"
                type="file"
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {activeTab === "Other Info" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Date Of Birth <sup className="text-red-900">*</sup></label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={inputClass}
                placeholder="Date of Birth"
              />
            </div>
            <div>
              <label className={labelClass}>Student Birth Form ID / NIC <sup className="text-red-900">*</sup></label>
              <input
                name="birthFormId"
                placeholder="Student Birth Form ID / NIC"
                value={formData.birthFormId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Orphan</label>
              <select
                name="orphan"
                value={formData.orphan}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Orphan Student</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Gender <sup className="text-red-900">*</sup></label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cast <sup className="text-red-900">*</sup></label>
              <input
                name="cast"
                placeholder="Cast"
                value={formData.cast}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>OSC</label>
              <input
                name="osc"
                placeholder="OSC"
                value={formData.osc}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Any Identification Mark?</label>
              <input
                name="identificationMark"
                placeholder="Any Identification Mark?"
                value={formData.identificationMark}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Previous School</label>
              <input
                name="previousSchool"
                placeholder="Previous School"
                value={formData.previousSchool}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Religion <sup className="text-red-900">*</sup></label>
              <input
                name="religion"
                placeholder="Religion"
                value={formData.religion}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Blood Group <sup className="text-red-900">*</sup></label>
              <input
                name="bloodGroup"
                placeholder="Blood Group"
                value={formData.bloodGroup}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Previous ID / Board Roll No</label>
              <input
                name="previousId"
                placeholder="Previous ID / Board Roll No"
                value={formData.previousId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Select Family</label>
              <input
                name="family"
                placeholder="Select Family"
                value={formData.family}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Disease If Any?</label>
              <input
                name="disease"
                placeholder="Disease If Any?"
                value={formData.disease}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Any Additional Note</label>
              <input
                name="notes"
                placeholder="Any Additional Note"
                value={formData.notes}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Total Siblings <sup className="text-red-900">*</sup></label>
              <input
                name="siblings"
                placeholder="Total Siblings"
                value={formData.siblings}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Address <sup className="text-red-900">*</sup></label>
              <textarea
                name="address"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                className={inputClass}
                rows={3}
              ></textarea>
            </div>
          </div>
        )}

        {activeTab === "Father Info" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name <sup className="text-red-900">*</sup></label>
              <input
                name="fatherName"
                placeholder="Father Name"
                value={formData.fatherName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>National ID <sup className="text-red-900">*</sup></label>
              <input
                name="fatherNID"
                placeholder="Father National ID"
                value={formData.fatherNationalId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <input
                name="fatherOccupation"
                placeholder="Occupation"
                value={formData.fatherOccupation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Education</label>
              <input
                name="fatherEducation"
                placeholder="Education"
                value={formData.fatherEducation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile No <sup className="text-red-900">*</sup></label>
              <input
                name="fatherMobile"
                placeholder="Mobile No"
                value={formData.fatherMobile}
                onChange={handleChange}
                className={inputClass}
                maxLength={10}
              />
            </div>
            <div>
              <label className={labelClass}>Profession</label>
              <input
                name="fatherProfession"
                placeholder="Profession"
                value={formData.fatherProfession}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Income</label>
              <input
                name="fatherIncome"
                placeholder="Income"
                value={formData.fatherIncome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {activeTab === "Mother Info" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Name <sup className="text-red-900">*</sup></label>
              <input
                name="motherName"
                placeholder="Mother Name"
                value={formData.motherName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>National ID <sup className="text-red-900">*</sup></label>
              <input
                name="motherNationalId"
                placeholder="Mother National ID"
                value={formData.motherNationalId}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Occupation</label>
              <input
                name="motherOccupation"
                placeholder="Occupation"
                value={formData.motherOccupation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Education</label>
              <input
                name="motherEducation"
                placeholder="Education"
                value={formData.motherEducation}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Mobile No <sup className="text-red-900">*</sup></label>
              <input
                name="motherMobile"
                placeholder="Mobile No"
                value={formData.motherMobile}
                onChange={handleChange}
                className={inputClass}
                maxLength={10}
              />
            </div>
            <div>
              <label className={labelClass}>Profession</label>
              <input
                name="motherProfession"
                placeholder="Profession"
                value={formData.motherProfession}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Income</label>
              <input
                name="motherIncome"
                placeholder="Income"
                value={formData.motherIncome}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          {tabList.indexOf(activeTab) > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded"
            >
              Previous
            </button>
          )}

          {tabList.indexOf(activeTab) < tabList.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!isTabValid()}
              className={`${isTabValid() ? "bg-blue-600 hover:bg-purple-700" : "bg-gray-300 cursor-not-allowed"
                } text-white px-6 py-2 rounded`}
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={!isTabValid()}
              className={`${isTabValid() ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
                } text-white px-6 py-2 rounded`}
            >
              Submit Admission
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default AdmissionForm;
