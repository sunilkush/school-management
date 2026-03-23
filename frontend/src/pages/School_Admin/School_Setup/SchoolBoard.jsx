import React, { useEffect, useState } from "react";
import {
  Card,
  Select,
  Button,
  message,
  Spin,
  Typography,
  Space,
} from "antd";
import {
  getBoards,
  assignSchoolBoards,
} from "../../../features/boardSlice";
import { useDispatch, useSelector } from "react-redux";

const { Option } = Select;
const { Title, Text } = Typography;

const SchoolBoard = () => {
  const dispatch = useDispatch();

  const { boards = [], loading } = useSelector((state) => state.boards);

  const [selectedBoards, setSelectedBoards] = useState([]);

  // ✅ FIX: parse user
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;

  // 🔹 Load boards
  useEffect(() => {
    dispatch(getBoards());
  }, [dispatch]);

  // 🔹 Save mapping
  const handleSave = async () => {
    try {
      if (!selectedBoards.length) {
        return message.warning("Please select at least one board");
      }

      const payload = {
        schoolId,
        boardIds: selectedBoards,
      };

      await dispatch(assignSchoolBoards(payload)).unwrap();

      message.success("Boards assigned successfully ✅");
    } catch (error) {
      message.error("Failed to save");
      console.log(error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Card
        style={{
          maxWidth: 500,
          margin: "auto",
          borderRadius: 12,
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Title level={4}>Assign Boards</Title>
          <Text type="secondary">
            Select boards to assign to this school
          </Text>

          <Spin spinning={loading}>
            <Select
              mode="multiple"
              placeholder="Select Boards"
              style={{ width: "100%" }}
              value={selectedBoards}
              onChange={setSelectedBoards}
              allowClear
              showSearch
              optionFilterProp="children"
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
              disabled={!selectedBoards.length}
            >
              Save Changes
            </Button>
          </Spin>
        </Space>
      </Card>
    </div>
  );
};

export default SchoolBoard;