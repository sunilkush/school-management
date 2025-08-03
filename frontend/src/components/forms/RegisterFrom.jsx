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
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error, user, success } = useSelector((state) => state.auth);

  const currentUserRole = user?.role?.name?.toLowerCase();
  const currentSchoolId = user?.school?._id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    schoolId: currentUserRole !== "super admin" ? currentSchoolId : "",
    isActive: false,
    avatar: null,
  });

  const [filteredRoles, setFilteredRoles] = useState([]);

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setMessage("🎉 Registration successful!");
      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: "",
        schoolId: currentUserRole !== "super admin" ? currentSchoolId : "",
        isActive: false,
        avatar: null,
      });
      dispatch(fetchAllUser());
      setTimeout(() => {
        setMessage("");
        dispatch(resetAuthState());
      }, 2000);
    }
  }, [success, dispatch, currentUserRole, currentSchoolId]);

  // 🔍 Dynamic role filtering
  useEffect(() => {
    let updatedRoles = [];

    if (currentUserRole === "super admin") {
      updatedRoles = roles.filter(
        (role) =>
          role.name.toLowerCase() === "school admin" &&
          role.schoolId === formData.schoolId
      );
    } else if (currentUserRole === "school admin") {
      updatedRoles = roles.filter(
        (role) =>
          role.schoolId === currentSchoolId &&
          role.name.toLowerCase() !== "super admin" &&
          role.name.toLowerCase() !== "school admin"
      );
    }

    setFilteredRoles(updatedRoles);
  }, [roles, currentUserRole, formData.schoolId, currentSchoolId]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (name === "avatar") {
      const file = files[0];
      if (file) {
        const maxSize = 50 * 1024; // 50KB
        const reader = new FileReader();
        reader.onload = function (event) {
          const img = new Image();
          img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = 50;
            canvas.height = 50;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, 50, 50);

            canvas.toBlob((blob) => {
              if (blob.size > maxSize) {
                alert("Image size exceeds 50KB after resizing.");
                return;
              }

              const resizedFile = new File([blob], file.name, { type: file.type });
              setFormData((prev) => ({ ...prev, avatar: resizedFile }));
            }, file.type);
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

  const handleSubmit = (e) => {
    e.preventDefault();
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

      <form className="" onSubmit={handleSubmit}>
        <label className="text-xs ">Name</label>
        <input
          name="name"
          onChange={handleChange}
          value={formData.name}
          type="text"
          placeholder="Name"
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <label className="text-xs ">Email</label>
        <input
          name="email"
          onChange={handleChange}
          value={formData.email}
          type="email"
          placeholder="Email"
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
       <label className="text-xs ">Password</label>
        <input
          name="password"
          onChange={handleChange}
          value={formData.password}
          type="password"
          placeholder="Password"
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
       <label className="text-xs ">Avatar</label>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleChange}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
            
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
          </select></div>
        )}
        <label className="text-xs">Role </label>
        <select
          name="roleId"
          value={formData.roleId}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-2"
        >
          <option value="">Select Role</option>
          {filteredRoles
         .filter((role) => role.name.toLowerCase() !== "student")
         .filter((role) => role.name.toLowerCase() !== "parent")
          .map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        </select>

        <div className="flex items-center mb-2">
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600"
        >
          {isLoading ? "Registering..." : "Register Now"}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
