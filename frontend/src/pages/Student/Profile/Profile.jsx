import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Mail,
  Phone,
  Save,
  User,
  MapPin,
  Droplets,
  Loader2,
} from "lucide-react";
import { currentUser, updateUser } from "../../../features/authSlice";
import {
  fetchStudentEnrollment,
  fetchStudentProfile,
} from "../../../features/studentPortalSlice";

const defaultStudentInfo = {
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
  const { user, loading: authLoading } = useSelector((state) => state.auth);
  const {
    profile: studentProfile,
    enrollment,
    loading: portalLoading,
    error: portalError,
  } = useSelector((state) => state.studentPortal);

  const [studentInfo, setStudentInfo] = useState(defaultStudentInfo);
  const [saveState, setSaveState] = useState({ saving: false, message: "", isError: false });

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const userPayload = user || (await dispatch(currentUser()).unwrap());
        await Promise.all([
          dispatch(fetchStudentProfile(userPayload?._id)).unwrap(),
          dispatch(fetchStudentEnrollment()).unwrap(),
        ]);
      } catch (err) {
        setSaveState({
          saving: false,
          message: err || "Profile load nahi ho paaya. Dobara try karein.",
          isError: true,
        });
      }
    };

    loadProfileData();
  }, [dispatch, user]);

  useEffect(() => {
    const student = studentProfile || {};

    setStudentInfo({
      dateOfBirth: student?.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : "-",
      gender: student?.gender || "-",
      bloodGroup: student?.bloodGroup || "-",
      address: student?.address || "-",
      fatherName: student?.fatherInfo?.name || "-",
      fatherMobile: student?.fatherInfo?.mobile || "-",
      motherName: student?.motherInfo?.name || "-",
      motherMobile: student?.motherInfo?.mobile || "-",
    });
  }, [studentProfile]);

  const initials = useMemo(() => {
    if (!profileForm.name) return "ST";
    return profileForm.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [profileForm.name]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveState({ saving: true, message: "", isError: false });

    try {
      await dispatch(
        updateUser({
          name: profileForm.name,
          email: profileForm.email,
          phone: profileForm.phone,
        })
      ).unwrap();

      setSaveState({ saving: false, message: "Profile successfully update ho gaya ✅", isError: false });
      dispatch(currentUser());
    } catch (err) {
      setSaveState({
        saving: false,
        message: err || "Profile update nahi ho paaya. Phir se try karein.",
        isError: true,
      });
    }
  };

  if (portalLoading || authLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-600">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Profile load ho raha hai...
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
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center text-lg">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{profileForm.name || "Student Profile"}</h1>
              <p className="text-sm text-slate-500">{profileForm.email || "No email"}</p>
              <span className="inline-block mt-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                Active Student
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <InfoBadge icon={<GraduationCap className="h-4 w-4" />} label="Registration" value={enrollment?.registrationNumber || "-"} />
             <InfoBadge
    icon={<BookOpen className="h-4 w-4" />}
    label="Class"
    value={
      enrollment?.schoolClass?.name
        ? `${enrollment.schoolClass.name} - ${enrollment?.section?.name || ""}`
        : "-"
    }
  />
            <InfoBadge icon={<CalendarDays className="h-4 w-4" />} label="Academic Year" value={getDisplayValue(enrollment?.academicYear.name) || "-"} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <form onSubmit={handleSave} className="xl:col-span-2 bg-white rounded-2xl border p-4 md:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Basic Profile</h2>
            <button
              type="submit"
              disabled={saveState.saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saveState.saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField icon={<User className="h-4 w-4" />} label="Full Name" name="name" value={profileForm.name} onChange={handleProfileChange} />
            <InputField icon={<Mail className="h-4 w-4" />} label="Email" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} />
            <InputField icon={<Phone className="h-4 w-4" />} label="Phone" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            <ReadOnlyField icon={<Droplets className="h-4 w-4" />} label="Blood Group" value={studentInfo.bloodGroup} />
            <ReadOnlyField icon={<User className="h-4 w-4" />} label="Gender" value={studentInfo.gender} />
            <ReadOnlyField icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" value={studentInfo.dateOfBirth} />
          </div>

          <ReadOnlyField icon={<MapPin className="h-4 w-4" />} label="Address" value={studentInfo.address} fullWidth />

          {saveState.message && (
            <p className={`text-sm ${saveState.isError ? "text-red-600" : "text-emerald-600"}`}>{saveState.message}</p>
          )}
        </form>

       <div className="space-y-5">
  <ProfileCard
    title="Father Details"
    rows={[
      { label: "Name", value: studentInfo?.fatherId?.name || "-" },
      { label: "Mobile", value: studentInfo?.fatherId?.phone || "-" },
    ]}
  />

  <ProfileCard
    title="Mother Details"
    rows={[
      { label: "Name", value: studentInfo?.motherId?.name || "-" },
      { label: "Mobile", value: studentInfo?.motherId?.phone || "-" },
    ]}
  />
</div>
      </div>
    </div>
  );
};

const InfoBadge = ({ icon, label, value }) => (
  <div className="rounded-xl border bg-slate-50 p-3 min-w-[130px]">
    <p className="text-slate-500 text-xs flex items-center gap-1">
      {icon}
      {label}
    </p>
    <p className="text-slate-800 font-medium text-xs truncate mt-1">{value}</p>
  </div>
);

const InputField = ({ icon, label, name, value, onChange, type = "text" }) => (
  <label className="space-y-1">
    <span className="text-xs text-slate-500">{label}</span>
    <div className="flex items-center rounded-lg border px-3 py-2 gap-2 focus-within:ring-2 focus-within:ring-indigo-100">
      <span className="text-slate-400">{icon}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full outline-none text-sm bg-transparent"
        required={name !== "phone"}
      />
    </div>
  </label>
);

const ReadOnlyField = ({ icon, label, value, fullWidth = false }) => (
  <div className={fullWidth ? "md:col-span-2" : ""}>
    <p className="text-xs text-slate-500 mb-1">{label}</p>
    <div className="flex items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700">
      <span className="text-slate-400">{icon}</span>
      <span>{value || "-"}</span>
    </div>
  </div>
);

const ProfileCard = ({ title, rows }) => (
  <div className="bg-white rounded-2xl border p-4 shadow-sm">
    <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="border rounded-lg p-3 bg-slate-50">
          <p className="text-xs text-slate-500">{row.label}</p>
          <p className="text-sm font-medium text-slate-800">{row.value || "-"}</p>
        </div>
      ))}
    </div>
  </div>
);

export default Profile;
