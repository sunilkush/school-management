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
} from "lucide-react";

import { currentUser, updateUser } from "../../../features/authSlice";
import {
  fetchStudentEnrollment,
  fetchStudentProfile,
} from "../../../features/studentPortalSlice";

const defaultStudentDetails = {
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  fatherName: "",
  fatherMobile: "",
  motherName: "",
  motherMobile: "",
};

const getDisplayValue = (value) => {
  if (!value) return "-";
  if (typeof value === "object") {
    return value?.name || value?.title || value?._id || "-";
  }
  return value;
};

const Profile = () => {
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth || {});
  const portalState = useSelector((state) => state.studentPortal || {});

  const { user, loading: authLoading } = authState;
  const {
    loading: portalLoading,
    error: portalError,
    enrollment,
    profile,
    studentInfo,
  } = portalState;

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [studentDetails, setStudentDetails] = useState(defaultStudentDetails);

  const [saveState, setSaveState] = useState({
    saving: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    dispatch(currentUser());
    dispatch(fetchStudentEnrollment());
    dispatch(fetchStudentProfile());
  }, [dispatch]);

  useEffect(() => {
    setProfileForm({
      name: user?.name || profile?.name || "",
      email: user?.email || profile?.email || "",
      phone:
        user?.phone ||
        user?.mobileNumber ||
        profile?.phone ||
        profile?.mobileNumber ||
        "",
    });
  }, [user, profile]);

  useEffect(() => {
    const source =
      profile?.student ||
      profile?.studentInfo ||
      profile ||
      studentInfo ||
      {};

    setStudentDetails({
      dateOfBirth: source?.dateOfBirth || "",
      gender: source?.gender || "",
      bloodGroup: source?.bloodGroup || "",
      address: source?.address || "",
      fatherName: source?.fatherName || "",
      fatherMobile: source?.fatherMobile || "",
      motherName: source?.motherName || "",
      motherMobile: source?.motherMobile || "",
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

  const handleSave = async (e) => {
    e.preventDefault();

    setSaveState({
      saving: true,
      message: "",
      isError: false,
    });

    try {
      await dispatch(updateUser(profileForm)).unwrap();
      await dispatch(currentUser());

      setSaveState({
        saving: false,
        message: "Profile successfully update ho gaya.",
        isError: false,
      });
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/20 text-xl font-semibold tracking-wide backdrop-blur">
                  {initials || "S"}
                </div>

                <div>
                  <p className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Active Student
                  </p>

                  <h1 className="text-2xl font-bold leading-tight">
                    {profileForm.name || "Student Profile"}
                  </h1>

                  <p className="text-sm text-indigo-100">
                    {profileForm.email || "No email added yet"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <InfoBadge
                  icon={<GraduationCap className="h-4 w-4" />}
                  label="Registration"
                  value={registrationNumber}
                />
                <InfoBadge
                  icon={<BookOpen className="h-4 w-4" />}
                  label="Class"
                  value={classInfo}
                />
                <InfoBadge
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Academic Year"
                  value={getDisplayValue(academicYearName)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <form
            onSubmit={handleSave}
            className="space-y-5 rounded-3xl border bg-white p-4 shadow-sm md:p-6 xl:col-span-2"
          >
            <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                  <Edit3 className="h-4 w-4 text-indigo-500" />
                  Personal Information
                </h2>
                <p className="text-xs text-slate-500">
                  Keep your details up to date for school communications.
                </p>
              </div>

              <button
                type="submit"
                disabled={saveState.saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saveState.saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InputField
                icon={<User className="h-4 w-4" />}
                label="Full Name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
              />

              <InputField
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
              />

              <InputField
                icon={<Phone className="h-4 w-4" />}
                label="Phone Number"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
              />

              <ReadOnlyField
                icon={<HeartPulse className="h-4 w-4" />}
                label="Blood Group"
                value={studentDetails.bloodGroup}
              />

              <ReadOnlyField
                icon={<Users className="h-4 w-4" />}
                label="Gender"
                value={studentDetails.gender}
              />

              <ReadOnlyField
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date of Birth"
                value={studentDetails.dateOfBirth}
              />

              <ReadOnlyField
                icon={<Home className="h-4 w-4" />}
                label="Address"
                value={studentDetails.address}
                fullWidth
              />
            </div>

            {saveState.message && (
              <p
                className={`rounded-lg border px-3 py-2 text-sm ${
                  saveState.isError
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}
              >
                {saveState.message}
              </p>
            )}
          </form>

          <div className="space-y-5">
            <ProfileCard
              title="Father / Guardian"
              icon={<ShieldCheck className="h-4 w-4 text-indigo-500" />}
              rows={[
                { label: "Name", value: studentDetails.fatherName || "-" },
                { label: "Mobile", value: studentDetails.fatherMobile || "-" },
              ]}
            />

            <ProfileCard
              title="Mother / Guardian"
              icon={<NotebookPen className="h-4 w-4 text-pink-500" />}
              rows={[
                { label: "Name", value: studentDetails.motherName || "-" },
                { label: "Mobile", value: studentDetails.motherMobile || "-" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoBadge = ({ icon, label, value }) => (
  <div className="min-w-[130px] rounded-xl border border-white/30 bg-white/10 p-3 backdrop-blur">
    <p className="flex items-center gap-1 text-xs text-indigo-100">
      {icon}
      {label}
    </p>
    <p className="mt-1 truncate text-xs font-semibold text-white">
      {value || "-"}
    </p>
  </div>
);

const InputField = ({
  icon,
  label,
  name,
  value,
  onChange,
  type = "text",
}) => (
  <label className="space-y-1.5">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100">
      <span className="text-slate-400">{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent text-sm outline-none"
        required={name !== "phone"}
      />
    </div>
  </label>
);

const ReadOnlyField = ({ icon, label, value, fullWidth = false }) => (
  <div className={fullWidth ? "md:col-span-2" : ""}>
    <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
    <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span>{value || "-"}</span>
    </div>
  </div>
);

const ProfileCard = ({ title, rows, icon }) => (
  <div className="rounded-3xl border bg-white p-4 shadow-sm">
    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
      {icon}
      {title}
    </h3>
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border bg-slate-50 p-3">
          <p className="text-xs text-slate-500">{row.label}</p>
          <p className="text-sm font-medium text-slate-800">
            {row.value || "-"}
          </p>
        </div>
      ))}
    </div>
  </div>
);

export default Profile;