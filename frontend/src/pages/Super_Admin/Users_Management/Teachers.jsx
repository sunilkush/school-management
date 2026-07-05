import React from "react";
import { BookOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Teachers = () => (
  <UserRoleList
    roleNames={["Teacher"]}
    title="Teacher Management"
    subtitle="Super Admin can manage teachers across all schools"
    icon={<BookOutlined />}
    nounSingular="teacher"
    nounPlural="teachers"
  />
);

export default Teachers;
