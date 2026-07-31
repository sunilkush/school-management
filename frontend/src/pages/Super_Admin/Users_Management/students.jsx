import React from "react";
import { IdcardOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";
import TransferStudentModal from "./TransferStudentModal";

const Students = () => (
  <UserRoleList
    roleNames={["Student"]}
    title="Student Management"
    subtitle="Super Admin can manage students across all schools"
    icon={<IdcardOutlined />}
    nounSingular="student"
    nounPlural="students"
    extraRowAction={(record) => <TransferStudentModal user={record} />}
  />
);

export default Students;
