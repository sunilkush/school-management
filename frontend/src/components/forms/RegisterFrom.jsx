import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../features/schools/schoolSlice";
import { fetchRoles } from "../../features/roles/roleSlice";
import {
  registerUser,
  resetAuthState,
  fetchAllUser,
} from "../../features/auth/authSlice";

const RegisterForm = () => {
  const [message, setMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error, user, success } = useSelector((state) => state.auth);

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;

  const initialForm = {
    name: "",
    email: "",
    password: "",
    roleId: "",
    schoolId: currentUserRole !== "super admin" ? currentSchoolId : "",
    isActive: false,
    avatar: null,
  };

  const [formData, setFormData] = useState(initialForm);
  const [filteredRoles, setFilteredRoles] = useState([]);

  // Fetch roles & schools
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRoles());
  }, [dispatch]);

  // Handle success reset
  useEffect(() => {
    if (success) {
      setMessage("🎉 Registration successful!");
      setFormData(initialForm);
      setConfirmPassword("");
      dispatch(fetchAllUser());
      setTimeout(() => {
        setMessage("");
        dispatch(resetAuthState());
      }, 2000);
    }
  }, [success, dispatch]);

  // 🔍 Dynamic role filtering
  useEffect(() => {
  let updatedRoles = [];

  if (currentUserRole === "super admin") {
    // Super Admin can only create School Admins (but allow global roles too)
    updatedRoles = roles.filter(
      (role) =>
        role.name.toLowerCase() === "school admin" &&
        (role.schoolId === formData.schoolId || role.schoolId === null) // ✅ include global roles
    );
  } else if (currentUserRole === "school admin") {
    // School Admin can create roles within their school + global roles
    updatedRoles = roles.filter(
      (role) =>
        (role.schoolId === currentSchoolId || role.schoolId === null) &&
        !["super admin", "school admin"].includes(role.name.toLowerCase())
    );
  }

  setFilteredRoles(updatedRoles);
}, [roles, currentUserRole, formData.schoolId, currentSchoolId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "avatar") {
      const file = files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
          // 1MB raw max (before resize)
          alert("Please upload an image under 1MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = function (event) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, 50, 50);

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  alert("Image processing failed.");
                  return;
                }
                if (blob.size > 50 * 1024) {
                  alert("Image size exceeds 50KB after resizing.");
                  return;
                }

                const resizedFile = new File([blob], file.name, {
                  type: file.type,
                });
                setFormData((prev) => ({ ...prev, avatar: resizedFile }));
              },
              file.type,
              0.8
            );
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formPayload.append(key, value);
    });
    dispatch(registerUser(formPayload));
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
        Register
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Create your account. It’s free and only takes a minute.
      </p>

      {message && <p className="text-green-600 text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
        {/* Name */}
        <div>
          <label className="text-xs">Name</label>
          <input
            name="name"
            onChange={handleChange}
            value={formData.name}
            type="text"
            placeholder="Name"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs">Email</label>
          <input
            name="email"
            onChange={handleChange}
            value={formData.email}
            type="email"
            placeholder="Email"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs">Password</label>
          <input
            name="password"
            onChange={handleChange}
            value={formData.password}
            type="password"
            placeholder="Password"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs">Confirm Password</label>
          <input
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="text-xs">Avatar</label>
          <input
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* School Dropdown (only for super admin) */}
        {currentUserRole === "super admin" && (
          <div>
            <label className="text-xs">School Name</label>
            <select
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select School</option>
              {schools.map((school) => (
                <option key={school._id} value={school._id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Dropdown */}
        <div>
          <label className="text-xs">Role</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select Role</option>
            {filteredRoles
              .filter(
                (role) =>
                  !["student", "parent"].includes(role.name.toLowerCase())
              )
              .map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))}
          </select>
        </div>

        {/* Active Checkbox */}
        <div className="flex items-center col-span-2">
          <input
            id="isActive"
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-600">
            Is Active
          </label>
        </div>

        {/* Submit */}
        <div className="col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-800"
          >
            {isLoading ? "Registering..." : "Register Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
