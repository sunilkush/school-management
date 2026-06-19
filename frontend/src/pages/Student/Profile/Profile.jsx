import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BookOpen,
  CalendarDays,
  Droplets,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  Users,
} from "lucide-react";
import { UserOutlined } from "@ant-design/icons";
import {
  fetchStudentEnrollment,
  fetchStudentProfile,
  updateStudentProfile,
} from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, pageCard, sectionPanel, avatarStyle } from "../../../styles/pageStyles";

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
  if (typeof value === "object") {
    return value?.name || value?.title || value?._id || "-";
  }
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

  const { loading: authLoading, user } = useSelector((state) => state.auth || {});
  const {
    profile: studentProfile,
    enrollment,
    loading: portalLoading,
    error: portalError,
  } = useSelector((state) => state.studentPortal || {});

  const [studentInfo, setStudentInfo] = useState(defaultStudentDetails);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [fatherInfo, setFatherInfo] = useState(defaultGuardian);
  const [motherInfo, setMotherInfo] = useState(defaultGuardian);
  const [saveState, setSaveState] = useState({
    saving: false,
    message: "",
    isError: false,
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        await Promise.all([
          dispatch(fetchStudentProfile()).unwrap(),
          dispatch(fetchStudentEnrollment()).unwrap(),
        ]);
      } catch (err) {
        setSaveState({
          saving: false,
          message: err?.message || err || "Profile load nahi ho paaya. Dobara try karein.",
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
      phone:
        studentProfile?.userId?.phone ||
        studentProfile?.userId?.mobile ||
        "",
    });

    setStudentInfo({
      dateOfBirth: formatDateInput(studentProfile?.dateOfBirth),
      gender: studentProfile?.gender || "",
      bloodGroup: studentProfile?.bloodGroup || "",
      address: studentProfile?.address || "",
    });

    setFatherInfo({
      name: studentProfile?.fatherInfo?.name || studentProfile?.fatherId?.name || "",
      mobile:
        studentProfile?.fatherInfo?.mobile ||
        studentProfile?.fatherId?.phone ||
        studentProfile?.fatherId?.mobile ||
        "",
      email: studentProfile?.fatherInfo?.email || studentProfile?.fatherId?.email || "",
    });

    setMotherInfo({
      name: studentProfile?.motherInfo?.name || studentProfile?.motherId?.name || "",
      mobile:
        studentProfile?.motherInfo?.mobile ||
        studentProfile?.motherId?.phone ||
        studentProfile?.motherId?.mobile ||
        "",
      email: studentProfile?.motherInfo?.email || studentProfile?.motherId?.email || "",
    });
  }, [studentProfile]);

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
    enrollment?.registrationNumber || studentProfile?.registrationNumber || "-";

  const classInfo = enrollment?.schoolClass?.name
    ? `${enrollment.schoolClass.name}${
        enrollment?.section?.name ? ` - ${enrollment.section.name}` : ""
      }`
    : studentProfile?.schoolClass?.name
    ? `${studentProfile.schoolClass.name}${
        studentProfile?.section?.name ? ` - ${studentProfile.section.name}` : ""
      }`
    : "-";

  const academicYearName =
    enrollment?.academicYear?.name || studentProfile?.academicYear?.name || "-";

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
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
    setSaveState({ saving: true, message: "", isError: false });

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

      setSaveState({ saving: false, message: "Profile updated successfully", isError: false });
      await dispatch(fetchStudentProfile()).unwrap();
    } catch (err) {
      setSaveState({
        saving: false,
        message: err?.message || err || "Profile update failed. Please try again.",
        isError: true,
      });
    }
  };

  if (portalLoading || authLoading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)" }}>
        <Loader2 style={{ width: 20, height: 20 }} />
        Loading profile...
      </div>
    );
  }

  if (portalError) {
    return (
      <div style={{ ...pageWrapper }}>
        <div style={{ border: "1px solid #fca5a5", background: "#fff1f2", borderRadius: 12, padding: 16, color: "#D96B7A" }}>
          <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Error</p>
          <p style={{ fontSize: 13, margin: 0 }}>{portalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="My Profile"
        subtitle="View and update your personal information"
        icon={<UserOutlined />}
      />

      <div style={{ ...pageCard, marginTop: 16, padding: "20px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={avatarStyle(profileForm.name || "S", 56)}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {profileForm.name || "Student Profile"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{profileForm.email || "No email"}</div>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, background: "rgba(184,224,210,0.2)", color: "#5BA89A", padding: "2px 10px", borderRadius: 99, fontWeight: 600 }}>
                Active Student
              </span>
            </div>
          </div>

          <div className="stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, flex: "1 1 340px", maxWidth: 480 }}>
            <InfoBadge icon={<GraduationCap style={{ width: 14, height: 14 }} />} label="Registration" value={registrationNumber} />
            <InfoBadge icon={<BookOpen style={{ width: 14, height: 14 }} />} label="Class" value={classInfo} />
            <InfoBadge icon={<CalendarDays style={{ width: 14, height: 14 }} />} label="Academic Year" value={getDisplayValue(academicYearName)} />
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
        <div style={{ ...pageCard, padding: "20px 24px", gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>Basic Profile</div>
            <button
              type="submit"
              disabled={saveState.saving}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                background: "var(--primary)", color: "#fff",
                border: "none", cursor: "pointer", fontSize: 13,
                opacity: saveState.saving ? 0.6 : 1,
              }}
            >
              {saveState.saving ? <Loader2 style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
              {saveState.saving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <Section title="Student Account">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <InputField icon={<User style={{ width: 14, height: 14 }} />} label="Full Name" name="name" value={profileForm.name} onChange={handleProfileChange} required />
              <InputField icon={<Mail style={{ width: 14, height: 14 }} />} label="Email" name="email" type="email" value={profileForm.email} onChange={handleProfileChange} required />
              <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Phone" name="phone" value={profileForm.phone} onChange={handleProfileChange} />
            </div>
          </Section>

          <Section title="Student Details">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <SelectField label="Gender" name="gender" value={studentInfo.gender} onChange={handleStudentInfoChange} options={["Male", "Female", "Other"]} />
              <InputField icon={<Droplets style={{ width: 14, height: 14 }} />} label="Blood Group" name="bloodGroup" value={studentInfo.bloodGroup} onChange={handleStudentInfoChange} />
              <InputField icon={<CalendarDays style={{ width: 14, height: 14 }} />} label="Date of Birth" name="dateOfBirth" type="date" value={studentInfo.dateOfBirth} onChange={handleStudentInfoChange} />
              <InputField icon={<MapPin style={{ width: 14, height: 14 }} />} label="Address" name="address" value={studentInfo.address} onChange={handleStudentInfoChange} />
            </div>
          </Section>

          {saveState.message && (
            <p style={{ fontSize: 13, color: saveState.isError ? "#D96B7A" : "#5BA89A", margin: "8px 0 0" }}>
              {saveState.message}
            </p>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <GuardianCard title="Father Details" data={fatherInfo} onChange={(e) => handleGuardianChange("father", e)} />
          <GuardianCard title="Mother Details" data={motherInfo} onChange={(e) => handleGuardianChange("mother", e)} />
        </div>
      </form>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const InfoBadge = ({ icon, label, value }) => (
  <div style={{ borderRadius: 10, border: "1px solid var(--border-muted)", background: "var(--surface-soft)", padding: "10px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
      {icon}{label}
    </div>
    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
      {value || "-"}
    </div>
  </div>
);

const fieldStyle = {
  display: "flex", alignItems: "center",
  border: "1px solid var(--border-muted)",
  borderRadius: 8, padding: "8px 12px", gap: 8,
  background: "var(--surface)",
};

const InputField = ({ icon, label, name, value, onChange, type = "text", required = false }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    <div style={fieldStyle}>
      <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }}
      />
    </div>
  </label>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    <div style={fieldStyle}>
      <select
        name={name}
        value={value || ""}
        onChange={onChange}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  </label>
);

const GuardianCard = ({ title, data, onChange }) => (
  <div style={{ ...pageCard, padding: "16px 20px" }}>
    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
      <Users style={{ width: 14, height: 14 }} /> {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <InputField icon={<User style={{ width: 14, height: 14 }} />} label="Name" name="name" value={data?.name} onChange={onChange} />
      <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Mobile" name="mobile" value={data?.mobile} onChange={onChange} />
      <InputField icon={<Mail style={{ width: 14, height: 14 }} />} label="Email" name="email" value={data?.email} onChange={onChange} type="email" />
    </div>
  </div>
);

export default Profile;
