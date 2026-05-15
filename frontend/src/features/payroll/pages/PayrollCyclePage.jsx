import { Alert, Card, Empty } from "antd";
import { useSelector } from "react-redux";
import PayrollPageHeader from "../components/PayrollPageHeader";

export default function PayrollCyclePage() {
  const selectedAcademicYear = useSelector((s) => s.academicYear?.selectedAcademicYear || s.auth?.user?.selectedAcademicYear);
  return (
    <div className="p-4 space-y-4">
      <PayrollPageHeader title="PayrollCycle" subtitle="Payroll workspace" />
      {!selectedAcademicYear && <Alert type="warning" showIcon message="Select academic year" description="Academic year missing, actions are disabled." />}
      <Card>{selectedAcademicYear ? <Empty description="Connect API data" /> : <Empty description="No Academic Year Selected" />}</Card>
    </div>
  );
}
