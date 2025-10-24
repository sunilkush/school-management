import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, resetAuthState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import loginIllustration from "../../assets/login-illustration.png";
const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const { loading, error, user } = useSelector((state) => state.auth);
  const [navigated, setNavigated] = useState(false);
  const roleName = user?.role?.name?.toLowerCase();

  useEffect(() => {
    if (roleName && !navigated) {
      const roleRoutes = [
        { role: "super admin", path: "/dashboard/superadmin" },
        { role: "school admin", path: "/dashboard/schooladmin" },
        { role: "student", path: "/dashboard/student" },
        { role: "parent", path: "/dashboard/parent" },
        { role: "teacher", path: "/dashboard/teacher" },
        { role: "accountant", path: "/dashboard/accountant" },
        { role: "staff", path: "/dashboard/staff" },
      ];

      const match = roleRoutes.find((r) => r.role === roleName);
      if (match) {
        setNavigated(true);
        navigate(match.path);
      }
    }
  }, [roleName, navigate, navigated]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) {
      dispatch(resetAuthState());
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Left Side – Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        {/* Logo */}
        <div className="mb-8">
          <img src={logo} alt="Logo" className="h-8" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-500 mb-8">Please enter your details</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center text-gray-600">
              <input type="checkbox" className="mr-2 accent-purple-600" />
              Remember for 30 days
            </label>
            <Link
              to="/forgot-password"
              className="text-purple-600 hover:text-purple-700"
            >
              Forgot password
            </Link>
          </div>

          {/* Sign In */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800 text-white font-medium py-2.5 rounded-md transition duration-200"
          >
            {loading ? "Logging in..." : "Sign in"}
          </button>

          {/* Google Sign In */}
          <button
            type="button"
            className="w-full border border-gray-300 flex items-center justify-center gap-2 py-2.5 rounded-md hover:bg-gray-50 transition"
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              className="h-5 w-5"
            />
            <span>Sign in with Google</span>
          </button>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-purple-600 hover:text-purple-700">
            Sign up
          </Link>
        </p>
      </div>

      {/* Right Side – Illustration */}
      <div className="hidden md:flex w-1/2 bg-purple-100 items-center justify-center">
        <img
          src={loginIllustration}
          alt="Illustration"
          className="max-w-md"
        />
      </div>
    </div>
  );
};

export default LoginForm;
