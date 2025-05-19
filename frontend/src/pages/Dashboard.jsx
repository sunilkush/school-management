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
  console.log(role)
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
    }

    const fetchUserRole = async () => {
      if (user?.roleId) {
        const resultAction = await dispatch(fetchRoles(user.roleId));
        if (fetchRoles.fulfilled.match(resultAction)) {
          setRole(resultAction.payload.name); // assuming role object has "name"
        }
      }
    };

    fetchUserRole();
  }, [dispatch, user, navigate]);

  if (!role) {
    return <div className="text-center mt-20">Loading...</div>;
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
