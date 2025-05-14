import { useState, useRef, useEffect } from 'react';
import { FaBell, FaEye } from 'react-icons/fa';

const notifications = [
  {
    id: 1,
    avatar: 'https://demo.themesberg.com/windster-pro/images/users/neil-sims.png',
    name: 'Bonnie Green',
    message: 'New message from',
    time: 'a few moments ago',
    text: '"Hey, what\'s up? All set for the presentation?"',
    iconBg: 'bg-blue-100',
  },
  {
    id: 2,
    avatar: 'https://demo.themesberg.com/windster-pro/images/users/neil-sims.png',
    name: 'Jese leos',
    message: 'started following you.',
    time: '10 minutes ago',
    extra: '5 others',
    iconBg: 'bg-pink-100',
  },
  {
    id: 3,
    avatar: 'https://demo.themesberg.com/windster-pro/images/users/neil-sims.png',
    name: 'Joseph Mcfall',
    message: 'love your story. See it and view more stories.',
    time: '44 minutes ago',
    extra: '141 others',
    iconBg: 'bg-red-100',
  },
  {
    id: 4,
    avatar: 'https://demo.themesberg.com/windster-pro/images/users/neil-sims.png',
    name: 'Leslie Livingston',
    message: 'mentioned you in a comment:',
    time: '1 hour ago',
    text: '@bonnie.green what do you say?',
    iconBg: 'bg-green-100',
  },
  {
    id: 5,
    avatar: 'https://demo.themesberg.com/windster-pro/images/users/neil-sims.png',
    name: 'Robert Brown',
    message: 'posted a new video: Glassmorphism - learn how to implement the new design trend.',
    time: '3 hours ago',
    iconBg: 'bg-purple-100',
  },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative text-gray-600 text-lg">
        <FaBell />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">5</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="bg-blue-100 text-blue-800 text-center py-1 font-semibold text-sm">Notifications</div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((item) => (
              <li key={item.id} className="px-4 py-3 hover:bg-gray-50 border-b">
                <div className="flex items-start space-x-3">
                  <img src={item.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 text-sm text-gray-700">
                    <p>
                      {item.message.includes('message') ? (
                        <>
                          {item.message} <span className="font-semibold">{item.name}</span>: {item.text}
                        </>
                      ) : item.extra ? (
                        <>
                          <span className="font-semibold">{item.name}</span> and{' '}
                          <span className="font-semibold">{item.extra}</span> {item.message}
                        </>
                      ) : (
                        <>
                          <span className="font-semibold">{item.name}</span> {item.message}
                        </>
                      )}
                    </p>
                    <span className="text-xs text-blue-500">{item.time}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="text-center py-2 text-sm hover:bg-gray-100 cursor-pointer border-t">
            <button className="inline-flex items-center gap-2 text-blue-600 font-medium">
              <FaEye />
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
