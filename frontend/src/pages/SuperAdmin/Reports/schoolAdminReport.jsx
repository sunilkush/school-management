import React, { useEffect } from 'react';
import SummaryCards from './components/SummaryCards';
import { useSelector, useDispatch } from 'react-redux';
import { fetchDashboardSummary } from '../../../features/dashboardSlice';

const SchoolAdminReport = () => {
  const { summary } = useSelector((state) => state.dashboard);
  const dispatch = useDispatch();

  const storedUser = localStorage.getItem("user");
  let parsedRole;
  let parsedSchoolId;

  if (storedUser) {
    try {
      const userObj = JSON.parse(storedUser);
      parsedRole = userObj?.role?.name;
      parsedSchoolId = userObj?.school?._id; // ✅ Correct property
    } catch (e) {
      console.error("Invalid user object in localStorage", e);
    }
  }

  useEffect(() => {
    if (parsedRole) {
      dispatch(fetchDashboardSummary({ role: parsedRole, schoolId: parsedSchoolId }));
    }
  }, [dispatch, parsedRole, parsedSchoolId]);

  return (
    <div>
      <h1 className="text-2xl font-bold">{parsedRole} Report</h1>
      <p className="text-gray-600">This page will display the report for {parsedRole}.</p>
      <SummaryCards data={summary} />
    </div>
  );
};

export default SchoolAdminReport;
