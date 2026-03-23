import React, { useEffect, useState } from "react";
import {
  Card,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Space,
  Table,
} from "antd";

import {
  getBoards,
  assignSchoolBoards,
  getSchoolBoards,
} from "../../../features/boardSlice";

import { useDispatch, useSelector } from "react-redux";

const { Option } = Select;
const { Title, Text } = Typography;

const SchoolBoard = () => {
  const dispatch = useDispatch();

  const {
    boards = [],
    schoolBoards = [],
    loading,
  } = useSelector((state) => state.boards);

  const [selectedBoard, setSelectedBoard] = useState(null);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;

  /* ================= LOAD ================= */
  useEffect(() => {
    dispatch(getBoards());
    if (schoolId) {
      dispatch(getSchoolBoards(schoolId));
    }
  }, [dispatch, schoolId]);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      if (!selectedBoard) {
        return message.warning("Please select a board");
      }

      const payload = {
        schoolId,
        boardId: selectedBoard,
      };

      await dispatch(assignSchoolBoards(payload)).unwrap();

      message.success("Board assigned successfully ✅");
      setSelectedBoard(null);

      // 🔥 reload table
      dispatch(getSchoolBoards(schoolId));
    } catch (error) {
      message.error("Failed to save",error);
    }
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Board Name",
      dataIndex: "boardId",
      render: (board) => board?.name || "-",
    },
    {
      title: "Primary",
      dataIndex: "isPrimary",
      render: (val) => (val ? "Yes" : "No"),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val) => (val ? "Active" : "Inactive"),
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* 🔹 Assign Card */}
      <Card
        style={{
          maxWidth: 500,
          margin: "auto",
          borderRadius: 12,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4}>Assign Board</Title>
          <Text type="secondary">
            Select board to assign to this school
          </Text>

          <Spin spinning={loading}>
            <Select
              placeholder="Select Board"
              style={{ width: "100%" }}
              value={selectedBoard}
              onChange={setSelectedBoard}
              allowClear
              showSearch
            >
              {boards.map((board) => (
                <Option key={board._id} value={board._id}>
                  {board.name}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              block
              size="large"
              style={{ marginTop: 16 }}
              onClick={handleSave}
              disabled={!selectedBoard}
            >
              Save Changes
            </Button>
          </Spin>
        </Space>
      </Card>

      {/* 🔹 Table */}
      <Card style={{ marginTop: 30 }}>
        <Title level={5}>Assigned Boards</Title>

        <Table
          dataSource={schoolBoards}
          columns={columns}
          rowKey="_id"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default SchoolBoard;