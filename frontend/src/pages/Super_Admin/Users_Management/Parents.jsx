import React from "react";
import { UsergroupAddOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Parents = () => (
  <UserRoleList
    roleNames={["Parent"]}
    title="Parent Management"
    subtitle="Manage parents across all schools"
    icon={<UsergroupAddOutlined />}
    nounSingular="parent"
    nounPlural="parents"
  />
);

export default Parents;
