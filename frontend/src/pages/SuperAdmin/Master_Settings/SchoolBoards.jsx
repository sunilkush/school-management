import React, { useEffect, useState } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Checkbox,
  message,
  Tag,
  Select,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  createBoard,
  getBoards,
  updateBoard,
  deleteBoard,
} from "../../../features/boardSlice.js";
import { fetchSchools } from "../../../features/schoolSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";

const SchoolBoards = () => {
  const dispatch = useDispatch();
  const { boards = { boards: [], pagination: {} }, loading } = useSelector(
    (state) => state.boards || {}
  );
  const { schools = [] } = useSelector((state) => state.school || {});
  const { activeYear } = useSelector((state) => state.academicYear || {});

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);

  const [form] = Form.useForm();

  const user = localStorage.getItem("user");
  const createdByRole = user ? JSON.parse(user).role.name : null;

  // ==============================
  // All India Boards List
  // ==============================
  const centralBoards = [
    "CBSE - Central Board of Secondary Education",
    "CISCE - Council for the Indian School Certificate Examinations (ICSE/ISC)",
    "NIOS - National Institute of Open Schooling",
  ];

  const internationalBoards = [
    "IB - International Baccalaureate",
    "Cambridge International (CAIE - IGCSE / A Levels)",
    "Pearson Edexcel (UK Board)",
  ];

  const stateBoards = [
    "UPMSP - Uttar Pradesh Madhyamik Shiksha Parishad (UP Board)",
    "BSEB - Bihar School Examination Board",
    "HBSE - Haryana Board of School Education",
    "PSEB - Punjab School Education Board",
    "JKBOSE - Jammu & Kashmir Board of School Education",
    "HPBOSE - Himachal Pradesh Board of School Education",
    "UBSE - Uttarakhand Board of School Education",
    "RBSE - Rajasthan Board of Secondary Education",
    "GSEB - Gujarat Secondary and Higher Secondary Education Board",
    "MSBSHSE - Maharashtra State Board",
    "GBSHSE - Goa Board of Secondary and Higher Secondary Education",
    "MPBSE - Madhya Pradesh Board of Secondary Education",
    "CGBSE - Chhattisgarh Board of Secondary Education",
    "WBBSE - West Bengal Board of Secondary Education",
    "WBCHSE - West Bengal Council of Higher Secondary Education",
    "BSE Odisha - Board of Secondary Education Odisha",
    "CHSE Odisha - Council of Higher Secondary Education Odisha",
    "JAC - Jharkhand Academic Council",
    "BSEAP - Andhra Pradesh Board of Secondary Education",
    "APOSS - Andhra Pradesh Open School Society",
    "BSE Telangana - Telangana State Board of Secondary Education",
    "TOSS - Telangana Open School Society",
    "KSEAB - Karnataka School Examination and Assessment Board",
    "KBPE - Kerala Board of Public Examinations",
    "DHSE Kerala - Directorate of Higher Secondary Education Kerala",
    "TNBSE - Tamil Nadu State Board",
    "DGE Tamil Nadu - Directorate of Government Examinations",
    "PUE Karnataka - Pre University Board Karnataka",
    "SEBA - Board of Secondary Education Assam",
    "AHSEC - Assam Higher Secondary Education Council",
    "MBSE - Mizoram Board of School Education",
    "NBSE - Nagaland Board of School Education",
    "TBSE - Tripura Board of Secondary Education",
    "MBOSE - Meghalaya Board of School Education",
    "BOSEM - Board of Secondary Education Manipur",
    "COHSEM - Council of Higher Secondary Education Manipur",
    "Sikkim Board of Secondary Education",
    "Arunachal Pradesh Board of Secondary Education",
  ];

  const allIndiaBoards = [...centralBoards, ...internationalBoards, ...stateBoards];

  // ==============================
  // Load Data
  // ==============================
  useEffect(() => {
    dispatch(getBoards({ page: 1, limit: 10 }));
    dispatch(fetchSchools());
  }, [dispatch]);

  // ==============================
  // Handle Add/Edit/Delete
  // ==============================
  const handleAddBoard = () => {
    form.resetFields();
    setEditingBoard(null);
    setModalVisible(true);
  };

  const handleEditBoard = (board) => {
    setEditingBoard(board);

    form.setFieldsValue({
      ...board,
      schoolId: board?.schoolId?._id || board?.schoolId,
      academicYearId: board?.academicYearId?._id || board?.academicYearId,
      createdByRole: board?.createdByRole || createdByRole,
    });

    setModalVisible(true);
  };

  const handleDeleteBoard = async (id) => {
    try {
      await dispatch(deleteBoard(id)).unwrap();
      message.success("Deleted Successfully");
      dispatch(getBoards({ page: boards.pagination.page, limit: boards.pagination.limit }));
    } catch (err) {
      message.error(err?.message || "Delete failed");
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBoard) {
        await dispatch(
          updateBoard({ id: editingBoard._id, boardData: values })
        ).unwrap();
        message.success("Updated Successfully");
      } else {
        await dispatch(createBoard(values)).unwrap();
        message.success("Created Successfully");
      }

      setModalVisible(false);
      dispatch(getBoards({ page: boards.pagination.page, limit: boards.pagination.limit }));
    } catch (err) {
      message.error(err?.message || "Operation failed");
    }
  };

  // ==============================
  // Handle School Change -> Fetch Active Academic Year
  // ==============================
  const handleSchoolChange = async (schoolId) => {
    try {
      const res = await dispatch(fetchActiveAcademicYear(schoolId)).unwrap();
      form.setFieldsValue({ academicYearId: res._id });
    } catch (err) {
      message.error("Active Academic Year not found: " + err?.message || "");
    }
  };

  // ==============================
  // Table Columns
  // ==============================
  const columns = [
    { title: "Board Name", dataIndex: "name" },
    { title: "Code", dataIndex: "code" },
    { title: "Description", dataIndex: "description" },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (val) => (val ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>),
    },
    {
      title: "School",
      render: (_, record) => record?.schoolId?.name || "-",
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="primary"
            size="small"
            onClick={() => handleEditBoard(record)}
          >
            Edit
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteBoard(record._id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card
        title="School Boards"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddBoard}>
            Add Board
          </Button>
        }
      >
        <Table
          rowKey="_id"
          dataSource={Array.isArray(boards.boards) ? boards.boards : []}
          columns={columns}
          loading={loading}
          pagination={{
            current: boards.pagination?.page || 1,
            pageSize: boards.pagination?.limit || 10,
            total: boards.pagination?.total || 0,
            onChange: (page, pageSize) => {
              dispatch(getBoards({ page, limit: pageSize }));
            },
          }}
        />
      </Card>

      <Modal
        title={editingBoard ? "Edit Board" : "Add Board"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="School" name="schoolId" rules={[{ required: true }]}>
            <Select
              onChange={handleSchoolChange}
              options={schools.map((s) => ({ label: s.name, value: s._id }))}
              placeholder="Select School"
            />
          </Form.Item>

          <Form.Item name="academicYearId" hidden>
            <Input value={activeYear?._id || ""} />
          </Form.Item>

          <Form.Item name="createdByRole" hidden>
            <Input value={createdByRole || ""} readOnly />
          </Form.Item>

          <Form.Item label="Board Name" name="name" rules={[{ required: true }]}>
            <Select
              showSearch
              options={allIndiaBoards
                .map((name) => ({ label: name, value: name }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              placeholder="Select Board Name"
            />
          </Form.Item>

          <Form.Item label="Code" name="code">
            <Input />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Active</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SchoolBoards;
