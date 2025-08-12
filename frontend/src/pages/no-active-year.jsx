import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice'; // ✅ Make sure this path is correct

const NoActiveYear = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth); // ✅ logout removed from here
    const role = user?.role?.name;

    const handleGoToSettings = () => {
        // If the user is not a Super Admin, log them out and redirect to the home page
        if (role !== 'Super Admin') {
            dispatch(logout()); // ✅ Correctly dispatch the logout action
            localStorage.clear(); // Clear local storage
            navigate('/', { replace: true });
        } else {
            navigate('/settings'); // ✅ Add this if you want to go to settings for Super Admin
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h1 className="text-3xl font-bold mb-4">No Active Academic Year</h1>
                <p className="text-gray-600 mb-6">
                    Please select or create an academic year to continue.
                </p>
                <p className="text-gray-600 mb-6">
                    If you are a Super Admin, you can create an academic year in the settings.
                </p>
                <button
                    onClick={handleGoToSettings}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition duration-200"
                >
                    Go to Settings
                </button>
            </div>
        </div>
    );
};

export default NoActiveYear;
