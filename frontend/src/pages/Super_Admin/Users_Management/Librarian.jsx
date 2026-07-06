import React from "react";
import { BookOutlined } from "@ant-design/icons";
import UserRoleList from "./UserRoleList";

const Librarian = () => (
  <UserRoleList
    roleNames={["Librarian"]}
    title="Librarian Management"
    subtitle="Super Admin can manage librarians across all schools"
    icon={<BookOutlined />}
    nounSingular="librarian"
    nounPlural="librarians"
    enableBulkActions={false}
  />
);

export default Librarian;
