import React from "react";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <div className="w-full max-w-5xl bg-white shadow-md rounded-lg flex overflow-hidden">
        {/* Left Side - Illustration */}
        <div className="hidden md:flex w-1/2 bg-gray-50 items-center justify-center">
          <img
            src="https://res.cloudinary.com/dspa4q1mo/image/upload/v1748256708/tablet-login-concept-illustration_mk7w16.png" // Replace with your own image or use external link
            alt="Login Illustration"
            className="w-3/4 h-auto"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Login Now</h2>
          <p className="text-sm text-gray-600 mb-6">
            Hey enter your details to sign in to your account
          </p>

          <form className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username/email"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition"
            >
              Login In
            </button>
          </form>

          <div className="text-sm text-center text-blue-600 mt-3 hover:underline cursor-pointer">
            Having Trouble to login in?
          </div>

          <div className="flex items-center my-6">
            <hr className="flex-grow border-t border-gray-300" />
            <span className="mx-3 text-gray-400 text-sm">OR Sign in with</span>
            <hr className="flex-grow border-t border-gray-300" />
          </div>

          <div className="flex gap-4 justify-center">
            <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100">
              <img src="https://img.icons8.com/color/16/google-logo.png" alt="Google" />
              Google
            </button>
            <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100">
              <img src="https://img.icons8.com/fluency/16/facebook-new.png" alt="Facebook" />
              Facebook
            </button>
          </div>

          <p className="text-sm text-center mt-6">
            Don’t have an account?{" "}
            <span className="text-blue-600 hover:underline cursor-pointer">
              Signup Now
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
