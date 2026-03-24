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
import {
  createSchoolClass,
  fetchSchoolClasses,
} from "../../../features/schoolClassSlice";
import { createSection } from "../../../features/sectionSlice";

const { Title, Text } = Typography;
const { Option } = Select;

const SchoolClass = () => {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector(
    (state) => state.boardClass
  );

  const { schoolBoards = [] } = useSelector((state) => state.boards);

  const { schoolClasses = [] } = useSelector(
    (state) => state.schoolClass || {}
  );
  console.log(schoolClasses)
  const { selectedAcademicYear } = useSelector(
    (state) => state.academicYear
  );

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [sectionInputs, setSectionInputs] = useState({});

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const schoolId = user?.school?._id;
  const academicYearId = JSON.parse(localStorage.getItem("selectedAcademicYear"))._id
  /* ================= LOAD ================= */
  useEffect(() => {
    if (schoolId) {
      dispatch(getSchoolBoards(schoolId));
      dispatch(fetchSchoolClasses({ schoolId }));
    }
  }, [dispatch, schoolId]);

useEffect(() => {
  if (selectedBoard) {
    dispatch(getBoardClass({boardId:selectedBoard}));
  }
}, [selectedBoard, dispatch]);

  /* ================= DEFAULT BOARD ================= */
useEffect(() => {
  if (schoolBoards.length && !selectedBoard) {
    const defaultBoard = schoolBoards[0]?.boardId?._id;
    setSelectedBoard(defaultBoard);
  }
}, [schoolBoards,selectedBoard]);

  /* ================= HELPERS ================= */

  // ✅ Check assigned
  const isAssigned = (boardClassId) =>
    schoolClasses.some((cls) => cls.boardClassId?._id === boardClassId);

  // ✅ Get class object
  const getClass = (boardClassId) =>
    schoolClasses.find((c) => c.boardClassId?._id === boardClassId);

  // ✅ Get sections
  const getSections = (boardClassId) =>
    getClass(boardClassId)?.sections || [];

  /* ================= ASSIGN CLASS ================= */
  const handleToggle = async (record) => {
    try {
      if (isAssigned(record._id)) {
        message.warning("Already assigned ⚠️");
        return;
      }

      const payload = {
        schoolId,
        academicYearId: selectedAcademicYear?._id,
        classId: record.classId?._id,
        name: record.classId?.name,
        boardClassId: record._id,
      };

      await dispatch(createSchoolClass(payload)).unwrap();

      message.success("Class assigned successfully ✅");

      // 🔥 Refresh data
      dispatch(fetchSchoolClasses({ schoolId,academicYearId }));
    } catch (err) {
      message.error(err || "Failed to assign class");
    }
  };

  /* ================= ADD SECTION ================= */
  const handleAddSection = async (boardClassId) => {
    const input = sectionInputs[boardClassId];
    if (!input) return message.warning("Enter section name");

    const cls = getClass(boardClassId);

    if (!cls) return message.warning("Assign class first");

    const names = input.split(",").map((s) => s.trim());

    try {
      for (const name of names) {
        const payload = {
          schoolId,
          schoolClassId: cls._id,
          name,
          capacity: 100,
          academicYearId: selectedAcademicYear?._id,
        };

        await dispatch(createSection(payload)).unwrap();
      }

      message.success("Sections created successfully ✅");

      setSectionInputs({
        ...sectionInputs,
        [boardClassId]: "",
      });

      // 🔥 Refresh
      dispatch(fetchSchoolClasses({ schoolId, }));
    } catch (err) {
      message.error("Failed to create section",err);
    }
  };

  /* ================= TABLE ================= */
 const columns = [
  {
    title: "Class",
    render: (_, record) => (
      <Text strong>{record.classId?.name}</Text>
    ),
  },
  {
    title: "Assign",
    align: "center",
    render: (_, record) => (
      <Switch
        checked={isAssigned(record._id)}
        onChange={() => handleToggle(record)}
      />
    ),
  },
  {
    title: "Sections",
    render: (_, record) => {
      const assigned = isAssigned(record._id);
      const classSections = getSections(record._id);

      if (!assigned) {
        return <Text type="secondary">Assign class first</Text>;
      }

      return (
        <>
          <Text type="success">Already Assigned ✅</Text>

          <div style={{ marginTop: 8 }}>
            {classSections?.length ? (
              classSections.map((sec) => (
                <Tag key={sec._id} color="blue">
                  {sec.sectionId?.name}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No sections</Text>
            )}
          </div>

          <Space.Compact style={{ width: "100%", marginTop: 8 }}>
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
      <Card style={{ marginBottom: 16 }}>
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
              style={{ width: 240 }}
              value={selectedBoard}
              disabled
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
            dataSource={boardClass}
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