import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from '../../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const { loading, error, user } = useSelector(state => state.auth);
  const role = user?.role?.name.toLowerCase();
  const roleRoutes = [
    { role: "super admin", path: "/dashboard/super-admin" },
    { role: "school admin", path: "/dashboard/school-admin" },
    { role: "student", path: "/dashboard/student" },
    { role: "parent", path: "/dashboard/parent" },
    { role: "teacher", path: "/dashboard/teacher" },
    { role: "accountant", path: "/dashboard/accountant" },
    { role: "staff", path: "/dashboard/staff" },
  ];

  useEffect(() => {
    if (role) {
      const match = roleRoutes.find((r) => r.role === role);
      if (match) navigate(match.path);
    }
  }, [role, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };

  return (
    <div className="flex h-screen w-full font-sans">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 bg-gray-900">
        <div className="max-w-md w-full">
          <div className="mb-8 text-center">
            <img src={logo} alt="Logo" className="mx-auto h-20 mb-4" />
            <h1 className="text-2xl font-semibold text-gray-500">Welcome back</h1>
            <p className="text-sm text-gray-500 mt-1">
              Glad to see you again. Select method to log in
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
              className="w-full border border-gray-300 p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition duration-150"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            <p className="text-sm text-gray-600 text-center mt-6">
              Don’t have an account?{" "}
              <Link to="/register" className="text-blue-600 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center text-white relative">
        <div className="text-center px-8">
          {/* <img
            src="/dashboard-preview.svg"
            alt="Dashboard Illustration"
            className="w-[90%] mx-auto mb-6"
          /> */}
          <h2 className="text-xl font-semibold mb-2">Connect with every application</h2>
          <p className="text-sm text-gray-100">
            Everything you need in an easily customizable dashboard
          </p>
         
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
