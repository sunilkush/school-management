import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/"); // Redirect to login if not authenticated
        }
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-10 bg-white shadow-lg rounded-lg">
                <h1 className="text-3xl font-bold">Welcome to Dashboard</h1>
                <p className="text-gray-600 mt-3">You are logged in!</p>

                <button
                    className="mt-5 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/"); // Logout and redirect to login
                    }}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
