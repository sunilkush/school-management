import React, { useState } from "react";
import { Button, Modal } from "antd";
import { PlusOutlined, UserSwitchOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import RegisterSchoolAdminForm from "../../../components/forms/RegisterSchoolAdminForm";
import UserRoleList from "./UserRoleList";
import { modalTitle } from "../../../styles/pageStyles";

const Admins = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleClose = () => {
    setIsModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  return (
    <UserRoleList
      key={refreshKey}
      roleNames={["School Admin"]}
      title="School Admin Management"
      subtitle="Manage and monitor all school administrators"
      icon={<SafetyCertificateOutlined />}
      nounSingular="admin"
      nounPlural="admins"
      enableBulkActions={false}
      headerExtra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Add School Admin
        </Button>
      }
    >
      <Modal
        title={modalTitle(<UserSwitchOutlined />, "Register New School Admin", "Fill in the details below")}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {/* Not RegisterForm: that is the staff wizard, with an employee profile and an opening
            salary structure a platform administrator has no basis to fill in. */}
        <RegisterSchoolAdminForm onClose={handleClose} />
      </Modal>
    </UserRoleList>
  );
};

export default Admins;
