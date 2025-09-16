import React from 'react';
import { Users } from 'lucide-react';
import SummaryCards from './components/SummaryCards.jsx';
import SalaryStatistics from './components/SalaryStatistics.jsx';
import TotalSalaryByUnit from './components/TotalSalaryByUnit.jsx';
import IncomeAnalysis from './components/IncomeAnalysis.jsx';
import EmployeeStructure from './components/EmployeeStructure.jsx';
import EmployeePerformance from './components/EmployeePerformance.jsx';

const SchoolAdminDashboard = () => {
  return (
    <div className=" min-h-screen space-y-6">

      <h4 className="text-2xl font-bold">Dashboard</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <SummaryCards />
        <SalaryStatistics />
        </div>
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
         <div className="grid grid-flow-row-dense md:grid-cols-3 grid-cols-1 md:gap-6">
        <div className="col-span-2"><TotalSalaryByUnit /></div>
        <div className=""><IncomeAnalysis /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
         <div className="grid grid-flow-row-dense md:grid-cols-3 grid-cols-1 gap-6">
          
          <div className=""><EmployeeStructure /></div>
          <div className="col-span-2 "> <EmployeePerformance /></div>
         </div>
        
       
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
