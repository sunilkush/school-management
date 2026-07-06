import React from "react";
import { IdcardOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Students = () => (
  <UserRoleList
    roleNames={["Student"]}
    title="Student Management"
    subtitle="Super Admin can manage students across all schools"
    icon={<IdcardOutlined />}
    nounSingular="student"
    nounPlural="students"
  />
);

export default Students;
