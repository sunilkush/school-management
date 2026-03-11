import { useState } from "react";
import { Button, Table, Tag } from "antd";
import AddBoardClassModal from "../../../components/forms/AddBoardClassModal.jsx";

export default function BoardClassPage() {

  const [open, setOpen] = useState(false);
  

  const dataSource = [
    {
      key: "1",
      boardName: "CBSE",
      className: "10th",
      status: "active"
    },
    {
      key: "2",
      boardName: "ICSE",
      className: "9th",
      status: "inactive"
    }
  ];

  const columns = [
    {
      title: "Board",
      dataIndex: "boardName"
    },
    {
      title: "Class",
      dataIndex: "className"
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        )
    }
  ];

  return (
    <div className="p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <h1 className="text-2xl font-semibold">
          Board Classes
        </h1>

        <Button
          type="primary"
          onClick={() => setOpen(true)}
        >
          Add Board Class
        </Button>

      </div>

      {/* Table */}

      <div className="bg-white rounded-xl shadow p-4">

        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{ pageSize: 10 }}
        />

      </div>

      {/* Modal */}

      <AddBoardClassModal
        open={open}
        setOpen={setOpen}
      />

    </div>
  );
}