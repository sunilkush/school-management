import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import google from "../assets/google.svg";
import facebook from "../assets/facebook.svg";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true); // ✅ Set to true when starting login

        try {
            const response = await fetch("http://localhost:9000/app/v1/user/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            setLoading(false); // ✅ Stop loading when response is received

            if (!data.status || !data.data) {
                throw new Error(data.message || "Login Failed");
            }

            // ✅ Correctly extracting accessToken and refreshToken
            const { accessToken, refreshToken } = data.data;
            console.log("Login successful:", data.data);

            if (accessToken && refreshToken) {
                localStorage.setItem("token", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                alert("Login successful");
                navigate("/dashboard"); // ✅ Redirect using navigate
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="w-full h-screen bg-gray-900 md:px-40 sm:px-2.5">
            <div className="flex justify-center items-center h-screen">
                <div className="p-10 bg-white 2xl:w-1/3 lg:1/2 md:w-3xl rounded-lg sm:w-full">
                    <h4 className="text-3xl font-bold mb-3">Login to your Account</h4>
                    <p className="text-gray-600">Welcome back! Select a method to log in:</p>

                    <div className="flex justify-around items-center mt-5">
                        <button type="button" className="border border-gray-300 rounded-lg px-5 py-2 w-1/2 text-gray-500 cursor-pointer flex justify-center hover:bg-gray-200">
                            <img src={google} alt="google" className="w-6 h-6 mr-3" /> Google
                        </button>
                        <button type="button" className="ml-5 border border-gray-300 rounded-lg px-5 py-2 w-1/2 text-gray-500 cursor-pointer flex justify-center hover:bg-gray-200">
                            <img src={facebook} alt="facebook" className="w-6 h-6 mr-3" /> Facebook
                        </button>
                    </div>

                    <div className="py-6 flex justify-center">

                        <p className="text-center text-gray-500">- or continue with email -</p>

                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <form onSubmit={handleSubmit}>
                        <div className="relative mb-6">
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                placeholder="Email" required />
                        </div>

                        <div className="relative mb-6">
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                placeholder="Password" required />
                        </div>

                        <p className="text-blue-600 text-right cursor-pointer">Forgot Password?</p>

                        <button type="submit" disabled={loading}
                            className="w-full rounded-lg bg-blue-800 text-white py-3 cursor-pointer hover:bg-blue-950">
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p className="text-center mt-5">Don't have an account? <span className="text-blue-800 cursor-pointer">Create an account</span></p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
