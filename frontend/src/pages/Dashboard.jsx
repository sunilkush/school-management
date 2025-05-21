import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRoles } from "../store/roleSlice";

import Sidebar from "../components/Sidebar";
import SidebarMenu from "../components/Sidebar_Admin";
import TopBar from "../components/TopBar";
import DashboardFooter from "../components/DashboardFooter";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((state) => state.auth.user);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if no token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch role on user change
useEffect(() => {
  const fetchUserRole = async () => {
    if (user && user.roleId) {
      try {
        const resultAction = await dispatch(fetchRoles(user.roleId));
        if (fetchRoles.fulfilled.match(resultAction)) {
          const roleName = resultAction.payload?.name;
          if (roleName) {
            setRole(roleName);
          } else {
            console.warn("Role name missing in payload");
            setRole("Unknown");
          }
        } else {
          console.error("Failed to fetch role:", resultAction);
          setRole("Unknown");
        }
      } catch (err) {
        console.error("Error fetching role:", err);
        setRole("Unknown");
      }
    } else {
      console.warn("User or roleId not present");
      setRole("Unknown");
    }
    setIsLoading(false);
  };

  fetchUserRole();
}, [dispatch, user]);
  // Show loading screen
  if (isLoading || !user || !role) {
    return <div className="text-center mt-20">Loading dashboard...</div>;
  }

  return (
    <div>
      <TopBar />
      <div className="flex overflow-hidden bg-white pt-16">
        {role === "Super Admin" ? <SidebarMenu /> : <Sidebar />}
       
        
        <div
          className="bg-gray-900 opacity-50 hidden fixed inset-0 z-10"
          id="sidebarBackdrop"
        ></div>
        <div
          id="main-content"
          className="h-full w-full bg-gray-50 relative overflow-y-auto lg:ml-64"
        >
          <main>
            <Outlet />
          </main>
          <DashboardFooter />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
