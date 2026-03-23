import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Switch,
  message,
  Spin,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Select,
  Row,
  Col,
  Typography,
} from "antd";
import { useDispatch, useSelector } from "react-redux";
import { getBoards } from "../../../features/boardSlice";
import { getBoardClass } from "../../../features/boardClassSlice";

const { Option } = Select;
const { Title } = Typography;

const SchoolClass = () => {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector(
    (state) => state.boardClass
  );
  const boards = useSelector((state) => state.boards.boards || []);

  const [selectedBoard, setSelectedBoard] = useState(null);

  // Local state
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionInputs, setSectionInputs] = useState({});

  // =========================
  // 🔹 LOAD DATA
  // =========================
  useEffect(() => {
    dispatch(getBoards());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBoard) {
      dispatch(getBoardClass(selectedBoard));
    }
  }, [selectedBoard, dispatch]);

  // =========================
  // 🔹 HELPERS
  // =========================
  const isChecked = (classId) =>
    assignedClasses.some((c) => c === classId);

  const getSectionsByClass = (classId) =>
    sections.filter((sec) => sec.classId === classId);

  // =========================
  // 🔹 TOGGLE CLASS
  // =========================
  const handleToggle = (record) => {
    if (isChecked(record._id)) {
      setAssignedClasses(
        assignedClasses.filter((id) => id !== record._id)
      );
    } else {
      setAssignedClasses([...assignedClasses, record._id]);
    }
  };

  // =========================
  // 🔹 ADD SECTION
  // =========================
  const handleAddSection = (classId) => {
    const input = sectionInputs[classId];
    if (!input) return message.warning("Enter section name");

    const names = input.split(",").map((s) => s.trim());

    const newSections = names.map((name) => ({
      _id: Date.now() + Math.random(),
      name,
      classId,
    }));

    setSections([...sections, ...newSections]);

    setSectionInputs({
      ...sectionInputs,
      [classId]: "",
    });
  };

  // =========================
  // 🔹 DELETE SECTION
  // =========================
  const handleDeleteSection = (id) => {
    setSections(sections.filter((s) => s._id !== id));
  };

  // =========================
  // 🔹 TABLE
  // =========================
  const columns = [
    {
      title: "Class",
      dataIndex: "name",
    },
    {
      title: "Assign",
      render: (_, record) => (
        <Switch
          checked={isChecked(record._id)}
          onChange={() => handleToggle(record)}
        />
      ),
    },
    {
      title: "Sections",
      render: (_, record) => {
        const classSections = getSectionsByClass(record._id);

        if (!isChecked(record._id)) {
          return <span style={{ color: "#999" }}>Assign class first</span>;
        }

        return (
          <div>
            {/* Existing Sections */}
            <div style={{ marginBottom: 8 }}>
              {classSections.map((sec) => (
                <Popconfirm
                  key={sec._id}
                  title="Delete section?"
                  onConfirm={() => handleDeleteSection(sec._id)}
                >
                  <Tag color="blue" style={{ cursor: "pointer" }}>
                    {sec.name} ❌
                  </Tag>
                </Popconfirm>
              ))}
            </div>

            {/* Add Section */}
            <Space>
              <Input
                placeholder="A,B,C"
                value={sectionInputs[record._id] || ""}
                onChange={(e) =>
                  setSectionInputs({
                    ...sectionInputs,
                    [record._id]: e.target.value,
                  })
                }
              />
              <Button
                size="small"
                type="primary"
                onClick={() => handleAddSection(record._id)}
              >
                Add
              </Button>
            </Space>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>School Class & Section Management</Title>
        </Col>

        <Col>
          <Select
            placeholder="Select Board"
            style={{ width: 220 }}
            value={selectedBoard}
            onChange={setSelectedBoard}
            allowClear
          >
            {boards.map((board) => (
              <Option key={board._id} value={board._id}>
                {board.name}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={boardClass}
            pagination={false}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default SchoolClass;