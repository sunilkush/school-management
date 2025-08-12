import { Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const notifications = [
  {
    id: 1,
    avatar: "https://i.pravatar.cc/40?img=3",
    message: "Dr sultads Send you Photo",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 2,
    avatar: null,
    iconText: "KG",
    message: "Resport created successfully",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 3,
    avatar: null,
    iconText: "🏠",
    message: "Reminder : Treatment Time!",
    time: "29 July 2020 – 02:26 PM",
  },
  {
    id: 4,
    avatar: "https://i.pravatar.cc/40?img=3",
    message: "Dr sultads Send you Photo",
    time: "29 July 2020 – 02:26 PM",
  },
];

const NotificationDropdown = () => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="relative text-gray-600 hover:text-black">
        <Bell className="w-5 h-5" />
        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-lg border z-50">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800">Notification</h3>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.map((note) => (
              <div key={note.id} className="flex items-start gap-3 px-4 py-3 border-b hover:bg-gray-50">
                {note.avatar ? (
                  <img src={note.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 bg-blue-100 text-deep-purple-700 font-semibold text-sm flex items-center justify-center rounded-full">
                    {note.iconText}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">{note.message}</p>
                  <p className="text-xs text-gray-400">{note.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 text-center text-sm text-blue-600 hover:underline cursor-pointer">
            See all notifications
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
