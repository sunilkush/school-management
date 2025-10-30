import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../features/schoolSlice";
import { fetchRoles } from "../../features/roleSlice";
import {
  registerUser,
  resetAuthState,
  fetchAllUser,
} from "../../features/authSlice";

const RegisterForm = () => {
  const [message, setMessage] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch();
  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error, user, success } = useSelector(
    (state) => state.auth
  );

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;

  // ✅ Memoized initial form
  const initialForm = useMemo(
    () => ({
      name: "",
      email: "",
      password: "",
      roleId: "",
      schoolId: currentUserRole !== "super admin" ? currentSchoolId || "" : "",
      isActive: false,
      avatar: null,
      academicYearId: "",
    }),
    [currentUserRole, currentSchoolId]
  );

  const [formData, setFormData] = useState(initialForm);
  const [filteredRoles, setFilteredRoles] = useState([]);

  // 🔹 Fetch roles & schools
  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRoles());
  }, [dispatch]);

  // 🔹 Handle success
  useEffect(() => {
    if (success) {
      setMessage("🎉 Registration successful!");
      setFormData(initialForm);
      setConfirmPassword("");
      dispatch(fetchAllUser());

      const timer = setTimeout(() => {
        setMessage("");
        dispatch(resetAuthState());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch, initialForm]);

  // 🔹 Role filtering
  useEffect(() => {
    let updatedRoles = [];
    if (currentUserRole === "super admin") {
      updatedRoles = roles.filter(
        (role) =>
          role.name.toLowerCase() === "school admin" &&
          (role.schoolId === formData.schoolId || role.schoolId === null)
      );
    } else if (currentUserRole === "school admin") {
      updatedRoles = roles.filter(
        (role) =>
          (role.schoolId === currentSchoolId || role.schoolId === null) &&
          !["super admin", "school admin"].includes(role.name.toLowerCase())
      );
    }
    setFilteredRoles(updatedRoles);
  }, [roles, currentUserRole, formData.schoolId, currentSchoolId]);

  // 🔹 Input change handler
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "avatar") {
      const file = files[0];
      if (file) {
        if (file.size > 1024 * 1024) {
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

  // 🔹 Submit handler
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
    <div className="">
      <h2 className="text-xl font-bold text-center text-primary mb-2">
        Register
      </h2>
      <p className="text-center text-sm text-gray-500 mb-3">
        Create your account. It’s free and only takes a minute.
      </p>

      {message && (
        <p className="text-emerald-600 text-sm text-center mb-3">{message}</p>
      )}
      {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

      <form className="grid grid-cols-1 gap-1" onSubmit={handleSubmit}>
        {/* Name */}
        <div>
          <label className="text-xs text-gray-600">Name</label>
          <input
            name="name"
            onChange={handleChange}
            value={formData.name}
            type="text"
            placeholder="Full Name"
            required
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs text-gray-600">Email</label>
          <input
            name="email"
            onChange={handleChange}
            value={formData.email}
            type="email"
            placeholder="Email Address"
            required
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs text-gray-600">Password</label>
          <input
            name="password"
            onChange={handleChange}
            value={formData.password}
            type="password"
            placeholder="Password"
            required
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-xs text-gray-600">Confirm Password</label>
          <input
            name="confirmPassword"
            onChange={(e) => setConfirmPassword(e.target.value)}
            value={confirmPassword}
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        {/* Avatar */}
        <div>
          <label className="text-xs text-gray-600">Upload Avatar</label>
          <input
            type="file"
            name="avatar"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
          />
        </div>

        {/* School Dropdown (only for super admin) */}
        {currentUserRole === "super admin" && (
          <div>
            <label className="text-xs text-gray-600">School</label>
            <select
              name="schoolId"
              value={formData.schoolId}
              onChange={handleChange}
              required
              className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
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
          <label className="text-xs text-gray-600">Role</label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            required
            className="w-full px-2 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-xs"
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
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2 text-primary focus:ring-primary"
          />
          <label htmlFor="isActive" className="text-sm text-gray-600">
            Active User
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-primary text-white text-sm rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isLoading ? "Registering..." : "Register Now"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;
