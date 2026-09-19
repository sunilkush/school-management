import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { TeamOutlined, UserAddOutlined } from "@ant-design/icons";

import RegisterForm from "../components/forms/RegisterForm";
import PageHeader from "../components/layout/PageHeader";
import { pageWrapper, pageCard } from "../styles/pageStyles";

/**
 * Create User, as a page. The form was written for a dialog and used to be dropped onto the
 * route inside a bare Card — no page header, no breadcrumb, and no way back to the list the new
 * user will show up in. It now sits in the same page shell as every other screen.
 */
const UserRegister = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="Create User"
        subtitle="Add a staff member — account, employee profile and payroll in one go"
        icon={<UserAddOutlined />}
        extra={
          <Space wrap>
            <Button icon={<TeamOutlined />} onClick={() => navigate("/dashboard/schooladmin/teacher")}>
              Teachers &amp; Staff
            </Button>
          </Space>
        }
      />
      <div style={pageWrapper}>
        <div style={{ ...pageCard, maxWidth: 940, margin: "0 auto", padding: "clamp(16px, 3vw, 28px)" }}>
          <RegisterForm />
        </div>
      </div>
    </>
  );
};

export default UserRegister;
