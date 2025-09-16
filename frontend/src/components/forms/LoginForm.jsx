import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, resetAuthState } from "../../features/authSlice";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png"; // your logo

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });

  const { loading, error, user } = useSelector((state) => state.auth);

  const roleRoutes = [
    { role: "super admin", path: "/dashboard/superadmin" },
    { role: "school admin", path: "/dashboard/schooladmin" },
    { role: "student", path: "/dashboard/student" },
    { role: "parent", path: "/dashboard/parent" },
    { role: "teacher", path: "/dashboard/teacher" },
    { role: "accountant", path: "/dashboard/accountant" },
    { role: "staff", path: "/dashboard/staff" },
  ];

  const [navigated, setNavigated] = useState(false);
  const roleName = user?.role?.name?.toLowerCase();

  useEffect(() => {
    if (roleName && !navigated) {
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
    <div className="flex h-screen w-full bg-gradient-to-br from-gray-900 via-blue-900 to-black items-center justify-center font-sans relative overflow-hidden">
      {/* Glass Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl p-8 relative z-10">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-14 w-14 object-contain" />
        </div>

        <h1 className="text-2xl font-semibold text-white text-center">Welcome back</h1>
        <p className="text-gray-300 text-sm text-center mb-6">
          Please enter your details to sign in.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="flex items-center bg-white/10 rounded-lg border border-white/20 overflow-hidden">
            <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
              className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-300 focus:outline-none"
            />
            
          </div>

          {/* Password */}
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full bg-white/10 text-white placeholder-gray-300 border border-white/20 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-300 via-blue-500 to-blue-100 hover:from-blue-600 hover:via-blue-600 hover:to-indigo-600 text-white py-3 rounded-md transition duration-300 shadow-lg" > {loading ? "Logging in..." : "Log in"} </button>

          {/* Remember Me */}
          <label className="flex items-center text-gray-300 text-sm">
            <input type="checkbox" className="mr-2 accent-sky-500" />
            Remember me
          </label>

          {/* OR Divider */}
          <div className="flex items-center gap-2 text-gray-400 text-sm my-4">
            <div className="flex-1 h-px bg-white/20"></div>
            <span>OR</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </div>

          {/* Social Buttons */}
          <button
            type="button"
            className="w-full flex items-center justify-between bg-white/10 text-white border border-white/20 px-4 py-3 rounded-lg hover:bg-white/20 transition"
          >
            <span className="flex items-center gap-2">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google" className="h-5 w-5"/>
              Continue with Google
            </span>
            →
          </button>

          <button
            type="button"
            className="w-full flex items-center justify-between bg-white/10 text-white border border-white/20 px-4 py-3 rounded-lg hover:bg-white/20 transition"
          >
            <span className="flex items-center gap-2">
              <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" className="h-5 w-5"/>
              Continue with GitHub
            </span>
            →
          </button>

          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}

          {/* Register Link */}
          <p className="text-sm text-gray-300 text-center mt-6">
            Don’t have an account?{" "}
            <Link to="/register" className="text-sky-400 hover:text-sky-300">
              Create Account
            </Link>
          </p>
        </form>
      </div>

      {/* Background Glow */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl"></div>
    </div>
  );
};

export default LoginForm;
