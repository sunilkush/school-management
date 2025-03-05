import React from "react";
import google from "../assets/google.svg";
import facebook from "../assets/facebook.svg";
import react from "../assets/react.svg";


const LoginPage = () => {
    return (
        <>
            <div className="w-full h-screen bg-gray-900 md:px-40 sm:px-2.5">
                <div className="flex justify-center items-center h-screen">
                    <div className="p-10 bg-white lg:w-1/2 md:w-3xl rounded-lg sm:w-full">
                        <h4 className="text-3xl font-bold mb-3">Login in to your Account</h4>
                        <p className="text-gray-600">welcome back! Select method to log in : </p>

                        <div className="flex justify-around items-center mt-5">
                            <button type="button" className="border-1 border-gray-300 rounded-lg px-5 py-2 w-1/2 text-gray-500 cursor-pointer flex justify-center hover:bg-gray-200"><img src={google} alt="google" className="w-6 h-6 mr-3 " />Google</button>
                            <button type="button" className="ml-5 border-1 border-gray-300 rounded-lg px-5 py-2 w-1/2 text-gray-500 cursor-pointer flex justify-center hover:bg-gray-200"><img src={facebook} alt="facebook" className="w-6 h-6 mr-3" />Facebook</button>
                        </div>
                        <div className="py-6 flex justify-between">
                            <div><span className="text-gray-500">--------------------</span></div>
                            <div><p className="text-center text-gray-500">or continue with email</p></div>
                            <div><span className="text-gray-500">--------------------</span></div>

                        </div>
                        <div className="">
                            <div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16">
                                            <path d="m10.036 8.278 9.258-7.79A1.979 1.979 0 0 0 18 0H2A1.987 1.987 0 0 0 .641.541l9.395 7.737Z" />
                                            <path d="M11.241 9.817c-.36.275-.801.425-1.255.427-.428 0-.845-.138-1.187-.395L0 2.6V14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2.5l-8.759 7.317Z" />
                                        </svg>
                                    </div>
                                    <input type="text" id="input-group-1" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Email" />
                                </div>
                                <div className="relative mb-6">
                                    <div className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none">
                                        <svg className="w-6 h-6 text-gray-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14v3m-3-6V7a3 3 0 1 1 6 0v4m-8 0h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" />
                                        </svg>

                                    </div>
                                    <input type="text" id="input-group-1" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Password" />
                                </div>
                            </div>
                        </div>
                        <div className="">
                            <p className="text-blue-600 text-right">Forgot Password ?</p>
                        </div>
                        <div className="mt-3">
                            <button className="w-full rounded-lg bg-blue-800 text-white py-3 cursor-pointer hover:bg-blue-950">Login</button>
                        </div>
                        <div className="mt-5">
                            <p className="text-center">Don't have an account? <span className="text-blue-800">Create an account</span></p>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default LoginPage;
