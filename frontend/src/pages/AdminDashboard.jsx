import SidebarMenu from "../components/Sidebar_Admin.jsx";
import Navbar from "../components/Navbar.jsx";
import StatsCards from "../components/StatsCards.jsx";
import ScheduleWidget from "../components/ScheduleWidget.jsx";
import AttendanceChart from "../components/AttendanceChart.jsx";
import FeesCollection from "../components/FeesCollection.jsx";
import EarningsCard from "../components/EarningsCard.jsx";
import TodoList from "../components/TodoList.jsx";
import NoticeBoard from "../components/NoticeBoard.jsx";
import PerformanceChart from "../components/PerformanceChart.jsx";
import SubjectStats from "../components/SubjectStats.jsx";
import StudentActivity from "../components/StudentActivity.jsx";
import LeaveRequests from "../components/LeaveRequests.jsx";
import ExpensesCard from "../components/ExpensesCard.jsx";
import ClassRoutineCard from "../components/ClassRoutineCard.jsx";
import QuickLinks from "../components/QuickLinks.jsx";
export default function AdminDashboard() {
  return (
    <div className="flex">
      
         <SidebarMenu /> 
      <main className="flex-1 p-6 space-y-6 bg-gray-200">
       
          <Navbar />
       
        <StatsCards />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ">
          <ScheduleWidget />
          <AttendanceChart />
          <FeesCollection />
          <PerformanceChart />
          <ClassRoutineCard/>
          <QuickLinks/>
          <EarningsCard />
          <ExpensesCard />
          <NoticeBoard />
          <LeaveRequests/>
          <SubjectStats />
          <StudentActivity />
          <TodoList />
        </div>
      </main>
    </div>
  );
}
