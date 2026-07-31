import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import {
  Camera, Save, Loader2, Mail, Phone, Building2, Shield,
  User, Lock, Eye, EyeOff, CheckCircle,
  GraduationCap, BookOpen, CalendarDays, Droplets, MapPin, Users,
  Briefcase, BadgeCheck, Heart, ClipboardList,
} from "lucide-react";
import { changePassword, currentUser, updateUser } from "../features/authSlice";
import {
  fetchStudentProfile,
  fetchStudentEnrollment,
  updateStudentProfile,
} from "../features/studentPortalSlice";
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, pageCard, avatarStyle } from "../styles/pageStyles";

/* ── Role groups ── */
const STUDENT_ROLE = "Student";
const PARENT_ROLE  = "Parent";

// Roles that show employee/staff details section
const EMPLOYEE_ROLES = new Set([
  "Super Admin", "School Admin", "Principal", "Vice Principal",
  "Teacher", "Subject Coordinator", "Exam Coordinator",
  "Accountant", "Staff", "Support Staff",
  "Librarian", "Hostel Warden", "Transport Manager",
  "Receptionist", "IT Support", "Counselor", "Security",
]);

/* ── helpers ── */
const getInitials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const fmtDate  = (v) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const display  = (v) => {
  if (!v) return "—";
  if (typeof v === "object") return v?.name || v?.title || "—";
  return v;
};

/* ══════════════════════════════════════════════════════════ */
const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth || {});
  const {
    profile: studentProfile,
    enrollment,
    loading: portalLoading,
  } = useSelector((s) => s.studentPortal || {});

  const roleName   = user?.role?.name || user?.roleId?.name || "";
  const isStudent  = roleName === STUDENT_ROLE;
  const isEmployee = EMPLOYEE_ROLES.has(roleName);

  /* ── form state ── */
  const [profileForm,  setProfileForm]  = useState({ name: "", email: "", phone: "" });
  const [empForm,      setEmpForm]      = useState({
    gender: "", dateOfBirth: "", address: "", joiningDate: "",
    qualification: "", emergencyContactName: "", emergencyContactPhone: "",
  });
  const [studentInfo, setStudentInfo]   = useState({ dateOfBirth: "", gender: "", bloodGroup: "", address: "" });
  const [fatherInfo,  setFatherInfo]    = useState({ name: "", mobile: "", email: "" });
  const [motherInfo,  setMotherInfo]    = useState({ name: "", mobile: "", email: "" });
  const [pwdForm,     setPwdForm]       = useState({ current: "", newPwd: "", confirm: "" });

  /* ── ui state ── */
  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pwdLoading,     setPwdLoading]     = useState(false);
  const [saveMsg,        setSaveMsg]        = useState({ text: "", error: false });
  const [pwdMsg,         setPwdMsg]         = useState({ text: "", error: false });

  const fileInputRef = useRef(null);

  /* ── data loading ── */
  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!isStudent) return;
    dispatch(fetchStudentProfile());
    dispatch(fetchStudentEnrollment());
  }, [isStudent, dispatch]);

  /* ── sync user → form ── */
  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name:  user.name  || "",
      email: user.email || "",
      phone: user.phone || "",
    });
    setEmpForm({
      gender:               user.gender               || "",
      dateOfBirth:          fmtDate(user.dateOfBirth),
      address:              user.address              || "",
      joiningDate:          fmtDate(user.joiningDate),
      qualification:        user.qualification        || "",
      emergencyContactName: user.emergencyContactName  || "",
      emergencyContactPhone:user.emergencyContactPhone || "",
    });
  }, [user]);

  useEffect(() => {
    if (!studentProfile) return;
    setProfileForm((p) => ({
      name:  p.name  || studentProfile?.userId?.name  || "",
      email: p.email || studentProfile?.userId?.email || "",
      phone: p.phone || studentProfile?.userId?.phone || "",
    }));
    setStudentInfo({
      dateOfBirth: fmtDate(studentProfile.dateOfBirth),
      gender:      studentProfile.gender      || "",
      bloodGroup:  studentProfile.bloodGroup  || "",
      address:     studentProfile.address     || "",
    });
    setFatherInfo({
      name:   studentProfile?.fatherInfo?.name   || studentProfile?.fatherId?.name  || "",
      mobile: studentProfile?.fatherInfo?.mobile || studentProfile?.fatherId?.phone || studentProfile?.fatherId?.mobile || "",
      email:  studentProfile?.fatherInfo?.email  || studentProfile?.fatherId?.email || "",
    });
    setMotherInfo({
      name:   studentProfile?.motherInfo?.name   || studentProfile?.motherId?.name  || "",
      mobile: studentProfile?.motherInfo?.mobile || studentProfile?.motherId?.phone || studentProfile?.motherId?.mobile || "",
      email:  studentProfile?.motherInfo?.email  || studentProfile?.motherId?.email || "",
    });
  }, [studentProfile]);

  /* ── derived ── */
  const initials       = getInitials(profileForm.name || roleName || "U");
  const registrationNo = enrollment?.registrationNumber || studentProfile?.registrationNumber || "—";
  const classInfo      = enrollment?.schoolClass?.name
    ? `${enrollment.schoolClass.name}${enrollment?.section?.name ? ` - ${enrollment.section.name}` : ""}`
    : studentProfile?.schoolClass?.name
    ? `${studentProfile.schoolClass.name}${studentProfile?.section?.name ? ` - ${studentProfile.section.name}` : ""}`
    : "—";
  const academicYear   = display(enrollment?.academicYear?.name || studentProfile?.academicYear?.name);

  /* ── handlers ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || "", email: user?.email || "", phone: user?.phone, avatarFile: file })).unwrap();
      setSaveMsg({ text: "Profile photo updated!", error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === "string" ? err : "Failed to update photo", error: true });
    } finally { setUploadingPhoto(false); e.target.value = ""; }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) { setSaveMsg({ text: "Name and email are required", error: true }); return; }
    setSaving(true); setSaveMsg({ text: "", error: false });
    try {
      if (isStudent) {
        await dispatch(updateStudentProfile({
          name: profileForm.name, email: profileForm.email, phone: profileForm.phone,
          dateOfBirth: studentInfo.dateOfBirth, gender: studentInfo.gender,
          bloodGroup: studentInfo.bloodGroup, address: studentInfo.address,
          fatherInfo, motherInfo,
        })).unwrap();
        await dispatch(fetchStudentProfile()).unwrap();
      } else {
        await dispatch(updateUser({
          name: profileForm.name, email: profileForm.email, phone: profileForm.phone,
          ...(isEmployee ? empForm : {}),
        })).unwrap();
      }
      setSaveMsg({ text: "Profile updated successfully!", error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === "string" ? err : "Update failed", error: true });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { setPwdMsg({ text: "All fields are required", error: true }); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdMsg({ text: "Passwords do not match", error: true }); return; }
    if (pwdForm.newPwd.length < 6) { setPwdMsg({ text: "At least 6 characters required", error: true }); return; }
    setPwdLoading(true); setPwdMsg({ text: "", error: false });
    try {
      await dispatch(changePassword({ oldPassword: pwdForm.current, newPassword: pwdForm.newPwd })).unwrap();
      setPwdMsg({ text: "Password changed successfully!", error: false });
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } catch (err) {
      setPwdMsg({ text: typeof err === "string" ? err : "Failed to change password", error: true });
    } finally { setPwdLoading(false); }
  };

  if (authLoading || (isStudent && portalLoading && !studentProfile)) {
    return (
      <div style={{ ...pageWrapper, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "var(--text-muted)" }}>
        <Loader2 style={{ width: 20, height: 20 }} /> Loading profile...
      </div>
    );
  }

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div style={pageWrapper}>
      <PageHeader title="My Profile" subtitle="View and update your personal information" icon={<UserOutlined />} />

      {/* ── Hero Card ── */}
      <div style={{ ...pageCard, marginTop: 16, padding: "20px 24px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Change profile photo"
              style={{ position: "relative", flexShrink: 0, cursor: "pointer" }}
              onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !uploadingPhoto) { e.preventDefault(); fileInputRef.current?.click(); } }}
              title="Click to change photo"
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-muted)", display: "block" }} />
                : <div style={avatarStyle(profileForm.name || "U", 56)}>{initials}</div>
              }
              {uploadingPhoto
                ? <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}><Spin size="small" /></div>
                : <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, borderRadius: "50%", background: "var(--primary,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,.25)" }}>
                    <Camera style={{ width: 10, height: 10, color: "#fff" }} />
                  </div>
              }
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{profileForm.name || roleName || "—"}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                {isEmployee && user?.designation?.title ? `${user.designation.title} · ` : ""}{profileForm.email || "No email"}
              </div>
              <span style={{ display: "inline-block", marginTop: 6, fontSize: 11, background: "rgba(220,252,231,.2)", color: "#22C55E", padding: "2px 10px", borderRadius: 99, fontWeight: 600 }}>
                {isStudent ? "Active Student" : (user?.isActive ? "Active" : "Inactive")}
              </span>
            </div>
          </div>

          {/* Info badges — role-specific */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, flex: "1 1 340px", maxWidth: 480 }}>
            {isStudent ? (
              <>
                <InfoBadge icon={<GraduationCap style={{ width: 14, height: 14 }} />} label="Registration" value={registrationNo} />
                <InfoBadge icon={<BookOpen      style={{ width: 14, height: 14 }} />} label="Class"         value={classInfo} />
                <InfoBadge icon={<CalendarDays  style={{ width: 14, height: 14 }} />} label="Academic Year"  value={academicYear} />
              </>
            ) : (
              <>
                <InfoBadge icon={<Shield    style={{ width: 14, height: 14 }} />} label="Role"        value={roleName} />
                <InfoBadge icon={<Building2 style={{ width: 14, height: 14 }} />} label="Department"  value={user?.department?.name || user?.school?.name || "—"} />
                <InfoBadge icon={<BadgeCheck style={{ width: 14, height: 14 }} />} label="Employee ID" value={user?.regId || "—"} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Form ── */}
      <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>

        <div style={{ ...pageCard, padding: "20px 24px", gridColumn: "span 2" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
              {isStudent ? "Student Profile" : isEmployee ? "Employee Profile" : "My Profile"}
            </div>
            <button type="submit" disabled={saving} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, background: "var(--primary,#7c3aed)", color: "#fff", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: 13, opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

          {/* Account Details — all roles */}
          <Section title="Account Details">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <InputField icon={<User  style={{ width: 14, height: 14 }} />} label="Full Name" name="name"  value={profileForm.name}  onChange={(e) => setProfileForm((p) => ({ ...p, name:  e.target.value }))} required />
              <InputField icon={<Mail  style={{ width: 14, height: 14 }} />} label="Email"     name="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} required />
              <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Phone"     name="phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </Section>

          {/* Employee Details — staff roles only */}
          {isEmployee && (
            <Section title="Employee Details">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <SelectField label="Gender" name="gender" value={empForm.gender} onChange={(e) => setEmpForm((p) => ({ ...p, gender: e.target.value }))} options={["Male", "Female", "Other"]} />
                <InputField icon={<CalendarDays style={{ width: 14, height: 14 }} />} label="Date of Birth"  name="dateOfBirth" type="date" value={empForm.dateOfBirth}   onChange={(e) => setEmpForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                <InputField icon={<Briefcase   style={{ width: 14, height: 14 }} />} label="Joining Date"   name="joiningDate"  type="date" value={empForm.joiningDate}    onChange={(e) => setEmpForm((p) => ({ ...p, joiningDate: e.target.value }))} />
                <InputField icon={<GraduationCap style={{ width: 14, height: 14 }} />} label="Qualification" name="qualification" value={empForm.qualification}   onChange={(e) => setEmpForm((p) => ({ ...p, qualification: e.target.value }))} />
                <InputField icon={<MapPin style={{ width: 14, height: 14 }} />} label="Address" name="address" value={empForm.address} onChange={(e) => setEmpForm((p) => ({ ...p, address: e.target.value }))} />
                <div style={{ display: "contents" }}>
                  {/* read-only department / designation from populated data */}
                  {user?.department?.name && (
                    <ReadField icon={<Building2 style={{ width: 14, height: 14 }} />} label="Department"  value={user.department.name} />
                  )}
                  {user?.designation?.title && (
                    <ReadField icon={<BadgeCheck style={{ width: 14, height: 14 }} />} label="Designation" value={`${user.designation.title}${user.designation.level ? ` (${user.designation.level})` : ""}`} />
                  )}
                </div>
              </div>
            </Section>
          )}

          {/* Emergency Contact — employee only */}
          {isEmployee && (
            <Section title="Emergency Contact">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <InputField icon={<Heart style={{ width: 14, height: 14 }} />} label="Contact Name"  name="emergencyContactName"  value={empForm.emergencyContactName}  onChange={(e) => setEmpForm((p) => ({ ...p, emergencyContactName: e.target.value }))} />
                <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Contact Phone" name="emergencyContactPhone" value={empForm.emergencyContactPhone} onChange={(e) => setEmpForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))} />
              </div>
            </Section>
          )}

          {/* Student extra fields */}
          {isStudent && (
            <Section title="Student Details">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <SelectField label="Gender" name="gender" value={studentInfo.gender} onChange={(e) => setStudentInfo((p) => ({ ...p, gender: e.target.value }))} options={["Male", "Female", "Other"]} />
                <InputField icon={<Droplets    style={{ width: 14, height: 14 }} />} label="Blood Group"   name="bloodGroup"  value={studentInfo.bloodGroup}  onChange={(e) => setStudentInfo((p) => ({ ...p, bloodGroup: e.target.value }))} />
                <InputField icon={<CalendarDays style={{ width: 14, height: 14 }} />} label="Date of Birth" name="dateOfBirth" type="date" value={studentInfo.dateOfBirth} onChange={(e) => setStudentInfo((p) => ({ ...p, dateOfBirth: e.target.value }))} />
                <InputField icon={<MapPin      style={{ width: 14, height: 14 }} />} label="Address"       name="address"    value={studentInfo.address}    onChange={(e) => setStudentInfo((p) => ({ ...p, address: e.target.value }))} />
              </div>
            </Section>
          )}

          {saveMsg.text && <p style={{ fontSize: 13, color: saveMsg.error ? "#EF4444" : "#22C55E", margin: "8px 0 0" }}>{saveMsg.text}</p>}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {isStudent ? (
            <>
              <GuardianCard title="Father Details" data={fatherInfo} onChange={(e) => setFatherInfo((p) => ({ ...p, [e.target.name]: e.target.value }))} />
              <GuardianCard title="Mother Details" data={motherInfo} onChange={(e) => setMotherInfo((p) => ({ ...p, [e.target.name]: e.target.value }))} />
            </>
          ) : (
            <>
              <div style={{ ...pageCard, padding: "16px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <Building2 style={{ width: 14, height: 14 }} /> {isEmployee ? "Work Info" : "School"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{user?.school?.name || "—"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{roleName}</div>
                  {isEmployee && user?.department?.name && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.department.name}</div>
                  )}
                  {isEmployee && user?.joiningDate && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Joined: {new Date(user.joiningDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </div>
                  )}
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, background: "rgba(220,252,231,.4)", color: "#15803D", padding: "3px 10px", borderRadius: 99, fontWeight: 600, width: "fit-content", marginTop: 4 }}>
                    <CheckCircle style={{ width: 11, height: 11 }} /> {user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              <div style={{ ...pageCard, padding: "16px 20px" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  <ClipboardList style={{ width: 14, height: 14 }} /> Summary
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Employee ID", value: user?.regId || "—" },
                    { label: "Email",       value: profileForm.email || "—" },
                    { label: "Phone",       value: profileForm.phone || "Not set" },
                    ...(isEmployee && empForm.qualification ? [{ label: "Qualification", value: empForm.qualification }] : []),
                    ...(isEmployee && user?.designation?.title ? [{ label: "Designation", value: user.designation.title }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".5px" }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-all" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </form>

      {/* ── Password Section ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 16 }}>
        <form onSubmit={handleChangePassword} style={{ ...pageCard, padding: "20px 24px", gridColumn: "span 2" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)", marginBottom: 4 }}>Change Password</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>Update your account password</div>
          <Section title="Password">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <PwdField label="Current Password" value={pwdForm.current} onChange={(v) => setPwdForm((p) => ({ ...p, current: v }))} placeholder="Enter current password" />
              <PwdField label="New Password"     value={pwdForm.newPwd}  onChange={(v) => setPwdForm((p) => ({ ...p, newPwd:  v }))} placeholder="Min 6 characters" />
              <PwdField label="Confirm Password" value={pwdForm.confirm} onChange={(v) => setPwdForm((p) => ({ ...p, confirm: v }))} placeholder="Repeat new password" />
            </div>
          </Section>
          {pwdMsg.text && <p style={{ fontSize: 13, color: pwdMsg.error ? "#EF4444" : "#22C55E", margin: "8px 0 0" }}>{pwdMsg.text}</p>}
          <button type="submit" disabled={pwdLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary,#7c3aed)", color: "#fff", border: "none", cursor: pwdLoading ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600, opacity: pwdLoading ? 0.6 : 1 }}>
            {pwdLoading ? <Loader2 style={{ width: 14, height: 14 }} /> : <Lock style={{ width: 14, height: 14 }} />}
            {pwdLoading ? "Updating…" : "Update Password"}
          </button>
        </form>

        <div style={{ ...pageCard, padding: "16px 20px", background: "var(--surface-soft)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 12 }}>Password Tips</div>
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {["At least 8 characters", "Mix uppercase & lowercase", "Include numbers & symbols", "Avoid your name or email"].map((tip) => (
              <li key={tip} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-muted)" }}>
                <CheckCircle style={{ width: 13, height: 13, color: "#10B981", flexShrink: 0 }} />{tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

/* ── Sub-components ── */

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const InfoBadge = ({ icon, label, value }) => (
  <div style={{ borderRadius: 10, border: "1px solid var(--border-muted)", background: "var(--surface-soft)", padding: "10px 12px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{icon}{label}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
  </div>
);

const fieldStyle = {
  display: "flex", alignItems: "center",
  border: "1px solid var(--border-muted)", borderRadius: 8,
  padding: "8px 12px", gap: 8, background: "var(--surface)",
};

const InputField = ({ icon, label, name, value, onChange, type = "text", required = false }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    <div style={fieldStyle}>
      {icon && <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>}
      <input type={type} name={name} value={value || ""} onChange={onChange} required={required}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
    </div>
  </label>
);

const ReadField = ({ icon, label, value }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    <div style={{ ...fieldStyle, background: "var(--surface-soft)", cursor: "default" }}>
      {icon && <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1, fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{value || "—"}</span>
    </div>
  </label>
);

const SelectField = ({ label, name, value, onChange, options }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
    <div style={fieldStyle}>
      <select name={name} value={value || ""} onChange={onChange}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }}>
        <option value="">Select {label}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  </label>
);

const PwdField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</span>
      <div style={{ ...fieldStyle, paddingRight: 8 }}>
        <Lock style={{ width: 14, height: 14, color: "var(--text-muted)", flexShrink: 0 }} />
        <input type={show ? "text" : "password"} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, background: "transparent", color: "var(--text-primary)" }} />
        <button type="button" onClick={() => setShow((s) => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", padding: 4 }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </label>
  );
};

const GuardianCard = ({ title, data, onChange }) => (
  <div style={{ ...pageCard, padding: "16px 20px" }}>
    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
      <Users style={{ width: 14, height: 14 }} /> {title}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <InputField icon={<User  style={{ width: 14, height: 14 }} />} label="Name"   name="name"   value={data?.name}   onChange={onChange} />
      <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Mobile" name="mobile" value={data?.mobile} onChange={onChange} />
      <InputField icon={<Mail  style={{ width: 14, height: 14 }} />} label="Email"  name="email"  value={data?.email}  onChange={onChange} type="email" />
    </div>
  </div>
);

export default Profile;
