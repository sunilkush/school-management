import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'


import {
  Home,
  Calendar,
  FileText,
  FilePenLine,
  MessageSquare,
  LogOut
} from 'lucide-react'
import { logout } from '../../features/auth/authSlice'


// Menu config with role-based access
const menuItems = [
  {
    name: 'Dashboard',
    icon: Home,
    path: 'super-admin',
    roles: ['Super Admin', ]
  },
    {
    name: 'Dashboard',
    icon: Home,
    path: 'teacher',
    roles: ['Teacher']
  },
    {
    name: 'Dashboard',
    icon: Home,
    path: 'student',
    roles: [ 'Student']
  },
   {
    name: 'Dashboard',
    icon: Home,
    path: 'school-admin',
    roles: ['School Admin']
  },
  {
    name: 'Schedule',
    icon: Calendar,
    path: 'schedule',
    roles: ['School Admin', 'Teacher']
  },
  {
    name: 'Reports',
    icon: FileText,
    path: 'reports',
    roles: ['Super Admin', 'School Admin']
  },
  {
    name: 'Documents',
    icon: FilePenLine,
    path: 'documents',
    roles: ['Teacher']
  },
  {
    name: 'Message',
    icon: MessageSquare,
    path: 'messages',
    badge: 12,
    dot: true,
    roles: ['Teacher', 'Student']
  }
]
export default function Sidebar() {
 
  const dispatch = useDispatch()
  const navigate = useNavigate()

 const token = localStorage.getItem('accessToken');
const { user } = useSelector((state) => state.auth);
const role = user?.role;

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  if (!token ) {
    return (
      <aside className="w-64 h-screen bg-white flex items-center justify-center">
        <span className="text-gray-400">Authenticating...</span>
      </aside>
    )
  }

  return (
    <aside className="w-64 h-screen bg-white flex flex-col justify-between border-r shadow-sm ">
      <div>
        {/* Logo */}
        <div className="p-6 text-purple-600 font-bold text-xl flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-full">
            <Home size={20} />
          </div>
          <span>Logo</span>
        </div>
        <hr className="border-gray-100" />

        {/* Navigation */}
        <nav className="mt-4 space-y-1">
          {menuItems
           .filter((item) => role && item.roles.includes(role.name)) 
            // eslint-disable-next-line no-unused-vars
            .map(({ name, icon : Icon, path, badge, dot }) => (
              <NavLink
                key={name}
                to={path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-6 py-2.5 group ${
                    isActive
                      ? 'bg-purple-100 text-purple-600 font-semibold rounded-lg'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <span>{name}</span>
                </div>
                {badge && (
                  <div className="flex items-center gap-1">
                    {dot && (
                      <span className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
                    )}
                    <span className="text-xs bg-purple-600 text-white rounded-full px-2 py-0.5 font-medium">
                      {badge}
                    </span>
                  </div>
                )}
              </NavLink>
            ))}
        </nav>
      </div>

      {/* Logout */}
      <div
        className="px-6 py-4 border-t text-gray-400 hover:text-red-500 cursor-pointer flex items-center gap-3"
        onClick={handleLogout}
      >
        <LogOut size={18} />
        Log Out
      </div>
    </aside>
  )
}
