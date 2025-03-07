
import google from "../assets/google.svg";
import facebook from "../assets/facebook.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function SignUp() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [school, setSchool] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = () => {

    }
    return (
        <>
            <div className="w-full h-screen bg-gray-900 md:px-40 sm:px-2.5">
                <div className="flex justify-center items-center h-screen">
                    <div className="p-10 bg-white 2xl:w-1/2 lg:1/2 md:w-3xl rounded-lg sm:w-full">
                        <h4 className="text-3xl font-bold mb-3">Create to your Account</h4>
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

                            <p className="text-center text-gray-500">- of use your email for  registration -</p>

                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <div class="grid md:grid-cols-2 gap-4 sm:grid-cols-1 ">
                        
                            <div className="relative ">
                                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                    placeholder="Name" required />
                            </div>
                            <div className="relative ">
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                    placeholder="Email" required />
                            </div>

                            <div className="relative ">
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                    placeholder="Password" required />
                            </div>
                            <div className="relative ">
                                <input type="password" value={role} onChange={(e) => setRole(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                    placeholder="role" required />
                            </div>
                                                       
                       
                        </div>
                        <div className="relative mb-6 w-full mt-4">
                                <input type="password" value={school} onChange={(e) => setSchool(e.target.value)}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5"
                                    placeholder="School" required />
                            </div>
                        <button type="submit" disabled={loading}
                                className="w-full rounded-lg bg-blue-800 text-white py-3 cursor-pointer hover:bg-blue-950">
                                {loading ? "Logging in..." : "Login"}
                            </button>
                        <p className="text-center mt-5">I have an account? <span className="text-blue-800 cursor-pointer">Login account</span></p>
                    </div>
                </div>
            </div>
        </>
    )
}

export default SignUp