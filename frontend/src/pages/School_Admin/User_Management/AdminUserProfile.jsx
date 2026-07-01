import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Spin, Button, Space, Tooltip, Tag, Modal, Form, Input, Select,
  DatePicker, Popconfirm, message, Descriptions, Divider,
} from "antd";
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, UserOutlined,
} from "@ant-design/icons";
import { Users, CalendarDays, MapPin, BookOpen, Phone, Briefcase, Mail } from "lucide-react";
import dayjs from "dayjs";
import { getUserById, deleteUser, adminUpdateUser, fetchAllUser } from "../../../features/authSlice";
import { fetchDepartments } from "../../../features/departmentSlice";
import { fetchDesignations } from "../../../features/designationSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";

const GENDER_OPTS = [
  { value: "Male",   label: "Male"   },
  { value: "Female", label: "Female" },
  { value: "Other",  label: "Other"  },
];

const InfoRow = ({ icon: Icon, label, value, color = "var(--primary)" }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border-muted)" }}>
    <div style={{
      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
      background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={16} color={color} strokeWidth={1.8} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ fontSize: 14, color: value ? "var(--text-primary)" : "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>
        {value || "—"}
      </div>
    </div>
  </div>
);

const AdminUserProfile = () => {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const dispatch       = useDispatch();
  const id             = searchParams.get("id");

  const { user: me } = useSelector((s) => s.auth);
  const { departments = [] } = useSelector((s) => s.departments);
  const { designations = [] } = useSelector((s) => s.designations);

  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [form]                    = Form.useForm();

  const schoolId = me?.school?._id || me?.schoolId;

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await dispatch(getUserById(id)).unwrap();
      setProfile(res);
    } catch {
      message.error("User not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    if (schoolId) {
      dispatch(fetchDepartments({ schoolId }));
      dispatch(fetchDesignations({ schoolId }));
    }
  }, [dispatch, schoolId]);

  const openEdit = () => {
    form.setFieldsValue({
      name:                 profile?.name,
      email:                profile?.email,
      phone:                profile?.phone,
      gender:               profile?.gender,
      dateOfBirth:          profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      address:              profile?.address,
      joiningDate:          profile?.joiningDate ? dayjs(profile.joiningDate) : null,
      qualification:        profile?.qualification,
      emergencyContactName: profile?.emergencyContactName,
      emergencyContactPhone:profile?.emergencyContactPhone,
      departmentId:         profile?.department?._id,
      designationId:        profile?.designation?._id,
    });
    setEditModal(true);
  };

  const handleSave = async () => {
    try {
      const vals = await form.validateFields();
      setSaving(true);
      const payload = {
        ...vals,
        dateOfBirth: vals.dateOfBirth?.toISOString() || null,
        joiningDate: vals.joiningDate?.toISOString()  || null,
      };
      await dispatch(adminUpdateUser({ id, data: payload })).unwrap();
      message.success("Profile updated successfully");
      setEditModal(false);
      load();
    } catch (e) {
      if (typeof e === "string") message.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await dispatch(deleteUser(id)).unwrap();
      message.success("User deactivated");
      dispatch(fetchAllUser({ isActive: true }));
      navigate(-1);
    } catch {
      message.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={pageWrapper}>
        <PageHeader title="User Profile" subtitle="User not found" icon={<UserOutlined />} />
        <div style={{ marginTop: 32, textAlign: "center", color: "var(--text-muted)" }}>
          No user found with this ID.
        </div>
      </div>
    );
  }

  const roleName = profile?.role?.name || "N/A";
  const avatar   = profile?.avatar;

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="User Profile"
        subtitle={`${roleName} · ${profile?.school?.name || ""}`}
        icon={<Users size={20} />}
        extra={
          <Space>
            <Tooltip title="Back">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
            </Tooltip>
            <Tooltip title="Refresh">
              <Button icon={<ReloadOutlined />} onClick={load} />
            </Tooltip>
            <Button type="default" icon={<EditOutlined />} onClick={openEdit}>
              Edit Profile
            </Button>
            <Popconfirm
              title="Deactivate this user?"
              description="This will disable the user's access to the system."
              okText="Yes, Deactivate"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={handleDelete}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        }
      />

      {/* ── Header Card ── */}
      <div style={{
        ...sectionPanel, marginTop: 20,
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        {/* Avatar */}
        <div style={{
          width: 80, height: 80, borderRadius: "50%", flexShrink: 0,
          background: avatar ? "transparent" : "var(--primary)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 30, fontWeight: 700, color: "#fff", overflow: "hidden",
        }}>
          {avatar
            ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : (profile?.name?.[0] || "?").toUpperCase()
          }
        </div>

        {/* Name + badge */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
            {profile?.name}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <Tag color="purple">{roleName}</Tag>
            {profile?.isActive
              ? <Tag color="success">Active</Tag>
              : <Tag color="error">Inactive</Tag>
            }
            {profile?.regId && <Tag color="default">ID: {profile.regId}</Tag>}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>
            {profile?.email}
          </div>
        </div>

        {/* Department + Designation */}
        {(profile?.department || profile?.designation) && (
          <div style={{
            background: "var(--surface-soft)", borderRadius: 12,
            padding: "12px 18px", minWidth: 160,
          }}>
            {profile?.department && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Dept: </span>
                {profile.department.name}
              </div>
            )}
            {profile?.designation && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Designation: </span>
                {profile.designation.title}
              </div>
            )}
            {profile?.joiningDate && (
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Joined: </span>
                {dayjs(profile.joiningDate).format("DD MMM YYYY")}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Info Grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
        gap: 16,
        marginTop: 16,
      }}>
        {/* Contact Info */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Contact Information
          </div>
          <InfoRow icon={Mail}  label="Email"   value={profile?.email}   color="#6366f1" />
          <InfoRow icon={Phone} label="Phone"   value={profile?.phone}   color="#0ea5e9" />
          <InfoRow icon={MapPin}        label="Address" value={profile?.address}  color="#f59e0b" />
        </div>

        {/* Personal Info */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Personal Details
          </div>
          <InfoRow icon={Users}        label="Gender"        value={profile?.gender}                                          color="#8b5cf6" />
          <InfoRow icon={CalendarDays} label="Date of Birth" value={profile?.dateOfBirth ? dayjs(profile.dateOfBirth).format("DD MMM YYYY") : null} color="#ec4899" />
          <InfoRow icon={BookOpen}     label="Qualification" value={profile?.qualification}                                   color="#10b981" />
        </div>

        {/* Professional Info */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Professional Details
          </div>
          <InfoRow icon={Briefcase}    label="Department"  value={profile?.department?.name}         color="#f59e0b" />
          <InfoRow icon={Briefcase}    label="Designation" value={profile?.designation?.title}       color="#14b8a6" />
          <InfoRow icon={CalendarDays} label="Joining Date" value={profile?.joiningDate ? dayjs(profile.joiningDate).format("DD MMM YYYY") : null} color="#3b82f6" />
        </div>

        {/* Emergency Contact */}
        <div style={sectionPanel}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            Emergency Contact
          </div>
          <InfoRow icon={Users} label="Contact Name"  value={profile?.emergencyContactName}  color="#ef4444" />
          <InfoRow icon={Phone} label="Contact Phone" value={profile?.emergencyContactPhone} color="#ef4444" />
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <Modal
        open={editModal}
        title={
          <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
            Edit Profile — {profile?.name}
          </span>
        }
        onOk={handleSave}
        onCancel={() => setEditModal(false)}
        okText="Save Changes"
        confirmLoading={saving}
        width={620}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Form.Item name="name"  label="Full Name"  rules={[{ required: true }]}>
              <Input placeholder="Full name" />
            </Form.Item>
            <Form.Item name="email" label="Email"      rules={[{ required: true, type: "email" }]}>
              <Input placeholder="Email address" />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select gender" options={GENDER_OPTS} />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="joiningDate" label="Joining Date">
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
            <Form.Item name="qualification" label="Qualification" style={{ gridColumn: "1 / -1" }}>
              <Input placeholder="e.g. M.Sc., B.Ed." />
            </Form.Item>
            <Form.Item name="address" label="Address" style={{ gridColumn: "1 / -1" }}>
              <Input.TextArea rows={2} placeholder="Full address" />
            </Form.Item>
            <Form.Item name="departmentId" label="Department">
              <Select
                placeholder="Select department"
                allowClear
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
              />
            </Form.Item>
            <Form.Item name="designationId" label="Designation">
              <Select
                placeholder="Select designation"
                allowClear
                options={designations.map((d) => ({ value: d._id, label: d.title }))}
              />
            </Form.Item>
            <Form.Item name="emergencyContactName" label="Emergency Contact Name">
              <Input placeholder="Emergency contact name" />
            </Form.Item>
            <Form.Item name="emergencyContactPhone" label="Emergency Contact Phone">
              <Input placeholder="Emergency contact phone" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserProfile;
