import React from "react";
import { SolutionOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Staff = () => (
  <UserRoleList
    roleNames={["Staff"]}
    title="Staff Management"
    subtitle="Manage all staff members across schools"
    icon={<SolutionOutlined />}
    nounSingular="staff member"
    nounPlural="staff members"
  />
);

export default Staff;
