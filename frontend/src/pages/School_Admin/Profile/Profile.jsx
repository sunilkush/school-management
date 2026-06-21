import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  EllipsisVertical, MailPlus, User, CalendarCheck, ClipboardList,
  MessageCircleMore, Settings, FolderClosed, Camera, Save, X, Lock,
} from 'lucide-react';
import { message } from 'antd';
import { changePassword, currentUser, updateUser } from '../../../features/authSlice';
import AttendanceCalendar from '../../AttendanceCalendar';

const InfoItem = ({ label, value }) => (
  <div>
    <p className='text-xs text-gray-500 uppercase tracking-wide'>{label}</p>
    <p className='text-sm text-gray-800 font-medium mt-0.5'>{value || '—'}</p>
  </div>
);

const InputField = ({ label, value, onChange, type = 'text', placeholder }) => (
  <div className='flex flex-col gap-1'>
    <label className='text-xs text-gray-500 uppercase tracking-wide'>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition'
    />
  </div>
);

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth || {});
  const [activeTab, setActiveTab] = useState('Profile');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const fileInputRef = useRef(null);

  /* edit form state */
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  /* password form state */
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');

  useEffect(() => { dispatch(currentUser()); }, [dispatch]);

  const openEdit = () => {
    setEditForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setEditing(true);
  };

  /* ── Photo upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    try {
      setUploadingPhoto(true);
      await dispatch(updateUser({ name: user?.name || '', email: user?.email || '', phone: user?.phone, avatarFile: file })).unwrap();
      message.success('Profile photo updated!');
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Failed to update photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  /* ── Edit profile ── */
  const handleSaveProfile = async () => {
    if (!editForm.name || !editForm.email) { message.error('Name and email are required'); return; }
    setSaving(true);
    try {
      await dispatch(updateUser({ name: editForm.name, email: editForm.email, phone: editForm.phone })).unwrap();
      message.success('Profile updated successfully!');
      setEditing(false);
    } catch (err) {
      message.error(typeof err === 'string' ? err : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { setPwdError('All fields are required'); return; }
    if (pwdForm.newPwd.length < 6) { setPwdError('New password must be at least 6 characters'); return; }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdError('New password and confirm password do not match'); return; }
    setPwdLoading(true);
    try {
      await dispatch(changePassword({ oldPassword: pwdForm.current, newPassword: pwdForm.newPwd })).unwrap();
      message.success('Password changed successfully!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      setPwdError(typeof err === 'string' ? err : 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : 'U';

  const tabs = [
    { key: 'Profile',     icon: <User className='w-4 mr-1' />,              label: 'Profile' },
    { key: 'Attendance',  icon: <CalendarCheck className='w-4 mr-1' />,      label: 'Attendance' },
    { key: 'Tasks',       icon: <ClipboardList className='w-4 mr-1' />,      label: 'Tasks' },
    { key: 'Messages',    icon: <MessageCircleMore className='w-4 mr-1' />,  label: 'Messages' },
    { key: 'Files',       icon: <FolderClosed className='w-4 mr-1' />,       label: 'Files' },
    { key: 'Settings',    icon: <Settings className='w-4 mr-1' />,           label: 'Settings' },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Edit Profile Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-800">Edit Profile</h3>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <InputField label="Full Name"   value={editForm.name}  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}  placeholder="Enter full name" />
              <InputField label="Email"       type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} placeholder="Enter email" />
              <InputField label="Phone"       value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Enter phone number" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition flex items-center justify-center gap-1">
                <X className="w-4 h-4" /> Cancel
              </button>
              <button onClick={handleSaveProfile} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-1">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className='flex justify-between flex-col md:flex-row sm:p-1 md:p-5 lg:p-5'>
        <div className="flex items-center sm:space-x-0 md:space-x-4 mb-6 flex-col md:flex-row">
          <div className='flex items-center space-x-4 flex-col md:flex-row mb-4 md:mb-0'>
            {/* Avatar */}
            <div
              className="relative flex-shrink-0 cursor-pointer"
              onClick={() => !uploadingPhoto && fileInputRef.current?.click()}
              title="Click to change photo"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-200 shadow" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-purple-200 shadow">
                  {initials}
                </div>
              )}
              {uploadingPhoto ? (
                <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center border-2 border-white shadow-md">
                  <Camera className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div>
              <h3 className='text-lg font-medium'>{user?.name || '—'}</h3>
              <p className={`text-xs text-white text-center ${user?.isActive ? 'bg-green-600' : 'bg-red-500'} rounded-full px-2 inline-block`}>
                {user?.isActive ? 'Active' : 'Inactive'}
              </p>
              {user?.role?.name && <p className='text-xs text-purple-700 mt-1 font-medium'>{user.role.name}</p>}
            </div>
          </div>

          <div className='ml-auto flex items-center space-x-5 border-l px-3'>
            {user?.email && <InfoItem label="Email"  value={user.email} />}
            {user?.phone && <InfoItem label="Phone"  value={user.phone} />}
            {user?.school?.name && <InfoItem label="School" value={user.school.name} />}
          </div>
        </div>

        <div className='flex items-center space-x-3 mb-6 sm:justify-center md:justify-end'>
          <button onClick={openEdit} className='px-3 py-1.5 text-sm flex items-center gap-2 border border-purple-300 rounded-md text-purple-700 hover:bg-purple-50 transition'>
            <User className='w-4' /> Edit Profile
          </button>
          <button className='px-3 py-1 text-sm flex items-center gap-2 bg-purple-800 rounded-md text-white hover:bg-purple-900 transition'>
            <MailPlus className='w-5' /> Send Email
          </button>
          <button className='px-1 py-1 border bg-white rounded-md'><EllipsisVertical /></button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className='flex border-b border-gray flex-wrap'>
        {tabs.map((t) => (
          <button
            key={t.key}
            type='button'
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm flex items-center border-b transition-all duration-300
              ${activeTab === t.key ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-purple-600'}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {activeTab === 'Profile' && (
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3 p-1 md:p-5'>
          <div className='col-span-2 flex flex-col gap-3'>
            <div className='bg-white p-4 rounded-lg border'>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-base font-semibold'>Personal Information</h3>
                <button onClick={openEdit} className='text-xs text-purple-600 hover:underline flex items-center gap-1'>
                  <User className='w-3 h-3' /> Edit
                </button>
              </div>
              <div className='grid grid-cols-2 gap-5 mt-3'>
                <InfoItem label="Full Name" value={user?.name} />
                <InfoItem label="Email"     value={user?.email} />
                <InfoItem label="Phone"     value={user?.phone} />
                <InfoItem label="Role"      value={user?.role?.name} />
                <InfoItem label="Status"    value={user?.isActive ? 'Active' : 'Inactive'} />
                <InfoItem label="School"    value={user?.school?.name} />
              </div>
            </div>
          </div>

          <div className='col-span-1 gap-3 flex flex-col'>
            <div className='bg-white p-4 rounded-lg border w-full'>
              <h3 className='text-base font-semibold mb-3'>Contact Information</h3>
              <div className='grid grid-cols-2 gap-5 mt-3'>
                <div className='col-span-2 md:col-span-1'>
                  <p className='text-xs text-gray-500'>Phone</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>{user?.phone || 'Not Provided'}</p>
                </div>
                <div className='col-span-2 md:col-span-1'>
                  <p className='text-xs text-gray-500'>Email</p>
                  <p className='text-sm text-blue-800 bg-gray-100 rounded-full inline-block px-3 py-1'>{user?.email || 'Not Provided'}</p>
                </div>
              </div>
            </div>
            <div className='bg-white p-4 rounded-lg border w-full'>
              <h3 className='text-base font-semibold mb-3'>Overview</h3>
              <div className='grid grid-cols-2 gap-5 mt-3'>
                <InfoItem label="Role"   value={user?.role?.name} />
                <InfoItem label="Status" value={user?.isActive ? 'Active' : 'Inactive'} />
                <div className='col-span-2'><InfoItem label="School" value={user?.school?.name} /></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance tab ── */}
      {activeTab === 'Attendance' && (
        <div className='p-1 md:p-5 mt-3'>
          <div className='bg-white p-4 rounded-lg border'>
            <AttendanceCalendar />
          </div>
        </div>
      )}

      {/* ── Settings tab → change password ── */}
      {activeTab === 'Settings' && (
        <div className='p-1 md:p-5 mt-3'>
          <div className='bg-white p-5 rounded-lg border max-w-md'>
            <div className='flex items-center gap-3 mb-5'>
              <div className='w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center'>
                <Lock className='w-4 h-4 text-purple-600' />
              </div>
              <div>
                <h3 className='text-base font-bold text-gray-800'>Change Password</h3>
                <p className='text-xs text-gray-500'>Update your account password</p>
              </div>
            </div>
            <form onSubmit={handleChangePassword} className='flex flex-col gap-4'>
              <InputField label="Current Password" type="password" value={pwdForm.current}  onChange={(e) => setPwdForm((p) => ({ ...p, current: e.target.value }))}  placeholder="Current password" />
              <InputField label="New Password"     type="password" value={pwdForm.newPwd}   onChange={(e) => setPwdForm((p) => ({ ...p, newPwd:  e.target.value }))}   placeholder="New password (min 6 chars)" />
              <InputField label="Confirm Password" type="password" value={pwdForm.confirm}  onChange={(e) => setPwdForm((p) => ({ ...p, confirm: e.target.value }))}  placeholder="Confirm new password" />
              {pwdError && <p className='text-xs text-red-500'>{pwdError}</p>}
              <button
                type="submit"
                disabled={pwdLoading}
                className='w-full py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2'
              >
                {pwdLoading
                  ? <span className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  : <Lock className='w-4 h-4' />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Tasks tab ── */}
      {activeTab === 'Tasks' && (
        <div className='bg-white m-5 p-12 rounded-lg border text-center'>
          <ClipboardList className='w-10 h-10 text-purple-400 mx-auto mb-4' />
          <p className='text-base font-semibold text-gray-700 mb-2'>Task Management</p>
          <p className='text-sm text-gray-400 mb-5'>Create and manage tasks assigned to your staff</p>
          <button
            onClick={() => navigate('/dashboard/schooladmin/tasks')}
            className='px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition'
          >
            Go to Task Management
          </button>
        </div>
      )}

      {/* ── Coming soon tabs ── */}
      {['Messages', 'Files'].includes(activeTab) && (
        <div className='bg-white m-5 p-12 rounded-lg border text-center text-gray-400 text-sm'>
          {activeTab} section coming soon
        </div>
      )}
    </div>
  );
};

export default Profile;
