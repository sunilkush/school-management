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
  Empty,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";

import { useDispatch, useSelector } from "react-redux";
import { getSchoolBoards } from "../../../features/boardSlice";
import { getBoardClass } from "../../../features/boardClassSlice";
import { createSchoolClass } from "../../../features/schoolClassSlice";
import { createSection } from "../../../features/sectionSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const SchoolClass = () => {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector(
    (state) => state.boardClass
  );

  const { schoolBoards = [] } = useSelector((state) => state.boards);

  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear
  );

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [sectionInputs, setSectionInputs] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;

  /* ================= LOAD ================= */
  useEffect(() => {
    if (schoolId) dispatch(getSchoolBoards(schoolId));
  }, [dispatch, schoolId]);

  useEffect(() => {
    if (selectedBoard) dispatch(getBoardClass(selectedBoard));
  }, [selectedBoard, dispatch]);

  /* ================= DEFAULT BOARD ================= */
  useEffect(() => {
    if (schoolBoards.length && !selectedBoard) {
      setSelectedBoard(schoolBoards[0]?.boardId?._id);
    }
  }, [schoolBoards, selectedBoard]);

  /* ================= HELPERS ================= */
  const isChecked = (id) =>
    assignedClasses.some((c) => c.classId === id);

  const getSectionsByClass = (id) =>
    sections.filter((s) => s.classId === id);

  /* ================= ASSIGN CLASS ================= */
  const handleToggle = async (record) => {
    try {
      if (isChecked(record._id)) {
        setAssignedClasses(
          assignedClasses.filter((c) => c.classId !== record._id)
        );
        return;
      }

      const payload = {
        schoolId,
        academicYearId: selectedAcademicYear?._id,
        classId: record.classId?._id,
        boardClassId: record._id,
      };

      const res = await dispatch(createSchoolClass(payload)).unwrap();

      setAssignedClasses([
        ...assignedClasses,
        {
          classId: record._id,
          schoolClassId: res._id,
        },
      ]);

      message.success("Class assigned successfully ✅");
    } catch (err) {
      message.error(err || "Failed to assign class");
    }
  };

  /* ================= ADD SECTION ================= */
  const handleAddSection = async (classId) => {
    const input = sectionInputs[classId];
    if (!input) return message.warning("Enter section name");

    const classObj = assignedClasses.find((c) => c.classId === classId);

    if (!classObj) {
      return message.warning("Assign class first");
    }

    const names = input.split(",").map((s) => s.trim());

    try {
      for (const name of names) {
        const payload = {
          schoolId,
          schoolClassId: classObj.schoolClassId,
          name,
          capacity: 100,
          academicYearId: selectedAcademicYear?._id,
        };

        const res = await dispatch(createSection(payload)).unwrap();

        setSections((prev) => [
          ...prev,
          {
            _id: res._id,
            name: res.name,
            classId,
          },
        ]);
      }

      message.success("Sections created successfully ✅");

      setSectionInputs({
        ...sectionInputs,
        [classId]: "",
      });
    } catch (err) {
      message.error("Failed to create section",err);
    }
  };

  /* ================= DELETE SECTION ================= */
  const handleDeleteSection = (id) => {
    setSections(sections.filter((s) => s._id !== id));
  };

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "Class",
      dataIndex: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Assign",
      align: "center",
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
          return <Text type="secondary">Assign class first</Text>;
        }

        return (
          <>
            {/* Section Tags */}
            <div style={{ marginBottom: 8 }}>
              {classSections.length ? (
                classSections.map((sec) => (
                  <Popconfirm
                    key={sec._id}
                    title="Delete section?"
                    onConfirm={() => handleDeleteSection(sec._id)}
                  >
                    <Tag
                      color="blue"
                      closable
                      onClose={() => handleDeleteSection(sec._id)}
                    >
                      {sec.name}
                    </Tag>
                  </Popconfirm>
                ))
              ) : (
                <Text type="secondary">No sections</Text>
              )}
            </div>

            {/* Add Section */}
            <Space.Compact style={{ width: "100%" }}>
              <Input
                placeholder="e.g. A, B, C"
                value={sectionInputs[record._id] || ""}
                onChange={(e) =>
                  setSectionInputs({
                    ...sectionInputs,
                    [record._id]: e.target.value,
                  })
                }
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleAddSection(record._id)}
              />
            </Space.Compact>
          </>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* HEADER */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Class & Section Management
            </Title>
            <Text type="secondary">
              Assign classes and manage sections per board
            </Text>
          </Col>

          <Col>
            <Select
              placeholder="Select Board"
              style={{ width: 240 }}
              value={selectedBoard}
              onChange={setSelectedBoard}
              allowClear
              showSearch
            >
              {schoolBoards.map((item) => (
                <Option key={item._id} value={item.boardId?._id}>
                  {item.boardId?.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* TABLE */}
      <Card bordered={false}>
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={selectedBoard ? boardClass : []}
            pagination={false}
            locale={{
              emptyText: (
                <Empty description="No classes available for this board" />
              ),
            }}
          />
        </Spin>
      </Card>
    </div>
  );
};

export default SchoolClass;