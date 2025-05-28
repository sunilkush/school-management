import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from '../../features/auth/authSlice';
import { Link, useNavigate } from 'react-router-dom';

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
    { role: "parent", path: "/dashboard/parent" }
  ];

  useEffect(() => {
    if (role) {
      const match = roleRoutes.find((r) => r.role === role);
      if (match) {
        navigate(match.path);
      }
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
    <div className="flex h-screen bg-[#f4f2fc]">
      {/* Left Side */}
      <div className="w-100 sm:w-1/2 md:w-1/2 bg-white p-10 flex flex-col justify-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Log in</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="email"
            placeholder="Email or Phone number"
           
            onChange={handleChange}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            
            onChange={handleChange}
            required
            className="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <div className="text-right text-sm text-purple-600">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-semibold py-3 rounded-lg"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="mt-6 text-sm text-gray-600 text-center">
          Not a member?{" "}
          <Link to="/register" className="text-purple-600 font-semibold">
            Sign up
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center">
          <button className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:shadow">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            <span className="text-sm text-gray-700">Log in with Google</span>
          </button>
        </div>
      </div>

      {/* Right Side (Illustration) */}
      <div className="w-100 sm:w-1/2 md:w-1/2 flex items-center justify-center">
        <img
          src="/login-illustration.svg"
          alt="Login Illustration"
          className="w-[80%] h-auto"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
    </div>
  );
};

export default LoginForm;
