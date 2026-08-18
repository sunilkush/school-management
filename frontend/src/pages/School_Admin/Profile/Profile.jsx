import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {
  Camera, Save, Loader2, Mail, Phone, Building2, Shield,
  User, Lock, Eye, EyeOff, CheckCircle,
} from 'lucide-react';
import { changePassword, currentUser, updateUser } from '../../../features/authSlice';
import PageHeader from '../../../components/layout/PageHeader';
import { pageWrapper, pageCard, avatarStyle } from '../../../styles/pageStyles';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, loading: authLoading } = useSelector((s) => s.auth || {});

  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pwdLoading,     setPwdLoading]     = useState(false);
  const [saveMsg,        setSaveMsg]        = useState({ text: '', error: false });
  const [pwdMsg,         setPwdMsg]         = useState({ text: '', error: false });

  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [pwdForm,     setPwdForm]     = useState({ current: '', newPwd: '', confirm: '' });

  const fileInputRef = useRef(null);

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({ name: user.name || '', email: user.email || '', phone: user.phone || '' });
  }, [user]);

  const getInitials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  const roleName = user?.role?.name || user?.roleId?.name || 'School Admin';
  const initials = getInitials(profileForm.name || 'A');

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || '', email: user?.email || '', phone: user?.phone, avatarFile: file })).unwrap();
      setSaveMsg({ text: 'Profile photo updated!', error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === 'string' ? err : 'Failed to update photo', error: true });
    } finally { setUploadingPhoto(false); e.target.value = ''; }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email) { setSaveMsg({ text: 'Name and email are required', error: true }); return; }
    setSaving(true); setSaveMsg({ text: '', error: false });
    try {
      await dispatch(updateUser({ name: profileForm.name, email: profileForm.email, phone: profileForm.phone })).unwrap();
      setSaveMsg({ text: 'Profile updated successfully!', error: false });
    } catch (err) {
      setSaveMsg({ text: typeof err === 'string' ? err : 'Update failed', error: true });
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { setPwdMsg({ text: 'All fields are required', error: true }); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdMsg({ text: 'Passwords do not match', error: true }); return; }
    if (pwdForm.newPwd.length < 6) { setPwdMsg({ text: 'At least 6 characters required', error: true }); return; }
    setPwdLoading(true); setPwdMsg({ text: '', error: false });
    try {
      await dispatch(changePassword({ oldPassword: pwdForm.current, newPassword: pwdForm.newPwd })).unwrap();
      setPwdMsg({ text: 'Password changed successfully!', error: false });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setPwdMsg({ text: typeof err === 'string' ? err : 'Failed to change password', error: true });
    } finally { setPwdLoading(false); }
  };

  if (authLoading) {
    return (
      <div style={{ ...pageWrapper, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)' }}>
        <Loader2 style={{ width: 20, height: 20 }} /> Loading profile...
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader title="My Profile" subtitle="View and update your personal information" icon={<UserOutlined />} />

      {/* Hero Card */}
      <div style={{ ...pageCard, marginTop: 16, padding: '20px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              role="button"
              tabIndex={0}
              aria-label="Change profile photo"
              style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
              onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !uploadingPhoto) { e.preventDefault(); fileInputRef.current?.click(); } }}
              title="Click to change photo"
            >
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-muted)', display: 'block' }} />
                : <div style={avatarStyle(profileForm.name || 'A', 56)}>{initials}</div>
              }
              {uploadingPhoto
                ? <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin size="small" /></div>
                : <div style={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, borderRadius: '50%', background: 'var(--primary, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
                    <Camera style={{ width: 10, height: 10, color: '#fff' }} />
                  </div>
              }
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{profileForm.name || roleName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{profileForm.email || 'No email'}</div>
              <span style={{ display: 'inline-block', marginTop: 6, fontSize: 11, background: 'rgba(220,252,231,0.2)', color: 'var(--success)', padding: '2px 10px', borderRadius: 99, fontWeight: 600 }}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, flex: '1 1 340px', maxWidth: 480 }}>
            <InfoBadge icon={<Shield style={{ width: 14, height: 14 }} />} label="Role" value={roleName} />
            <InfoBadge icon={<Building2 style={{ width: 14, height: 14 }} />} label="School" value={user?.school?.name || '—'} />
            <InfoBadge icon={<Phone style={{ width: 14, height: 14 }} />} label="Phone" value={profileForm.phone || 'Not set'} />
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={{ ...pageCard, padding: '20px 24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Basic Profile</div>
            <button type="submit" disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--primary, #7c3aed)', color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
              {saving ? <Loader2 style={{ width: 14, height: 14 }} /> : <Save style={{ width: 14, height: 14 }} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
          <Section title="Account Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <InputField icon={<User style={{ width: 14, height: 14 }} />} label="Full Name" name="name" value={profileForm.name} onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))} required />
              <InputField icon={<Mail style={{ width: 14, height: 14 }} />} label="Email" name="email" type="email" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} required />
              <InputField icon={<Phone style={{ width: 14, height: 14 }} />} label="Phone" name="phone" value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
          </Section>
          {saveMsg.text && <p style={{ fontSize: 13, color: saveMsg.error ? 'var(--danger)' : 'var(--success)', margin: '8px 0 0' }}>{saveMsg.text}</p>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ ...pageCard, padding: '16px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Building2 style={{ width: 14, height: 14 }} /> School
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{user?.school?.name || '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{roleName}</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, background: 'rgba(220,252,231,0.4)', color: 'var(--success-hover)', padding: '3px 10px', borderRadius: 99, fontWeight: 600, width: 'fit-content', marginTop: 4 }}>
                <CheckCircle style={{ width: 11, height: 11 }} /> {user?.isActive ? 'Active Member' : 'Inactive'}
              </span>
            </div>
          </div>
          <div style={{ ...pageCard, padding: '16px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail style={{ width: 14, height: 14 }} /> Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{profileForm.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Phone</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{profileForm.phone || 'Not set'}</div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Password Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>
        <form onSubmit={handleChangePassword} style={{ ...pageCard, padding: '20px 24px', gridColumn: 'span 2' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>Change Password</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>Update your account password</div>
          <Section title="Password">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <PwdField label="Current Password" value={pwdForm.current} onChange={(v) => setPwdForm((p) => ({ ...p, current: v }))} placeholder="Enter current password" />
              <PwdField label="New Password" value={pwdForm.newPwd} onChange={(v) => setPwdForm((p) => ({ ...p, newPwd: v }))} placeholder="Min 6 characters" />
              <PwdField label="Confirm Password" value={pwdForm.confirm} onChange={(v) => setPwdForm((p) => ({ ...p, confirm: v }))} placeholder="Repeat new password" />
            </div>
          </Section>
          {pwdMsg.text && <p style={{ fontSize: 13, color: pwdMsg.error ? 'var(--danger)' : 'var(--success)', margin: '8px 0 0' }}>{pwdMsg.text}</p>}
          <button type="submit" disabled={pwdLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '8px 16px', borderRadius: 8, background: 'var(--primary, #7c3aed)', color: '#fff', border: 'none', cursor: pwdLoading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: pwdLoading ? 0.6 : 1 }}>
            {pwdLoading ? <Loader2 style={{ width: 14, height: 14 }} /> : <Lock style={{ width: 14, height: 14 }} />}
            {pwdLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <div style={{ ...pageCard, padding: '16px 20px', background: 'var(--surface-soft)' }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)', marginBottom: 12 }}>Password Tips</div>
          <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['At least 8 characters', 'Mix uppercase & lowercase', 'Include numbers & symbols', 'Avoid your name or email'].map((tip) => (
              <li key={tip} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                <CheckCircle style={{ width: 13, height: 13, color: 'var(--success)', flexShrink: 0 }} />{tip}
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
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{title}</div>
    {children}
  </div>
);

const InfoBadge = ({ icon, label, value }) => (
  <div style={{ borderRadius: 10, border: '1px solid var(--border-muted)', background: 'var(--surface-soft)', padding: '10px 12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{icon}{label}</div>
    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || '—'}</div>
  </div>
);

const fieldStyle = {
  display: 'flex', alignItems: 'center',
  border: '1px solid var(--border-muted)', borderRadius: 8,
  padding: '8px 12px', gap: 8, background: 'var(--surface)',
};

const InputField = ({ icon, label, name, value, onChange, type = 'text', required = false }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    <div style={fieldStyle}>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <input type={type} name={name} value={value || ''} onChange={onChange} required={required}
        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }} />
    </div>
  </label>
);

const PwdField = ({ label, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
      <div style={{ ...fieldStyle, paddingRight: 8 }}>
        <Lock style={{ width: 14, height: 14, color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type={show ? 'text' : 'password'} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: 'var(--text-primary)' }} />
        <button type="button" onClick={() => setShow((s) => !s)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
          {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
        </button>
      </div>
    </label>
  );
};

export default Profile;
