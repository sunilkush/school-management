import {
  EllipsisVertical,
  MailPlus,
  User,
  CalendarCheck,
  ClipboardList,
  MessageCircleMore,
  Settings,
  FolderClosed,
} from "lucide-react";
import { useEffect, useState } from "react";
import userProfile from "../../assets/userProfile.png";
import AttendanceCalendar from "../../pages/AttendanceCalendar";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserById } from "../../features/auth/authSlice";
import { Select, DatePicker, Input, Button, message } from "antd";
import dayjs from "dayjs";
import { createEmployee } from "../../features/employee/employeeSlice";
import { fetchActiveAcademicYear } from "../../features/academicYear/academicYearSlice";
import { fetchAllSubjects } from "../../features/subject/subjectSlice";

const { Option } = Select;

const EmployeeForm = () => {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.auth);
  const { activeYear } = useSelector((state) => state.academicYear);
  const { subjectList } = useSelector((state) => state.subject);
  const { loading, error, success, response } =
    useSelector((state) => state.employee) || {};

  const schoolId = profile?.school?._id;
  const academicYearId = activeYear?._id;
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get("id");

  const [activeTab, setActiveTab] = useState("Profile");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    userId: employeeId,
    schoolId: schoolId,
    academicYearId: academicYearId,
    phoneNo: "",
    maritalStatus: "",
    gender: "",
    dateOfBirth: "",
    bloodType: "",
    religion: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    idProof: "",
    citizenAddress: "",
    department: "",
    designation: "",
    employeeStatus: "",
    joinDate: "",
    salaryId: "",
    qualification: [],
    experience: "",
    subjects: [],
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branch: "",
    panNumber: "",
    pfNumber: "",
    esiNumber: "",
    notes: "",
  });

  // ✅ validation
  const validateForm = () => {
    let newErrors = {};
    if (!formData.phoneNo) newErrors.phoneNo = "Phone number is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.maritalStatus)
      newErrors.maritalStatus = "Marital Status is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date Of Birth is required";
    if (!formData.bloodType) newErrors.bloodType = "Blood Type is required";
    if (!formData.religion) newErrors.religion = "Religion is required";
    if (!formData.street) newErrors.street = "Street is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipCode) newErrors.zipCode = "Zip Code is required";
    if (!formData.idProof) newErrors.idProof = "Aadhar/ID Proof is required";
    if (!formData.citizenAddress)
      newErrors.citizenAddress = "Citizen Address is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.designation) newErrors.designation = "Designation is required";
    if (!formData.employeeStatus)
      newErrors.employeeStatus = "Employee Status is required";
    if (!formData.joinDate) newErrors.joinDate = "Join Date is required";
    if (!formData.experience) newErrors.experience = "Experience is required";
    if (!formData.qualification || formData.qualification.length === 0)
      newErrors.qualification = "Qualification is required";
    if (!formData.subjects || formData.subjects.length === 0)
      newErrors.subjects = "At least one subject is required";
    if (!formData.accountHolder)
      newErrors.accountHolder = "Account Holder is required";
    if (!formData.accountNumber)
      newErrors.accountNumber = "Account Number is required";
    if (!formData.ifscCode) newErrors.ifscCode = "IFSC Code is required";
    if (!formData.bankName) newErrors.bankName = "Bank Name is required";
    if (!formData.branch) newErrors.branch = "Branch is required";
    if (!formData.panNumber) newErrors.panNumber = "PAN Number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const qualifications = [
    { id: 1, name: "High School / 10th" },
    { id: 2, name: "Intermediate / 12th" },
    { id: 3, name: "Diploma" },
    { id: 4, name: "Bachelor's Degree" },
    { id: 5, name: "Master's Degree" },
    { id: 6, name: "PhD / Doctorate" },
    { id: 7, name: "ITI / Trade Course" },
    { id: 8, name: "Professional Certification" },
    { id: 9, name: "Other" },
  ];

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "RH"];
  const maritalStatuses = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
    "Registered Partnership",
  ];
  const religions = [
    "Hindu",
    "Muslim",
    "Christian",
    "Sikh",
    "Buddhist",
    "Jain",
    "Other",
  ];
  const cities = [
    "Delhi",
    "Mumbai",
    "Bangalore",
    "Hyderabad",
    "Ahmedabad",
    "Chennai",
    "Kolkata",
    "Surat",
    "Pune",
    "Jaipur",
  ];
  const states = [
    "Andhra Pradesh",
    "Bihar",
    "Maharashtra",
    "Uttar Pradesh",
    "Tamil Nadu",
    "Karnataka",
    "Rajasthan",
    "West Bengal",
  ];

  const handleChange = (nameOrEvent, value) => {
    if (typeof nameOrEvent === "string") {
      setFormData((prev) => ({
        ...prev,
        [nameOrEvent]: value,
      }));
      if (errors[nameOrEvent]) {
        setErrors((prev) => ({ ...prev, [nameOrEvent]: "" }));
      }
    } else {
      const { name, value } = nameOrEvent.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    const res = await dispatch(createEmployee(formData));
    if (res?.payload?.success) {
      message.success(res.payload.message || "Employee created successfully!");
    } else {
      message.error(
        res?.payload?.errors || "Something went wrong while creating employee"
      );
    }
  };

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      schoolId: schoolId || prev.schoolId,
      academicYearId: academicYearId || prev.academicYearId,
    }));
  }, [schoolId, academicYearId]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllSubjects({ schoolId, academicYearId }));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
    if (employeeId) {
      dispatch(getUserById(employeeId));
    }
  }, [dispatch, employeeId, schoolId, academicYearId]);

  return (
    <div className="min-h-screen">
      {/* Feedback */}
      {loading && <p className="text-blue-500">Saving employee...</p>}
      {error && <p className="text-red-500">{JSON.stringify(error)}</p>}
      {success && response?.message && (
        <p className="text-green-600">{response.message}</p>
      )}

      {/* Header */}
      <div className="flex justify-between flex-col md:flex-row ">
        <div className="flex items-center space-x-4 mb-6 flex-col md:flex-row">
          <img
            src={profile?.avatar || userProfile}
            alt="User Profile"
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-medium capitalize">
              {profile?.name || "N/A"}
            </h3>
            <p className="text-xs bg-green-100 text-green-900 rounded-full px-3 py-1 inline-block">
              {profile?.isActive ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="p-3 border-l-2 flex gap-6"> <div> <p className="text-sm font-semibold">Role</p> <span className="text-xs ">{profile?.role?.name}</span> </div> <div> <p className="text-sm font-semibold">Email</p> <span className="text-xs ">{profile?.email}</span> </div> </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="px-1 py-1 border bg-white rounded-md">
            <EllipsisVertical />
          </button>
          <button className="px-3 py-1 text-sm flex items-center gap-2 bg-purple-800 rounded-md text-white">
            <MailPlus className="w-5" /> Send Email
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {[
          "Profile",
          "Attendance",
          "Tasks",
          "Messages",
          "Files",
          "Settings",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
            ${activeTab === tab
                ? "border-purple-600 text-purple-600 font-semibold"
                : "border-transparent text-gray-800 hover:text-purple-600"
              }`}
          >
            {tab === "Profile" && <User className="w-4 mr-1" />}
            {tab === "Attendance" && <CalendarCheck className="w-4 mr-1" />}
            {tab === "Tasks" && <ClipboardList className="w-4 mr-1" />}
            {tab === "Messages" && <MessageCircleMore className="w-4 mr-1" />}
            {tab === "Files" && <FolderClosed className="w-4 mr-1" />}
            {tab === "Settings" && <Settings className="w-4 mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          {/* Left (Main Info) */}
          <div className="col-span-2 flex flex-col gap-3">
            {/* Personal Information */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <p className="text-xs text-gray-800">Gender</p>
                  <Select
                    value={formData.gender || undefined}
                    onChange={(val) => handleChange("gender", val)}
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select Gender"
                    required
                    name="gender"
                  >
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                  </Select>
                  {errors.gender && <p className="text-red-500 text-xs">{errors.gender}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Marital Status</p>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.maritalStatus || undefined}
                    onChange={(val) => handleChange("maritalStatus", val)}
                    placeholder="Select Marital Status"
                    required
                    name="maritalStatus"
                  >
                    {maritalStatuses.map((status) => (
                      <Option key={status} value={status}>
                        {status}
                      </Option>
                    ))}
                  </Select>
                  {errors.maritalStatus && <p className="text-red-500 text-xs">{errors.maritalStatus}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Religion</p>
                  <Select
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.religion || undefined}
                    onChange={(val) => handleChange("religion", val)}
                    placeholder="Select Religion"
                    required
                    name="religion"
                  >
                    {religions.map((r) => (
                      <Option key={r} value={r}>
                        {r}
                      </Option>
                    ))}
                  </Select>
                  {errors.religion && <p className="text-red-500 text-xs">{errors.religion}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Birth Date</p>
                  <DatePicker
                    className="w-full"
                    name="dateOfBirth"
                    value={
                      formData.dateOfBirth ? dayjs(formData.dateOfBirth) : null
                    }
                    onChange={(_, dateStr) => handleChange("dateOfBirth", dateStr)
                    }
                    format="YYYY-MM-DD"
                    required
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Blood Type</p>
                  <Select
                    name="bloodType"
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.bloodType || undefined}
                    onChange={(val) => handleChange("bloodType", val)}
                    placeholder="Select Blood Type"
                    required
                  >
                    {bloodGroups.map((bg) => (
                      <Option key={bg} value={bg}>
                        {bg}
                      </Option>
                    ))}
                  </Select>
                  {errors.bloodType && <p className="text-red-500 text-xs">{errors.bloodType}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Aadhar No</p>
                  <Input
                    name="idProof"
                    value={formData.idProof}
                    onChange={handleChange}
                    placeholder="Enter Aadher no"
                    required
                    type="number"
                  />
                  {errors.idProof && <p className="text-red-500 text-xs">{errors.idProof}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Qualification</p>
                  <Select

                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.qualification}
                    onChange={(vals) => handleChange("qualification", vals)}
                    placeholder="Select qualification"
                    required
                  >
                    {qualifications.map((q) => (
                      <Option key={q.id} value={q.name}>
                        {q.name}
                      </Option>
                    ))}
                  </Select>
                  {errors.qualification && <p className="text-red-500 text-xs">{errors.qualification}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Experience</p>
                  <Input
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Enter Experience"
                    required
                  />
                  {errors.experience && <p className="text-red-500 text-xs">{errors.experience}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Subjects</p>
                  <Select

                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    value={formData.subjects}
                    onChange={(vals) => handleChange("subjects", vals)}
                    placeholder="Select Subjects"
                    required
                  >
                    {subjectList.map((s) => (
                      <Option key={s._id} value={s._id}>
                        {s.name}
                      </Option>
                    ))}
                  </Select>
                  {errors.subjects && <p className="text-red-500 text-xs">{errors.subjects}</p>}
                </div>
              </div>
            </div>

            {/* Bank Info */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Bank Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-800">Account Holder</p>
                  <Input
                    name="accountHolder"
                    placeholder="Account Holder"
                    value={formData.accountHolder}
                    onChange={handleChange}
                    required
                  />
                  {errors.accountHolder && <p className="text-red-500 text-xs">{errors.accountHolder}</p>}
                </div>

                <div>
                  <p className="text-xs text-gray-800">Account Number</p>
                  <Input
                    name="accountNumber"
                    placeholder="Account Number"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    required
                    type="number"
                  />
                  {errors.accountNumber && <p className="text-red-500 text-xs">{errors.accountNumber}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">IFSC Code</p>
                  <Input
                    name="ifscCode"
                    placeholder="IFSC Code"
                    className="uppercase"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    required
                  />
                  {errors.ifscCode && <p className="text-red-500 text-xs">{errors.ifscCode}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">Bank Name</p>
                  <Input
                    name="bankName"
                    placeholder="Bank Name"
                    value={formData.bankName}
                    onChange={handleChange}
                    required
                  />
                  {errors.bankName && <p className="text-red-500 text-xs">{errors.bankName}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">Branch</p>
                  <Input
                    name="branch"
                    placeholder="Branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  />
                  {errors.branch && <p className="text-red-500 text-xs">{errors.branch}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">PAN Number</p>
                  <Input
                    name="panNumber"
                    placeholder="PAN Number"
                    className="uppercase"
                    value={formData.panNumber}
                    onChange={handleChange}
                    required
                  />
                  {errors.panNumber && <p className="text-red-500 text-xs">{errors.panNumber}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">PF Number</p>
                  <Input
                    name="pfNumber"
                    placeholder="PF Number"
                    value={formData.pfNumber}
                    onChange={handleChange}
                    required
                    type="number"
                  />
                  {errors.pfNumber && <p className="text-red-500 text-xs">{errors.pfNumber}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">ESI Number</p>
                  <Input
                    name="esiNumber"
                    placeholder="ESI Number"
                    value={formData.esiNumber}
                    onChange={handleChange}
                    required
                    type="number"
                  />
                  {errors.esiNumber && <p className="text-red-500 text-xs">{errors.esiNumber}</p>}
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Address Information</h3>
              <div className="grid grid-cols-4 gap-5">
                <div>
                  <p className="text-xs text-gray-800">Street</p>
                  <Input
                    name="street"
                    placeholder="Street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                  {errors.street && <p className="text-red-500 text-xs">{errors.street}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">City</p>
                  <Select

                    name="city"
                    value={formData.city || undefined}
                    onChange={(val) => handleChange("city", val)}
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Selcet Street"
                    required
                  >
                    {cities.map((c) => (
                      <Option key={c} value={c}>
                        {c}
                      </Option>
                    ))}
                  </Select>
                  {errors.city && <p className="text-red-500 text-xs">{errors.city}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">State</p>

                  <Select
                    name="state"
                    value={formData.state || undefined}
                    onChange={(val) => handleChange("state", val)}
                    allowClear
                    style={{ width: "100%" }}
                    required
                  >
                    {states.map((s) => (
                      <Option key={s} value={s}>
                        {s}
                      </Option>
                    ))}
                  </Select>
                  {errors.state && <p className="text-red-500 text-xs">{errors.state}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800">Zip Code</p>
                  <Input
                    name="zipCode"
                    placeholder="Zip Code"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                    type="number"
                  />
                  {errors.zipCode && <p className="text-red-500 text-xs">{errors.zipCode}</p>}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xs text-gray-800 ">Citizen Address</p>
                <Input
                  name="citizenAddress"
                  placeholder="Citizen Address"
                  value={formData.citizenAddress} // ✅ match backend
                  onChange={handleChange}
                  required
                />
                {errors.citizenAddress && <p className="text-red-500 text-xs">{errors.citizenAddress}</p>}
              </div>
            </div>
          </div>

          {/* Right Side (Overview + Contact) */}
          <div className="flex flex-col gap-3">
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Contact Information</h3>
              <p className="text-xs text-gray-800 ">Mobile No</p>
              <Input
                name="phoneNo"
                placeholder="Phone Number"
                maxLength={10}
                value={formData.phoneNo}
                onChange={handleChange}
                required
                type="number"
              />
              {errors.phoneNo && <p className="text-red-500 text-xs">{errors.phoneNo}</p>}
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-800 ">Joining Date</p>
                  <DatePicker

                    className="w-full mb-3"
                    value={formData.joinDate ? dayjs(formData.joinDate) : null}
                    onChange={(_, dateStr) => handleChange("joinDate", dateStr)}
                    required
                  />
                  {errors.joinDate && <p className="text-red-500 text-xs">{errors.joinDate}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Department</p>
                  <Input
                    name="department"
                    placeholder="Department"
                    value={formData.department}
                    onChange={handleChange}
                    className="mb-3"
                    required
                  />
                  {errors.department && <p className="text-red-500 text-xs">{errors.department}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Designation</p>
                  <Input
                    name="designation"
                    placeholder="Designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="mb-3"
                    required
                  />
                  {errors.designation && <p className="text-red-500 text-xs">{errors.designation}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-800 ">Employee Status</p>
                  <Select
                    name="employeeStatus"
                    value={formData.employeeStatus || undefined}
                    onChange={(val) => handleChange("employeeStatus", val)}
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select Employee Status"
                    required
                  >
                    <Option value="Full-Time">Full-Time</Option>
                    <Option value="Part-Time">Part-Time</Option>
                    <Option value="Contract">Contract</Option>
                  </Select>
                  {errors.employeeStatus && <p className="text-red-500 text-xs">{errors.employeeStatus}</p>}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-800 ">Notes</p>
                  <textarea
                    name="notes"
                    rows={4}
                    className="w-full border  rounded-lg px-2 py-1 text-xs"
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <Button
              type="primary"
              className="mt-4 bg-purple-700"
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {activeTab === "Attendance" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          <AttendanceCalendar />
        </div>
      )}
      {activeTab === "Tasks" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Tasks Options coming soon...
        </div>
      )}
      {activeTab === "Messages" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Messages Options coming soon...
        </div>
      )}
      {activeTab === "Files" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Files Options coming soon...
        </div>
      )}
      {activeTab === "Settings" && (
        <div className="bg-white p-4 rounded-lg border mt-3">
          Settings Options coming soon...
        </div>
      )}
    </div>
  );
};

export default EmployeeForm;
