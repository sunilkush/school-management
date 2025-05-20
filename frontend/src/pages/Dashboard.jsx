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
  const [isLoading, setIsLoading] = useState(true); // control loading state
 
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchUserRole = async () => {
     const userNew = JSON.parse(user)
      if (userNew && userNew.roleId) {
        try {
          const resultAction = await dispatch(fetchRoles(userNew.roleId));
          if (fetchRoles.fulfilled.match(resultAction)) {
            setRole(resultAction.payload.name); // e.g., "Super Admin"
          } else {
            console.error("Failed to fetch role:", resultAction);
          }
        } catch (err) {
          console.error("Error fetching role:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchUserRole();
  }, [dispatch, user,navigate]);
  console.log(role)
  // Show loading screen until user and role are available
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
