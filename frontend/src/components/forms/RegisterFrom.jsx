import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchools } from "../../features/schools/schoolSlice";
import { fetchRoles } from "../../features/roles/roleSlice";
import { registerUser, resetAuthState ,fetchAllUser} from "../../features/auth/authSlice";

const RegisterForm = () => {
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();

  const { roles } = useSelector((state) => state.role);
  const { schools } = useSelector((state) => state.school);
  const { isLoading, error,user, success } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    schoolId: "",
    isActive: false,
    avatar: null,
  });

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
        schoolId: "",
        isActive: false,
        avatar: null,
      });
      dispatch(fetchAllUser())
      setTimeout(() => {
        setMessage("");
        dispatch(resetAuthState());
      }, 2000);
    }
  }, [success, dispatch]);

const handleChange = (e) => {
  const { name, value, type, checked, files } = e.target;

  if (name === "avatar") {
    const file = files[0];
    if (file) {
      const maxSize = 50 * 1024; // 50KB in bytes

      const reader = new FileReader();
      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          // Create canvas and resize
          const canvas = document.createElement("canvas");
          canvas.width = 50;
          canvas.height = 50;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 50, 50);

          canvas.toBlob((blob) => {
            if (blob.size > maxSize) {
              alert("Image size exceeds 50KB even after resizing.");
              return;
            }

            const resizedFile = new File([blob], file.name, {
              type: file.type,
            });

            setFormData((prev) => ({ ...prev, avatar: resizedFile }));
          }, file.type);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  } else {
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
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
      <h2 className="text-2xl font-semibold text-gray-900 text-center">
        Register
      </h2>
      <p className="text-center text-sm text-gray-600 mb-6">
        Create your account. It’s free and only takes a minute
      </p>

      {message && <p className="text-green-600 text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          name="name"
          onChange={handleChange}
          value={formData.name}
          type="text"
          placeholder="Name"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="file"
          name="avatar"
          accept="image/*"
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <select
          name="roleId"
          value={formData.roleId}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="" disabled>
            Select Role
          </option>
          {roles
            ?.filter((role) => role.name.toLowerCase() === "school admin")
            .map((role) => (
              <option key={role._id} value={role._id}>
                {role.name}
              </option>
            ))}
        </select>

        <select
          name="schoolId"
          value={formData.schoolId}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="" disabled>
            Select School
          </option>
          {schools?.map((school) => (
            <option key={school._id} value={school._id}>
              {school.name}
            </option>
          ))}
        </select>

        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="mr-2 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="isActive" className="text-sm text-gray-600">
            Is Active
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-500 text-white py-2 rounded-md hover:bg-purple-600 transition duration-200"
        >
          {isLoading ? "Registering..." : "Register Now"}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
