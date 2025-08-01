import React from 'react';
import { Users } from 'lucide-react';
import SummaryCards from './dashboardComponents/SummaryCards.jsx';
import SalaryStatistics from './dashboardComponents/SalaryStatistics';
import TotalSalaryByUnit from './dashboardComponents/TotalSalaryByUnit';
import IncomeAnalysis from './dashboardComponents/IncomeAnalysis';
import EmployeeStructure from './dashboardComponents/EmployeeStructure';
import EmployeePerformance from './dashboardComponents/EmployeePerformance';

const SchoolAdminDashboard = () => {
  return (
    <div className=" min-h-screen space-y-6">

      <h4 className="text-2xl font-bold">Dashboard</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <SummaryCards />
        <SalaryStatistics />
        </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
         <div class="grid grid-flow-row-dense grid-cols-3 gap-6">
        <div class="col-span-2"><TotalSalaryByUnit /></div>
        <div class=""><IncomeAnalysis /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
         <div class="grid grid-flow-row-dense grid-cols-3 gap-6">
          
          <div class=""><EmployeeStructure /></div>
          <div class="col-span-2"> <EmployeePerformance /></div>
         </div>
        
       
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
