import { useState, useEffect } from "react";
import {  useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../features/auth/authSlice";
import { fetchRoles } from "../features/roles/roleSlice";
import { fetchSchools } from "../features/schools/schoolSlice";

const Settings = () => {
  useSelector
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    theme: "light",
    language: "english",
    notifications: true,
    timezone: "Asia/Kolkata",
    defaultRole: "",
    academicYear: "",
    approvalRequired: true,
    maxSchools: 10,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactor: false,
    emailNotif: true,
    smsKey: "",
    emailSignature: "",
    whatsappSupport: false,
    autoBackup: true,
    backupFreq: "Weekly",
    appName: "SchoolPro",
    maintenance: false,
  });

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchSchools());
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        defaultRole: user?.role?.name || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSave = () => {
    dispatch(updateProfile({ name: form.fullName, email: form.email, phone: form.phone }));
    alert("Settings saved!");
  };

  return (
    <div className="p-6 space-y-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700">{user?.role?.name} Settings</h1>

      {/* Profile Settings */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">👤 Profile Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} className="border p-2 rounded" />
          <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="border p-2 rounded" />
          <input type="text" name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} className="border p-2 rounded" />
          <input type="file" className="border p-2 rounded" />
        </div>
      </div>

      {/* Preferences */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">⚙️ Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="theme" value={form.theme} onChange={handleChange} className="border p-2 rounded">
            <option value="light">Light Theme</option>
            <option value="dark">Dark Theme</option>
          </select>
          <select name="language" value={form.language} onChange={handleChange} className="border p-2 rounded">
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
          </select>
          <select name="timezone" value={form.timezone} onChange={handleChange} className="border p-2 rounded">
            <option value="Asia/Kolkata">Asia/Kolkata</option>
            <option value="UTC">UTC</option>
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="notifications" checked={form.notifications} onChange={handleChange} />
            Enable Notifications
          </label>
        </div>
      </div>

      {/* School Management */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">🏫 School Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="defaultRole" value={form.defaultRole} onChange={handleChange} className="border p-2 rounded">
            {roles.map((role) => (
              <option key={role._id} value={role.name}>{role.name}</option>
            ))}
          </select>
          <select name="academicYear" value={form.academicYear} onChange={handleChange} className="border p-2 rounded">
            {schools.map((school) => (
              <option key={school._id} value={school.academicYear}>{school.academicYear}</option>
            ))}
          </select>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="approvalRequired" checked={form.approvalRequired} onChange={handleChange} />
            Enable Approval for New Schools
          </label>
          <input type="number" name="maxSchools" value={form.maxSchools} onChange={handleChange} className="border p-2 rounded" placeholder="Max Allowed Schools" />
        </div>
      </div>

      {/* Security */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">🔐 Security</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} placeholder="Current Password" className="border p-2 rounded" />
          <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} placeholder="New Password" className="border p-2 rounded" />
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="twoFactor" checked={form.twoFactor} onChange={handleChange} />
            Enable 2FA
          </label>
        </div>
      </div>

      {/* Communication */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">📢 Communication</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="emailNotif" checked={form.emailNotif} onChange={handleChange} />
            Enable Email Notifications
          </label>
          <input type="text" name="smsKey" value={form.smsKey} onChange={handleChange} placeholder="SMS API Key" className="border p-2 rounded" />
          <textarea name="emailSignature" value={form.emailSignature} onChange={handleChange} className="border p-2 rounded" rows="3" placeholder="Email Signature" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="whatsappSupport" checked={form.whatsappSupport} onChange={handleChange} />
            Enable WhatsApp Support
          </label>
        </div>
      </div>

      {/* Backup & Data */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">💾 Backup & Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="autoBackup" checked={form.autoBackup} onChange={handleChange} />
            Enable Auto Backup
          </label>
          <select name="backupFreq" value={form.backupFreq} onChange={handleChange} className="border p-2 rounded">
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Export All Data</button>
          <button className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">Delete All Data</button>
        </div>
      </div>

      {/* System Settings */}
      <div className="space-y-4 border p-5 rounded shadow-sm">
        <h2 className="text-xl font-semibold">🛠️ System Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input type="text" name="appName" value={form.appName} onChange={handleChange} className="border p-2 rounded" placeholder="App Name" />
          <input type="file" className="border p-2 rounded" />
          <label className="flex items-center gap-2">
            <input type="checkbox" name="maintenance" checked={form.maintenance} onChange={handleChange} />
            Maintenance Mode
          </label>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex justify-end gap-4">
        <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Reset</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;
