import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../../features/schoolClassSlice";
import { fetchAllUser } from "../../../../features/authSlice";
import {
  Table,
  Tag,
  Input,
  Button,
  Space,
  Typography,
  Empty,
  Tooltip,
  Badge,
  Modal,
  Select,
  Grid,
  Spin,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import { useTheme } from "../../../../context/ThemeContext";
import { assignSubjectTeacher } from "../../../../features/sectionSlice";
const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const CLASS_COLORS = [
  { bg: "#EAF3DE", color: "#3B6D11" },
  { bg: "#FAEEDA", color: "#854F0B" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
];

const Classes = () => {
  const dispatch = useDispatch();
  const { isDark } = useTheme();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );

  const { user, users = [] } = useSelector((state) => state.auth || {});
  const schoolId = user?.school?._id;

  useEffect(() => {
    dispatch(fetchAllUser({ roleName: ["Teacher"], isActive: true }));
  }, [dispatch]);
  const [filterText, setFilterText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const resetForm = () => {
    setSelectedSection(null);
    setSelectedSubject(null);
    setSelectedTeacher(null);
  };

  useEffect(() => {
    if (schoolId) dispatch(getClassData({ schoolId }));

  }, [dispatch, schoolId]);

  const filteredItems = useMemo(() => {
    return schoolClasses.filter((item) =>
      item.name?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [schoolClasses, filterText]);


  const handleFinish = async () => {
    if (!selectedSection || !selectedSubject || !selectedTeacher) {
      // eslint-disable-next-line no-undef
      return message.error("Please select all fields");
    }

    try {
      await dispatch(
        assignSubjectTeacher({
          sectionId: selectedSection,
          subjectId: selectedSubject,
          teacherId: selectedTeacher,
        })
      ).unwrap();
      dispatch(getClassData({ schoolId }));
      // eslint-disable-next-line no-undef
      message.success("Teacher Assigned Successfully ✅");

      handleClose(); // close + reset
    } catch (err) {
      // eslint-disable-next-line no-undef
      message.error("Failed to assign teacher", err);
    }
  };

  /* ------------------ TABLE COLUMNS ------------------ */
  const columns = [
    {
      title: "Class",
      dataIndex: "name",
      render: (name, record, index) => {
        const palette = CLASS_COLORS[index % CLASS_COLORS.length];

        return (
          <Space>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: palette.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                color: palette.color,
              }}
            >
              {name?.replace(/\D/g, "") || "C"}
            </div>

            <div style={{ width:'150px' }}>
              <Text strong>{name}</Text>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>
                {record.sections?.length || 0} sections
              </div>
            </div>
          </Space>
        );
      },
    },

    {
      title: "Sections",
      render: (_, record) => (
        <Space wrap>
          {record.sections?.map((sec) => (
            <Tag key={sec._id} color="blue">
              {sec.name}
            </Tag>
          ))}
        </Space>
      ),
    },

   {
  title: "Subjects",
  render: (_, record) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {record.sections?.map((sec) => (
        <div
          key={sec._id}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            background: isDark ? "#1a1a1a" : "#f8fafc",
            border: `1px solid ${isDark ? "#2a2a2a" : "#eef2f7"}`,
          }}
        >
          {/* Section Title */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 6,
              color: isDark ? "#d1d5db" : "#374151",
            }}
          >
            {sec.name}
          </div>

          {/* Subjects List */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sec.subjects?.length ? (
              sec.subjects.map((s) => (
                <div
                  key={s._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 8px",
                    borderRadius: 20,
                    background: isDark ? "#0f172a" : "#eef4ff",
                    border: `1px solid ${isDark ? "#1e293b" : "#dbeafe"}`,
                    fontSize: 11.5,
                  }}
                >
                  {/* Subject */}
                  <span style={{ fontWeight: 500 }}>
                    {s.name}
                  </span>

                  {/* Divider */}
                  <span style={{ opacity: 0.4 }}>•</span>

                  {/* Teacher */}
                  <span style={{ color: "#1677ff", fontWeight: 500 }}>
                    {s.teacherName || "Not Assigned"}
                  </span>
                </div>
              ))
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>
                No subjects
              </Text>
            )}
          </div>
        </div>
      ))}
    </div>
  ),
},

    {
      title: "Action",
      align: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          onClick={() => {
            setSelectedClass(record);
            setSelectedSection(null);
            setSelectedSubject(null);
            setSelectedTeacher(null);
            setOpenModal(true);
          }}
        >
          Assign Teacher
        </Button>
      ),
    },
  ];

  /* ------------------ MOBILE VIEW ------------------ */
  const MobileView = () => {
    if (loading) return <Spin />;

    if (!filteredItems.length) return <Empty />;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredItems.map((item) => (
          <div
            key={item._id}
            style={{
              border: "1px solid #eee",
              borderRadius: 12,
              padding: 12,
              background: isDark ? "#141414" : "#fff",
            
            }}
          >
            <b>{item.name}</b>

            <div style={{ marginTop: 6 }}>
              {item.sections?.map((s) => (
                <Tag key={s._id}>{s.name}</Tag>
              ))}
            </div>

            <Button
              type="primary"
              block
              size="small"
              style={{ marginTop: 10 }}
              onClick={() => {
                setSelectedClass(item);
                setOpenModal(true);
              }}
            >
              Assign Teacher
            </Button>
          </div>
        ))}
      </div>
    );
  };
  const handleClose = () => {
    setOpenModal(false);
    resetForm();
    setSelectedClass(null);
    setSelectedSection(null);
    setSelectedSubject(null);
    setSelectedTeacher(null);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Text strong style={{ fontSize: 20 }}>
            Classes
          </Text>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Manage classes & teachers
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search class..."
        onChange={(e) => setFilterText(e.target.value)}
        style={{ maxWidth: 250 }}
      />

      {/* TABLE / MOBILE */}
      {isMobile ? (
        <MobileView />
      ) : (
        <Table
          columns={columns}
          dataSource={filteredItems}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 800 }}
        />
      )}

      {/* MODAL */}
      <Modal
        title="Assign Teacher"
        open={openModal}
        onCancel={handleClose}
        onOk={handleFinish}   // ✅ IMPORTANT FIX
        destroyOnClose
      >
        <div style={{ marginBottom: 10 }}>
          <Text strong>Class</Text>
          <div>{selectedClass?.name}</div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <Text strong>Section</Text>
          <Select
            style={{ width: "100%" }}
            value={selectedSection}
            onChange={(val) => {
              setSelectedSection(val);
              setSelectedSubject(null); // reset subject when section changes
            }}
          >
            {selectedClass?.sections?.map((s) => (
              <Option key={s._id} value={s._id}>
                {s.name}
              </Option>
            ))}
          </Select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <Text strong>Subject</Text>
          <Select
            style={{ width: "100%" }}
            value={selectedSubject}
            onChange={setSelectedSubject}
          >
            {selectedClass?.sections
              ?.find((s) => s._id === selectedSection)
              ?.subjects?.map((sub) => (
                <Option key={sub._id} value={sub._id}>
                  {sub.name}
                </Option>
              ))}
          </Select>
        </div>

        <div>
          <Text strong>Teacher</Text>
          <Select
            style={{ width: "100%" }}
            value={selectedTeacher}
            onChange={setSelectedTeacher}
          >
            {users.map((t) => (   // ✅ FIXED HERE
              <Option key={t._id} value={t._id}>
                {t.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
};

export default Classes;