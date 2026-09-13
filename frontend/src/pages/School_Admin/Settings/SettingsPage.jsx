import React, { useCallback, useEffect, useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { changePassword, updateUser } from "../../../features/authSlice";
import {
  fetchAllAcademicYears,
  fetchActiveAcademicYear,
  setActiveAcademicYear,
  setSelectedAcademicYear,
} from "../../../features/academicYearSlice";
import apiClient from "../../../api/httpClient";
import { fetch2FAStatus } from "../../../features/twoFactorSlice";
import PaymentGatewaySettings from "../../../components/settings/PaymentGatewaySettings.jsx";

import {
  Alert,
  Button,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  Upload,
  message,
} from "antd";

import {
  BankOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  MessageOutlined,
  ReloadOutlined,
  SafetyOutlined,
  SaveOutlined,
  SettingOutlined,
  SolutionOutlined,
  UploadOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";

import PageHeader from "../../../components/layout/PageHeader.jsx";
import { avatarStyle, iconWell, pageWrapper, sectionPanel } from "../../../styles/pageStyles.js";

const { Text } = Typography;

/* ── Constants ───────────────────────────────────────────────────── */
// Only settings that actually do something live on this page. Language, timezone, a
// notifications switch, a "default role" and backup preferences used to be here too, but nothing
// in the app ever read them — they were saved to this browser's localStorage and ignored.
const TAB_FIELDS = {
  profile:     ["fullName", "email", "phone"],
  preferences: ["theme"],
  school:      ["academicYear"],
  security:    ["currentPassword", "newPassword", "confirmPassword"],
};

// Keys the removed settings were stored under; cleared so they stop lingering in the browser.
const LEGACY_STORAGE_PREFIXES = ["schooladmin-settings", "schooladmin-defaultrole"];

const TAB_COLORS = {
  profile:      "var(--primary)",
  preferences:  "var(--purple)",
  school:       "var(--success)",
  communication:"var(--info)",
  security:     "var(--danger)",
};

/* ── Password strength ───────────────────────────────────────────── */
const getStrength = (pwd = "") => {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)           s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
};
const STRENGTH = [
  { label: "Weak",   color: "var(--danger)", pct: 25 },
  { label: "Fair",   color: "var(--warning)", pct: 50 },
  { label: "Good",   color: "var(--info)", pct: 75 },
  { label: "Strong", color: "var(--success)", pct: 100 },
];

/* ── Small reusable pieces ───────────────────────────────────────── */
const SectionTitle = ({ icon, label, description, color = "var(--primary)" }) => (
  <Flex align="center" gap={12} style={{ marginBottom: 20 }}>
    <div style={iconWell(color, 38)}>
      <span style={{ fontSize: 17 }}>{icon}</span>
    </div>
    <div>
      <Text strong style={{ fontSize: 14, color: "var(--text-primary)", display: "block" }}>{label}</Text>
      {description && <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>{description}</Text>}
    </div>
  </Flex>
);

const InfoBox = ({ icon, children }) => (
  <div style={{
    background: "var(--surface-soft)", border: "1px dashed var(--border-muted)",
    borderRadius: 12, padding: "12px 16px",
    display: "flex", alignItems: "flex-start", gap: 10,
    color: "var(--text-muted)", fontSize: 13, marginTop: 8,
  }}>
    <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
    <span>{children}</span>
  </div>
);

/* Pulsing orange dot shown on tabs that have unsaved changes */
const DirtyDot = () => (
  <span className="settings-dirty-dot" style={{
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--warning)", display: "inline-block", marginLeft: 6, flexShrink: 0,
  }} />
);

/* ── Main component ──────────────────────────────────────────────── */
const Settings = () => {
  const dispatch = useDispatch();
  const { themeMode, setThemeMode } = useTheme();

  const { user }                                         = useSelector((s) => s.auth || {});
  const { academicYears = [], activeYear, loading: yearLoading } = useSelector((s) => s.academicYear || {});

  const schoolId = user?.school?._id;

  const [form]         = Form.useForm();
  const [commsForm]    = Form.useForm();

  const [isSaving,        setIsSaving]        = useState(false);
  const [isCommsSaving,   setIsCommsSaving]   = useState(false);
  const [admissionsOpen,  setAdmissionsOpen]  = useState(true);
  const [isAdmissionsSaving, setIsAdmissionsSaving] = useState(false);
  const [avatarFile,      setAvatarFile]      = useState(null);
  const [avatarPreview,   setAvatarPreview]   = useState(null);
  const [dirtyTabs,       setDirtyTabs]       = useState(new Set());
  const [pwdStrength,     setPwdStrength]     = useState(0);
  const [activeTab,       setActiveTab]       = useState("profile");
  const [saveSuccess,     setSaveSuccess]     = useState(false);
  const [twoFactor,       setTwoFactor]       = useState({ loading: true, enabled: false });

  const isDirty = dirtyTabs.size > 0;


  const navigate = useNavigate();

  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter((k) => LEGACY_STORAGE_PREFIXES.some((prefix) => k.startsWith(prefix)))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* storage unavailable */ }
  }, []);

  /* ── Load data ─────────────────────────────────────────────────── */
  useEffect(() => {
    dispatch(fetch2FAStatus())
      .unwrap()
      .then((data) => setTwoFactor({ loading: false, enabled: Boolean(data?.twoFactorEnabled) }))
      .catch(() => setTwoFactor({ loading: false, enabled: false }));
  }, [dispatch]);

  useEffect(() => {
    if (schoolId) {
      dispatch(fetchAllAcademicYears(schoolId));
      dispatch(fetchActiveAcademicYear(schoolId));
    }
  }, [dispatch, schoolId]);

  useEffect(() => {
    (async () => {
      try {
        const res    = await apiClient.get("/communication-settings");
        const config = res?.data?.data || {};
        commsForm.setFieldsValue({
          provider:           config.provider || "none",
          accountSid:         config.accountSid || "",
          authToken:          "",
          smsFromNumber:      config.smsFromNumber || "",
          whatsappFromNumber: config.whatsappFromNumber || "",
          isSmsEnabled:       Boolean(config.isSmsEnabled),
          isWhatsappEnabled:  Boolean(config.isWhatsappEnabled),
        });
      } catch { /* config may not exist yet */ }
    })();
  }, [commsForm]);

  /* populate form when user / active academic year are ready */
  // The academic year shown is always the school's active year as the server reports it — never
  // a value remembered in this browser. A remembered year could be one another admin has since
  // replaced, and saving an unrelated change here would silently switch the whole school back.
  useEffect(() => {
    if (!user) return;
    form.setFieldsValue({
      fullName:        user?.name  || "",
      email:           user?.email || "",
      phone:           user?.phone || "",
      academicYear:    activeYear?._id || null,
      theme:           themeMode || "system",
      currentPassword: "",
      newPassword:     "",
      confirmPassword: "",
    });
    setDirtyTabs(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form, activeYear?._id]);

  /* keep theme field in sync if changed externally */
  useEffect(() => { form.setFieldValue("theme", themeMode); }, [themeMode, form]);

  /* ── Dirty-state tracking ──────────────────────────────────────── */
  const handleValuesChange = useCallback((changedValues) => {
    /* rebuild dirty set from all touched fields */
    const newDirty = new Set();
    Object.entries(TAB_FIELDS).forEach(([tab, fields]) => {
      if (fields.some((f) => form.isFieldTouched(f))) newDirty.add(tab);
    });
    setDirtyTabs(newDirty);

    /* immediate theme preview */
    if (changedValues.theme !== undefined) setThemeMode(changedValues.theme);

    /* live password strength */
    if (changedValues.newPassword !== undefined) {
      setPwdStrength(getStrength(changedValues.newPassword));
    }
  }, [form, setThemeMode]);

  /* ── Save ──────────────────────────────────────────────────────── */
  const handleSave = async (values) => {
    setIsSaving(true);
    try {
      const shouldChangePwd = values.currentPassword || values.newPassword || values.confirmPassword;

      const jobs = [
        dispatch(updateUser({
          name:  values.fullName,
          email: values.email,
          phone: values.phone,
          ...(avatarFile ? { avatarFile } : {}),
        })).unwrap(),
      ];

      if (shouldChangePwd) {
        if (!values.currentPassword || !values.newPassword || !values.confirmPassword)
          throw new Error("Fill all three password fields to change your password.");
        if (values.newPassword !== values.confirmPassword)
          throw new Error("New password and confirm password must match.");
        jobs.push(dispatch(changePassword({
          oldPassword: values.currentPassword,
          newPassword: values.newPassword,
        })).unwrap());
      }

      await Promise.all(jobs);

      setThemeMode(values.theme);

      /* switch the school's active academic year — only when it was actually changed here */
      const academicYear = values.academicYear;
      if (academicYear && academicYear !== activeYear?._id && form.isFieldTouched("academicYear")) {
        const yearObj = academicYears.find((y) => y._id === academicYear);
        try {
          await dispatch(setActiveAcademicYear(academicYear)).unwrap();
          if (yearObj) dispatch(setSelectedAcademicYear(yearObj));
          if (schoolId) dispatch(fetchActiveAcademicYear(schoolId));
          message.success("Academic year updated for the whole school.");
        } catch (e) {
          message.warning(`Profile saved, but the academic year could not be changed: ${e?.message || e || "API error"}`);
        }
      }

      form.setFieldsValue({ currentPassword: "", newPassword: "", confirmPassword: "" });
      form.resetFields(["currentPassword", "newPassword", "confirmPassword"]);
      setAvatarFile(null);
      setDirtyTabs(new Set());
      setPwdStrength(0);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      message.success("Settings saved successfully!");
    } catch (err) {
      message.error(err?.message || "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Discard changes ───────────────────────────────────────────── */
  const handleReset = () => {
    if (!user) return;
    form.resetFields();
    form.setFieldsValue({
      fullName:        user?.name  || "",
      email:           user?.email || "",
      phone:           user?.phone || "",
      academicYear:    activeYear?._id || null,
      theme:           themeMode || "system",
      currentPassword: "",
      newPassword:     "",
      confirmPassword: "",
    });
    setDirtyTabs(new Set());
    setAvatarFile(null);
    setAvatarPreview(null);
    setPwdStrength(0);
    message.info("Unsaved changes discarded.");
  };

  /* ── Online admissions toggle ──────────────────────────────────── */
  // Drives School.admissionsOpen, which decides whether this school is listed on — and accepts
  // submissions from — the public portal at /admissions. Kept separate from isActive so closing
  // intake never risks deactivating the tenant.
  useEffect(() => {
    if (!schoolId) return;
    apiClient
      .get(`/school/${schoolId}`)
      .then((res) => {
        const school = res.data?.data;
        if (school) setAdmissionsOpen(school.admissionsOpen !== false);
      })
      .catch(() => { /* leave the default; the toggle just won't reflect a stale value */ });
  }, [schoolId]);

  const handleAdmissionsToggle = async (checked) => {
    const previous = admissionsOpen;
    setAdmissionsOpen(checked);          // optimistic
    setIsAdmissionsSaving(true);
    try {
      await apiClient.post(`/school/update/${schoolId}`, { admissionsOpen: checked });
      message.success(checked ? "Online admissions are now open." : "Online admissions are now closed.");
    } catch (err) {
      setAdmissionsOpen(previous);       // roll back so the switch never lies
      message.error(err?.response?.data?.message || "Unable to update admission settings.");
    } finally {
      setIsAdmissionsSaving(false);
    }
  };

  /* ── Communication (SMS/WhatsApp) save ─────────────────────────── */
  const handleCommsSave = async (values) => {
    setIsCommsSaving(true);
    try {
      const res = await apiClient.put("/communication-settings", values);
      message.success("Communication settings saved successfully.");
      commsForm.setFieldValue("authToken", "");
      const saved = res?.data?.data;
      if (saved) {
        commsForm.setFieldsValue({
          accountSid: saved.accountSid || "",
          smsFromNumber: saved.smsFromNumber || "",
          whatsappFromNumber: saved.whatsappFromNumber || "",
        });
      }
    } catch (err) {
      message.error(err?.response?.data?.message || "Unable to save communication settings.");
    } finally {
      setIsCommsSaving(false);
    }
  };

  /* ── Avatar handling ───────────────────────────────────────────── */
  const handleAvatarSelect = (file) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
    return false; // prevent auto-upload
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  /* ── Helpers ───────────────────────────────────────────────────── */
  const tabLabel = (key, icon, label) => (
    <Flex align="center" gap={7}>
      {icon}
      <span>{label}</span>
      {dirtyTabs.has(key) && <DirtyDot />}
    </Flex>
  );

  const str = STRENGTH[Math.min(pwdStrength, 3)];

  const isLoading = yearLoading;
  const userName  = user?.name || "User";
  const userAvatarStyle = avatarStyle(userName, 64);

  /* ── Tab content ───────────────────────────────────────────────── */
  const tabItems = [
    {
      key: "profile",
      label: tabLabel("profile", <UserOutlined />, "Profile"),
      children: (
        <div>
          <SectionTitle
            icon={<UserOutlined />} color="var(--primary)"
            label="Personal Information"
            description="Update your display name, email address, phone, and profile photo."
          />

          {/* Avatar row */}
          <Flex align="center" gap={20} style={{ marginBottom: 24, padding: "16px 20px", background: "var(--surface-soft)", borderRadius: 12, border: "1px solid var(--border-muted)" }}>
            <div style={{ position: "relative" }}>
              <div style={{ ...userAvatarStyle, width: 64, height: 64, fontSize: 24, overflow: "hidden" }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (user?.avatar
                    ? <img src={user.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : userName[0]?.toUpperCase())}
              </div>
              {avatarPreview && (
                <Tag color="orange" style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", fontSize: 10, borderRadius: 99 }}>
                  Preview
                </Tag>
              )}
            </div>
            <div>
              <Text strong style={{ display: "block", color: "var(--text-primary)" }}>{userName}</Text>
              <Text style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>{user?.email}</Text>
              <Upload
                maxCount={1} listType="text" showUploadList={false}
                beforeUpload={handleAvatarSelect} onRemove={handleAvatarRemove} accept="image/*"
                style={{ marginTop: 8 }}
              >
                <Button size="small" icon={<UploadOutlined />} style={{ marginTop: 8 }}>
                  {avatarPreview ? "Change Photo" : "Upload Photo"}
                </Button>
              </Upload>
              {avatarPreview && (
                <Button size="small" type="link" danger style={{ paddingLeft: 0, marginTop: 2 }} onClick={handleAvatarRemove}>
                  Remove
                </Button>
              )}
            </div>
          </Flex>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: "Full name is required" }]}>
                <Input prefix={<UserOutlined />} placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email"
                rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Enter a valid email" }]}>
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },

    {
      key: "preferences",
      label: tabLabel("preferences", <SettingOutlined />, "Preferences"),
      children: (
        <div>
          <SectionTitle
            icon={<SettingOutlined />} color="var(--purple)"
            label="Display"
            description="Choose how the portal looks on this device. Changes apply immediately."
          />
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item label="Theme" name="theme"
                extra={<Text style={{ fontSize: 11, color: "var(--text-muted)" }}>Applied instantly on change</Text>}>
                <Select
                  options={[
                    { value: "light",  label: "☀️  Light" },
                    { value: "dark",   label: "🌙  Dark" },
                    { value: "system", label: "💻  System Default" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </div>
      ),
    },

    {
      key: "school",
      label: tabLabel("school", <BankOutlined />, "School"),
      children: (
        <div>
          <SectionTitle
            icon={<BankOutlined />} color="var(--success)"
            label="School Configuration"
            description="The academic year that reports, timetables, attendance and fees use across the school."
          />
          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Active Academic Year" name="academicYear"
                extra="Changing this and saving switches the active year for everyone in the school.">
                <Select
                  placeholder={yearLoading ? "Loading academic years…" : "Select academic year"}
                  loading={yearLoading}
                  options={academicYears.map((y) => ({
                    value: y._id,
                    label: y.isActive ? `${y.name} (Active)` : y.name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <InfoBox icon={<BankOutlined />}>
                Only a year you pick here and save is activated. Saving other changes on this page never
                switches the academic year.
              </InfoBox>
            </Col>
          </Row>

          <Divider style={{ margin: "8px 0 20px" }} />

          <SectionTitle
            icon={<SolutionOutlined />} color="var(--primary)"
            label="Online Admissions"
            description="Let parents apply to this school from the public admission portal."
          />
          <Flex align="center" justify="space-between" wrap="wrap" gap={12} style={{ marginBottom: 12 }}>
            <Form.Item
              label="Accept online applications"
              style={{ margin: 0 }}
              extra={
                admissionsOpen
                  ? "Your school is listed on the public portal and can receive applications."
                  : "Your school is hidden from the portal and new applications are refused."
              }
            >
              <Switch
                checked={admissionsOpen}
                loading={isAdmissionsSaving}
                onChange={handleAdmissionsToggle}
              />
            </Form.Item>
          </Flex>
          <InfoBox icon={<SolutionOutlined />}>
            Applications arrive under <strong>Admissions → Inquiries</strong> alongside your walk-in
            enquiries. Share this link with parents:{" "}
            <a href="/admissions" target="_blank" rel="noreferrer">
              {typeof window !== "undefined" ? `${window.location.origin}/admissions` : "/admissions"}
            </a>
          </InfoBox>

          <Divider style={{ margin: "20px 0" }} />

          <PaymentGatewaySettings />
        </div>
      ),
    },

    {
      key: "communication",
      label: tabLabel("communication", <MessageOutlined />, "Communication"),
      // Rendered up front: the saved settings are loaded into this tab's form on page load, and a
      // form that is not mounted yet cannot receive them.
      forceRender: true,
      children: (
        <div>
          <SectionTitle
            icon={<MessageOutlined />} color={TAB_COLORS.communication}
            label="SMS & WhatsApp Sender"
            description="Use your own Twilio account to send SMS and WhatsApp notifications under your school's own number. Leave disabled to keep using the platform's shared sender."
          />
          {/* component={false}: this whole page already sits inside one <form>, and HTML does not
              allow a <form> inside another. The Save button submits this form directly. */}
          <Form form={commsForm} layout="vertical" onFinish={handleCommsSave} component={false}>
            <Row gutter={[16, 0]}>
              <Col xs={24} md={8}>
                <Form.Item label="Provider" name="provider">
                  <Select
                    options={[
                      { value: "none",   label: "None — use platform default" },
                      { value: "twilio", label: "Twilio (own account)" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Twilio Account SID" name="accountSid">
                  <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Twilio Auth Token" name="authToken" extra="Leave blank to keep the existing token.">
                  <Input.Password placeholder="Enter new auth token (optional)" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Flex align="center" gap={6}><MessageOutlined />SMS From Number</Flex>} name="smsFromNumber">
                  <Input placeholder="+1XXXXXXXXXX" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label={<Flex align="center" gap={6}><WhatsAppOutlined />WhatsApp From Number</Flex>} name="whatsappFromNumber">
                  <Input placeholder="+1XXXXXXXXXX" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <div style={{ background: "var(--surface-soft)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border-muted)" }}>
                  <Row gutter={[16, 12]}>
                    <Col xs={24} md={12}>
                      <Flex align="center" justify="space-between" gap={12}>
                        <div>
                          <Flex align="center" gap={8} style={{ marginBottom: 2 }}>
                            <MessageOutlined style={{ color: TAB_COLORS.communication }} />
                            <Text strong style={{ color: "var(--text-primary)" }}>Enable SMS</Text>
                          </Flex>
                          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Send SMS notifications via this Twilio account.
                          </Text>
                        </div>
                        <Form.Item name="isSmsEnabled" valuePropName="checked" style={{ margin: 0 }}>
                          <Switch />
                        </Form.Item>
                      </Flex>
                    </Col>
                    <Col xs={24} md={12}>
                      <Flex align="center" justify="space-between" gap={12}>
                        <div>
                          <Flex align="center" gap={8} style={{ marginBottom: 2 }}>
                            <WhatsAppOutlined style={{ color: TAB_COLORS.communication }} />
                            <Text strong style={{ color: "var(--text-primary)" }}>Enable WhatsApp</Text>
                          </Flex>
                          <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            Send WhatsApp notifications via this Twilio account.
                          </Text>
                        </div>
                        <Form.Item name="isWhatsappEnabled" valuePropName="checked" style={{ margin: 0 }}>
                          <Switch />
                        </Form.Item>
                      </Flex>
                    </Col>
                  </Row>
                </div>
              </Col>
              <Col xs={24}>
                <Flex justify="flex-end" style={{ marginTop: 4 }}>
                  <Button
                    type="primary" icon={<SaveOutlined />} onClick={() => commsForm.submit()}
                    loading={isCommsSaving} style={{ background: TAB_COLORS.communication, borderColor: TAB_COLORS.communication }}
                  >
                    Save Communication Settings
                  </Button>
                </Flex>
              </Col>
            </Row>
          </Form>
          <InfoBox icon={<MessageOutlined />}>
            A Twilio Account SID and Auth Token are required before enabling SMS or WhatsApp. Get these from your{" "}
            <a href="https://console.twilio.com" target="_blank" rel="noreferrer">Twilio Console</a>.
          </InfoBox>
        </div>
      ),
    },

    {
      key: "security",
      label: tabLabel("security", <LockOutlined />, "Security"),
      children: (
        <div>
          <SectionTitle
            icon={<LockOutlined />} color="var(--danger)"
            label="Change Password"
            description="Leave all three fields blank if you don't want to change your password."
          />
          <Row gutter={[16, 0]}>
            <Col xs={24} md={8}>
              <Form.Item label="Current Password" name="currentPassword">
                <Input.Password autoComplete="current-password" placeholder="Current password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="New Password" name="newPassword">
                <Input.Password autoComplete="new-password" placeholder="New password (min 8 chars)" />
              </Form.Item>
              {pwdStrength > 0 && (
                <div style={{ marginTop: -12, marginBottom: 16 }}>
                  <Progress
                    percent={str.pct} strokeColor={str.color} showInfo={false}
                    size="small" style={{ margin: 0 }}
                  />
                  <Text style={{ fontSize: 11, color: str.color, fontWeight: 600 }}>
                    {str.label} password
                    {pwdStrength < 3 && " — add uppercase, numbers, symbols"}
                  </Text>
                </div>
              )}
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Confirm Password" name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[({ getFieldValue }) => ({
                  validator(_, val) {
                    if (!val || getFieldValue("newPassword") === val) return Promise.resolve();
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                })]}>
                <Input.Password autoComplete="new-password" placeholder="Re-enter new password" />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "4px 0 20px" }} />

          <SectionTitle
            icon={<SafetyOutlined />} color="var(--text-muted)"
            label="Two-Factor Authentication"
            description="Turned on and off from Security Settings, where you confirm with a code."
          />
          <Flex align="center" justify="space-between" wrap="wrap" gap={12}
            style={{ background: "var(--surface-soft)", borderRadius: 12, padding: "16px 20px", border: "1px solid var(--border-muted)" }}>
            <div>
              <Flex align="center" gap={8} style={{ marginBottom: 2 }}>
                <Text strong style={{ color: "var(--text-primary)" }}>Email one-time code at login</Text>
                {twoFactor.loading
                  ? <Spin size="small" />
                  : <Tag color={twoFactor.enabled ? "success" : "default"} style={{ borderRadius: 99 }}>{twoFactor.enabled ? "On" : "Off"}</Tag>}
              </Flex>
              <Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {twoFactor.enabled
                  ? "A code sent to your email is required every time you log in."
                  : "Protect this admin account: require a code from your email in addition to your password."}
              </Text>
            </div>
            <Button icon={<SafetyOutlined />} onClick={() => navigate("/dashboard/security-settings")}>
              {twoFactor.enabled ? "Manage" : "Turn on"}
            </Button>
          </Flex>

        </div>
      ),
    },

  ];

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        /* Tab nav */
        .settings-tabs .ant-tabs-nav {
          background: var(--surface-soft) !important;
          border-right: 1px solid var(--border-muted) !important;
          margin: 0 !important;
          min-width: 190px !important;
          padding: 12px 8px !important;
        }
        .settings-tabs .ant-tabs-tab {
          border-radius: 10px !important;
          padding: 10px 14px !important;
          margin: 2px 0 !important;
          transition: background 0.18s ease !important;
        }
        .settings-tabs .ant-tabs-tab:hover { background: var(--surface) !important; }
        .settings-tabs .ant-tabs-tab-active { background: rgba(37,99,235,0.09) !important; }
        .settings-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: var(--primary) !important; font-weight: 600 !important; }
        .settings-tabs .ant-tabs-ink-bar { display: none !important; }
        .settings-tabs .ant-tabs-content-holder { padding: 28px 28px !important; }

        /* Dirty dot pulse */
        @keyframes settings-dot-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(0.75); }
        }
        .settings-dirty-dot { animation: settings-dot-pulse 1.4s ease-in-out infinite; }

        /* Save-button pulse when dirty */
        @keyframes settings-btn-glow {
          0%   { box-shadow: 0 0 0 0   rgba(var(--primary-rgb),0.45); }
          70%  { box-shadow: 0 0 0 9px rgba(var(--primary-rgb),0);    }
          100% { box-shadow: 0 0 0 0   rgba(var(--primary-rgb),0);    }
        }
        .settings-save-dirty { animation: settings-btn-glow 1.8s ease-in-out infinite; }

        /* Success flash */
        @keyframes settings-save-flash {
          0%,100% { background: var(--success); border-color: var(--success); }
          50%      { background: var(--success-hover); border-color: var(--success-hover); }
        }
        .settings-save-success { animation: settings-save-flash 0.5s ease-in-out 2; }

        @media (max-width: 575px) {
          .settings-tabs .ant-tabs-content-holder { padding: 16px !important; }
          .settings-tabs .ant-tabs-nav { min-width: unset !important; padding: 8px !important; }
        }
      `}</style>

      <PageHeader
        title="Settings"
        subtitle="Manage your profile, preferences, security, and system configuration."
        icon={<SettingOutlined />}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={handleReset} disabled={isSaving || !isDirty}>
              Discard Changes
            </Button>
            <Button
              type="primary"
              icon={saveSuccess ? <CheckCircleOutlined /> : <SaveOutlined />}
              onClick={() => form.submit()}
              loading={isSaving}
              className={saveSuccess ? "settings-save-success" : isDirty ? "settings-save-dirty" : ""}
              style={saveSuccess ? { background: "var(--success)", borderColor: "var(--success)" } : {}}
            >
              {isSaving ? "Saving…" : saveSuccess ? "Saved!" : isDirty ? `Save Changes (${dirtyTabs.size})` : "Save Changes"}
            </Button>
          </Space>
        }
      />

      <div style={pageWrapper}>
        {/* Unsaved-changes banner */}
        {isDirty && (
          <Alert
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 16, borderRadius: 12 }}
            message={
              <Flex align="center" justify="space-between" wrap="wrap" gap={8}>
                <Text style={{ fontSize: 13 }}>
                  Unsaved changes in:{" "}
                  {[...dirtyTabs].map((t) => (
                    <Tag
                      key={t}
                      onClick={() => setActiveTab(t)}
                      style={{
                        borderRadius: 99, cursor: "pointer", fontSize: 11,
                        borderColor: TAB_COLORS[t], color: TAB_COLORS[t],
                        background: `${TAB_COLORS[t]}12`,
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Tag>
                  ))}
                </Text>
                <Button
                  size="small" type="primary" icon={<SaveOutlined />}
                  loading={isSaving} onClick={() => form.submit()}
                >
                  Save now
                </Button>
              </Flex>
            }
          />
        )}

        <Spin spinning={isLoading}>
          <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleValuesChange}>
            <div style={{ ...sectionPanel, padding: 0, overflow: "hidden" }}>
              <Tabs
                className="settings-tabs"
                activeKey={activeTab}
                onChange={setActiveTab}
                tabPosition="left"
                items={tabItems}
                style={{ minHeight: 460 }}
              />
            </div>
          </Form>
        </Spin>
      </div>
    </>
  );
};

export default Settings;
