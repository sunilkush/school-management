import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'


import { Home} from 'lucide-react'
import { logout } from '../../features/auth/authSlice'
import SidebarMenu from './SidebarMenu'


export default function Sidebar() {
 
  const dispatch = useDispatch()
  const navigate = useNavigate()

 const token = localStorage.getItem('accessToken');
const { user } = useSelector((state) => state.auth);
const role = user?.role?.name.toLowerCase();
  

  if (!token ) {
    return (
      <aside className="w-64 h-screen bg-white flex items-center justify-center">
        <span className="text-gray-400">Authenticating...</span>
      </aside>
    )
  }

  return (
    <aside className="w-72  bg-white flex flex-col justify-between border-r shadow-sm overflow-hidden">
      <div>
        {/* Logo */}
        <div className="p-6 text-purple-600 font-bold text-xl flex items-center gap-2">
          <div className="bg-purple-100 p-2 rounded-full">
            <Home size={20} />
          </div>
          <span>{user?.school?.name}</span>
        </div>
        <hr className="border-gray-100" />

        {/* Navigation */}
        <SidebarMenu role={role}/>
        
      </div>

     
    </aside>
  )
}
