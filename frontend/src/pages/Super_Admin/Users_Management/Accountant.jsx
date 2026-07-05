import React from "react";
import RupeeIcon from "../../../components/icons/RupeeIcon";
import UserRoleList from "./UserRoleList";

const Accountant = () => (
  <UserRoleList
    roleNames={["Accountant"]}
    title="Accountant Management"
    subtitle="Super Admin can manage accountants across all schools"
    icon={<RupeeIcon />}
    nounSingular="accountant"
    nounPlural="accountants"
  />
);

export default Accountant;
