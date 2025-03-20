
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import DashboardFooter from "../components/DashboardFooter";


const Dashboard = () => {

  return (
    <>
  
<div>
   <TopBar></TopBar>
   <div className="flex overflow-hidden bg-white pt-16">
     <Sidebar></Sidebar>
      <div className="bg-gray-900 opacity-50 hidden fixed inset-0 z-10" id="sidebarBackdrop"></div>
      <div id="main-content" className="h-full w-full bg-gray-50 relative overflow-y-auto lg:ml-64">
         <main>
            <Outlet/>
         </main>
         <DashboardFooter/>
        
      </div>
   </div>
   <script async defer src="https://buttons.github.io/buttons.js"></script>
   <script src="https://demo.themesberg.com/windster/app.bundle.js"></script>
</div>
    </>
  )

}

export default Dashboard