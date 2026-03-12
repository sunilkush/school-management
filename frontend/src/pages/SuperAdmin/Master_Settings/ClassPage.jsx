import React, { useEffect, useState } from "react";
import { Input, Button, Table, Modal, Select, Switch } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { createClass, fetchAllClasses } from "../../../features/classSlice";

function ClassPage() {
  const dispatch = useDispatch();

  const { classList = [], loading: classLoading } = useSelector(
    (state) => state.class
  );

  const [open, setOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    status: "active",
    isActive: true,
    isGlobal: false,
  });

  /* ================= FETCH CLASSES ================= */

  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  /* ================= HANDLE CHANGE ================= */

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ================= RESET FORM ================= */

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      status: "active",
      isActive: true,
      isGlobal: false,
    });
  };

  /* ================= SAVE CLASS ================= */

  const handleSaveClass = async () => {
    await dispatch(createClass(formData));

    dispatch(fetchAllClasses()); // refresh list

    resetForm();
    setOpen(false);
  };

  /* ================= TABLE COLUMNS ================= */

  const columns = [
    {
      title: "Class Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];

  return (
    <div className="p-4">
      {/* Header */}

      <div className="flex justify-between mb-5">
        <h1 className="text-xl font-semibold">Class List</h1>

        <Button type="primary" onClick={() => setOpen(true)}>
          Add Class
        </Button>
      </div>

      {/* Table */}

      <Table
        columns={columns}
        dataSource={classList}
        loading={classLoading}
        rowKey="_id"
      />

      {/* Modal */}

      <Modal
        title="Create Class"
        open={open}
        footer={null}
        onCancel={() => setOpen(false)}
      >
        <div className="space-y-4">
          {/* Class Name */}

          <div>
            <label className="text-sm font-medium">Class Name</label>

            <Input
              placeholder="Enter Class Name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          {/* Class Code */}

          <div>
            <label className="text-sm font-medium">Class Code</label>

            <Input
              placeholder="Enter Class Code"
              value={formData.code}
              onChange={(e) => handleChange("code", e.target.value)}
            />
          </div>

          {/* Description */}

          <div>
            <label className="text-sm font-medium">Description</label>

            <Input.TextArea
              placeholder="Enter description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          {/* Status */}

          <div>
            <label className="text-sm font-medium">Status</label>

            <Select
              style={{ width: "100%" }}
              value={formData.status}
              onChange={(value) => handleChange("status", value)}
              options={[
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ]}
            />
          </div>

          {/* Global Switch */}

          <div>
            <label className="text-sm">Global</label>
            <br />

            <Switch
              checked={formData.isGlobal}
              onChange={(value) => handleChange("isGlobal", value)}
            />
          </div>

          {/* Buttons */}

          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={resetForm}>Reset</Button>

            <Button type="primary" onClick={handleSaveClass}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ClassPage;