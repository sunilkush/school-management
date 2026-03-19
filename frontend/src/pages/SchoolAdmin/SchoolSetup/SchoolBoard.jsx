import React, { useEffect, useState } from "react";
import { Card, Select, Button, message, Spin } from "antd";

const { Option } = Select;

const SchoolBoard = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [loading, setLoading] = useState(false);

  const schoolId = "123"; // 👉 dynamic karna later

  // 🔹 Fetch all boards
  const fetchBoards = async () => {
    try {
      setLoading(true);
      // API call
      const res = await fetch("/api/boards");
      const data = await res.json();
      setBoards(data.data || []);
    } catch (err) {
      message.error("Failed to load boards");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Fetch already assigned boards
  const fetchSchoolBoards = async () => {
    try {
      const res = await fetch(`/api/school-boards/${schoolId}`);
      const data = await res.json();

      const boardIds = data.data.map((b) => b.boardId);
      setSelectedBoards(boardIds);
    } catch (err) {
      message.error("Failed to load school boards");
    }
  };

  useEffect(() => {
    fetchBoards();
    fetchSchoolBoards();
  }, []);

  // 🔹 Save mapping
  const handleSave = async () => {
    try {
      setLoading(true);

      await fetch("/api/school-boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId,
          boardIds: selectedBoards,
        }),
      });

      message.success("Boards assigned successfully ✅");
    } catch (err) {
      message.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Assign Boards to School"
      style={{ maxWidth: 500, margin: "auto" }}
    >
      <Spin spinning={loading}>
        <Select
          mode="multiple"
          placeholder="Select Boards"
          style={{ width: "100%" }}
          value={selectedBoards}
          onChange={setSelectedBoards}
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
          style={{ marginTop: 20 }}
          onClick={handleSave}
        >
          Save
        </Button>
      </Spin>
    </Card>
  );
};

export default SchoolBoard;