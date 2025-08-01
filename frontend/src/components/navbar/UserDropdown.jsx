import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    User, Mail, Bell, Settings, LogOut, ChevronDown
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const UserDropdown = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef();
    const { user } = useSelector((state) => state.auth);
    const rolePath = user?.role?.name?.toLowerCase().replace(/\s+/g, '') || 'user';

    const handleLogout = () => {
        dispatch(logout());
        navigate('/');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 hover:text-primary"
            >
                {user?.avatar ? (
                    <img
                        src={user.avatar}
                        alt="avatar"
                        className="w-8 h-8 rounded-full"
                    />
                ) : (
                    <User className="w-8 h-8 rounded-full text-gray-500 bg-gray-200 p-1" />
                )}
                <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-3 w-60 bg-white rounded-xl shadow-lg border p-4 z-50">
                    {/* Header */}
                    <div className="flex items-start gap-3 border-b pb-3 mb-3 flex-col">
                        <div className="flex gap-2">
                            <div>
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt="User Avatar"
                                        className="w-10 h-10 rounded-full"
                                    />
                                ) : (
                                    <User className="w-10 h-10 rounded-full text-gray-500 bg-gray-200 p-2" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500">{user?.role?.name || 'Role'}</p>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-xs text-gray-500 text-ellipsis overflow-hidden">{user?.email || 'example@email.com'}</p>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="flex flex-col gap-2 text-sm">
                        <Link to={`/dashboard/${rolePath}/profile`} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-gray-700">
                            <User size={16} /> Profile
                        </Link>
                        <Link to={`/dashboard/${rolePath}/message`} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-gray-700">
                            <Mail size={16} /> Message
                        </Link>
                        <Link to={`/dashboard/${rolePath}/notification`} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-gray-700">
                            <Bell size={16} /> Notification
                        </Link>
                        <Link to={`/dashboard/${rolePath}/settings`} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-gray-700">
                            <Settings size={16} /> Settings
                        </Link>
                    </div>

                    {/* Logout */}
                    <button
                        className="w-full mt-3 flex items-center justify-center gap-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 py-2 rounded-md"
                        onClick={handleLogout}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserDropdown;
