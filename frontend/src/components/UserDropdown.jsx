import { useState, useRef, useEffect } from 'react';
import { FaSignOutAlt, FaUserCircle, FaCog } from 'react-icons/fa';
import { LogoutButton } from './LogoutButton';

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <img
        src="https://demo.themesberg.com/windster-pro/images/users/neil-sims.png" // Replace with actual avatar path
        alt="User Avatar"
        className="w-8 h-8 rounded-full cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b">
            <div className="font-semibold">John Doe</div>
            <div className="text-xs text-gray-500">johndoe@example.com</div>
          </div>
          <ul className="text-sm">
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2">
                <FaUserCircle />
                <span>Profile</span>
              </button>
            </li>
            <li>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2">
                <FaCog />
                <span>Settings</span>
              </button>
            </li>
            <li>
              <LogoutButton/>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
