import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Space } from "antd";
import { TeamOutlined, SolutionOutlined } from "@ant-design/icons";

import AdmissionForm from "../../../components/forms/AdmissionForm";
import PageHeader from "../../../components/layout/PageHeader";

/**
 * New admission, as a page. The form was written for a dialog and used to be dropped onto the
 * route bare — no page header, no breadcrumb, and no way out of it except the sidebar. It now
 * sits in the same page shell as every other screen, with the two places an admission usually
 * comes from or goes to within reach.
 */
const AddStudent = () => {
  const navigate = useNavigate();

  return (
    <>
      <PageHeader
        title="New Admission"
        subtitle="Admit a student and create the family's logins"
        icon={<SolutionOutlined />}
        extra={
          <Space wrap>
            <Button icon={<SolutionOutlined />} onClick={() => navigate("/dashboard/schooladmin/admission/inquiry")}>
              Admission Inquiries
            </Button>
            <Button icon={<TeamOutlined />} onClick={() => navigate("/dashboard/schooladmin/studentList")}>
              All Students
            </Button>
          </Space>
        }
      />
      <div className="page-wrapper">
        <div className="page-card" style={{ maxWidth: 1100, margin: "0 auto" }}>
          <AdmissionForm />
        </div>
      </div>
    </>
  );
};

export default AddStudent;
