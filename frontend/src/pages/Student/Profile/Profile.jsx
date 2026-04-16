import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Edit3,
  GraduationCap,
  HeartPulse,
  Home,
  Mail,
  NotebookPen,
  Phone,
  Save,
  ShieldCheck,
  User,
  Users,
  Loader2,
  Users,
} from "lucide-react";
import { fetchStudentEnrollment, fetchStudentProfile, updateStudentProfile } from "../../../features/studentPortalSlice";

const defaultStudentDetails = {
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
};

const defaultGuardian = {
  name: "",
  mobile: "",
  email: "",
};

const getDisplayValue = (value) => {
  if (!value) return "-";
  if (typeof value === "object") return value?.name || value?.title || value?._id || "-";
  return value;
};

const formatDateInput = (value) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const Profile = () => {
  const dispatch = useDispatch();
  const { loading: authLoading } = useSelector((state) => state.auth);
  const { profile: studentProfile, enrollment, loading: portalLoading, error: portalError } = useSelector((state) => state.studentPortal);

  const [studentInfo, setStudentInfo] = useState(defaultStudentInfo);
  const [profileForm, setProfileForm] = useState({ name: "", email: "", phone: "" });
  const [fatherInfo, setFatherInfo] = useState(defaultGuardian);
  const [motherInfo, setMotherInfo] = useState(defaultGuardian);
  const [saveState, setSaveState] = useState({ saving: false, message: "", isError: false });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        await Promise.all([dispatch(fetchStudentProfile()).unwrap(), dispatch(fetchStudentEnrollment()).unwrap()]);
      } catch (err) {
        setSaveState({
          saving: false,
          message: err || "Profile load nahi ho paaya. Dobara try karein.",
          isError: true,
        });
      }
    };

    loadProfileData();
  }, [dispatch]);

  useEffect(() => {
    if (!studentProfile) return;

    setProfileForm({
      name: studentProfile?.userId?.name || "",
      email: studentProfile?.userId?.email || "",
      phone: studentProfile?.userId?.phone || "",
    });

    setStudentInfo({
      dateOfBirth: formatDateInput(studentProfile?.dateOfBirth),
      gender: studentProfile?.gender || "",
      bloodGroup: studentProfile?.bloodGroup || "",
      address: studentProfile?.address || "",
    });

    setFatherInfo({
      name: studentProfile?.fatherInfo?.name || studentProfile?.fatherId?.name || "",
      mobile: studentProfile?.fatherInfo?.mobile || studentProfile?.fatherId?.phone || "",
      email: studentProfile?.fatherInfo?.email || studentProfile?.fatherId?.email || "",
    });

    setMotherInfo({
      name: studentProfile?.motherInfo?.name || studentProfile?.motherId?.name || "",
      mobile: studentProfile?.motherInfo?.mobile || studentProfile?.motherId?.phone || "",
      email: studentProfile?.motherInfo?.email || studentProfile?.motherId?.email || "",
    });
  }, [profile, studentInfo]);

  const initials = useMemo(() => {
    const fullName = profileForm?.name || user?.name || "Student";
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profileForm?.name, user?.name]);

  const registrationNumber =
    enrollment?.registrationNumber ||
    studentInfo?.registrationNumber ||
    "-";

  const classInfo = enrollment?.schoolClass?.name
    ? `${enrollment.schoolClass.name}${
        enrollment?.section?.name ? ` - ${enrollment.section.name}` : ""
      }`
    : studentInfo?.schoolClass?.name
    ? `${studentInfo.schoolClass.name}${
        studentInfo?.section?.name ? ` - ${studentInfo.section.name}` : ""
      }`
    : "-";

  const academicYearName =
    enrollment?.academicYear?.name || studentInfo?.academicYear?.name || "-";

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStudentInfoChange = (e) => {
    const { name, value } = e.target;
    setStudentInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardianChange = (type, e) => {
    const { name, value } = e.target;
    const setter = type === "father" ? setFatherInfo : setMotherInfo;
    setter((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSaveState({
      saving: true,
      message: "",
      isError: false,
    });

    try {
      await dispatch(
        updateStudentProfile({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
          dateOfBirth: studentInfo.dateOfBirth,
          gender: studentInfo.gender,
          bloodGroup: studentInfo.bloodGroup,
          address: studentInfo.address,
          fatherInfo,
          motherInfo,
        })
      ).unwrap();

      setSaveState({ saving: false, message: "Profile successfully update ho gaya ✅", isError: false });
      await dispatch(fetchStudentProfile()).unwrap();
    } catch (err) {
      setSaveState({
        saving: false,
        message:
          err?.message ||
          err ||
          "Profile update nahi ho paaya. Phir se try karein.",
        isError: true,
      });
    }
  };

  if (portalLoading || authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Profile load ho raha hai...
      </div>
    );
  }

  if (portalError) {
    return (
      <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-medium">Error</p>
        <p className="text-sm">{portalError}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-5">
      <div className="bg-white rounded-2xl border p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-5 md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-lg">{initials}</div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{profileForm.name || "Student Profile"}</h1>
              <p className="text-sm text-slate-500">{profileForm.email || "No email"}</p>
              <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">Active Student</span>
            </div>
          </div>
        </section>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <InfoBadge icon={<GraduationCap className="h-4 w-4" />} label="Registration" value={enrollment?.registrationNumber || "-"} />
            <InfoBadge
              icon={<BookOpen className="h-4 w-4" />}
              label="Class"
              value={enrollment?.schoolClass?.name ? `${enrollment.schoolClass.name} - ${enrollment?.section?.name || ""}` : "-"}
            />
            <InfoBadge icon={<CalendarDays className="h-4 w-4" />} label="Academic Year" value={getDisplayValue(enrollment?.academicYear?.name)} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 bg-white rounded-2xl border p-4 md:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Basic Profile</h2>
            <button
              type="submit"
              disabled={saveState.saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50"
            >
              {saveState.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saveState.saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <Section title="Student Account">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField icon={<User className="h-4 w-4" />} label="Full Name" name="name" value={profileForm.name} onChange={handleProfileChange} required />
              <InputField icon={<Mail className="h-4 w-4" />} label="Email" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} required />
              <InputField icon={<Phone className="h-4 w-4" />} label="Phone" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </div>
          </Section>

          <Section title="Student Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField label="Gender" name="gender" value={studentInfo.gender} onChange={handleStudentInfoChange} options={["Male", "Female", "Other"]} />
              <InputField icon={<Droplets className="h-4 w-4" />} label="Blood Group" name="bloodGroup" value={studentInfo.bloodGroup} onChange={handleStudentInfoChange} />
              <InputField icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" name="dateOfBirth" type="date" value={studentInfo.dateOfBirth} onChange={handleStudentInfoChange} />
              <InputField icon={<MapPin className="h-4 w-4" />} label="Address" name="address" value={studentInfo.address} onChange={handleStudentInfoChange} fullWidth />
            </div>
          </Section>

          {saveState.message && <p className={`text-sm ${saveState.isError ? "text-red-600" : "text-emerald-600"}`}>{saveState.message}</p>}
        </div>

        <div className="space-y-5">
          <GuardianCard title="Father Details" data={fatherInfo} onChange={(e) => handleGuardianChange("father", e)} />
          <GuardianCard title="Mother Details" data={motherInfo} onChange={(e) => handleGuardianChange("mother", e)} />
        </div>
      </form>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
    {children}
  </div>
);

const InfoBadge = ({ icon, label, value }) => (
  <div className="min-w-[130px] rounded-xl border border-white/30 bg-white/10 p-3 backdrop-blur">
    <p className="flex items-center gap-1 text-xs text-indigo-100">
      {icon}
      {label}
    </p>
    <p className="text-slate-800 font-medium text-xs truncate mt-1">{value || "-"}</p>
  </div>
);

const InputField = ({ icon, label, name, value, onChange, type = "text", required = false, fullWidth = false }) => (
  <label className={`space-y-1 ${fullWidth ? "md:col-span-2" : ""}`}>
    <span className="text-xs text-slate-500">{label}</span>
    <div className="flex items-center rounded-lg border px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-indigo-100">
      <span className="text-slate-400">{icon}</span>
      <input type={type} name={name} value={value} onChange={onChange} className="w-full outline-none text-sm bg-transparent" required={required} />
    </div>
  </label>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <label className="space-y-1">
    <span className="text-xs text-slate-500">{label}</span>
    <div className="rounded-lg border px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-100">
      <select name={name} value={value} onChange={onChange} className="w-full outline-none text-sm bg-transparent">
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  </label>
);

const GuardianCard = ({ title, data, onChange }) => (
  <div className="bg-white rounded-2xl border p-4 shadow-sm space-y-3">
    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
      <Users className="h-4 w-4" /> {title}
    </h3>
    <InputField icon={<User className="h-4 w-4" />} label="Name" name="name" value={data.name} onChange={onChange} />
    <InputField icon={<Phone className="h-4 w-4" />} label="Mobile" name="mobile" value={data.mobile} onChange={onChange} />
    <InputField icon={<Mail className="h-4 w-4" />} label="Email" name="email" value={data.email} onChange={onChange} type="email" />
  </div>
);

export default Profile;