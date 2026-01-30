import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSchools, deleteSchool } from "../../../features/schoolSlice";
import AddSchoolForm from "../../../components/forms/AddSchoolForm";
import {
  Button,
  Modal,
  Spin,
  Row,
  Col,
  Card,
  Tag,
  Empty,
  Popconfirm,
  message,
  Typography,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  BankOutlined,
} from "@ant-design/icons";
import schoolImg from "../../../assets/school.png";

const { Title, Text } = Typography;

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  const handleDeleteSchool = async (id) => {
    try {
      await dispatch(deleteSchool(id)).unwrap();
      message.success("School deleted successfully");
      dispatch(fetchSchools());
    } catch (err) {
      message.error(err,"Failed to delete school");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* 🔹 Header */}
      <Space
        className="w-full mb-4"
        align="center"
        style={{ justifyContent: "space-between" }}
      >
        <div>
          <Title level={3} className="!mb-0 text-blue-800">
            Schools Management
          </Title>
          <Text type="secondary">
            Manage all registered schools
          </Text>
        </div>

        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
        >
          Add School
        </Button>
      </Space>

      {/* 🔹 Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Text type="danger" className="block text-center">
          {error}
        </Text>
      ) : schools?.length === 0 ? (
        <Empty description="No schools found" />
      ) : (
        <Row gutter={[16, 16]}>
          {schools.map((school) => (
            <Col key={school._id} xs={24} sm={12} lg={6}>
              <Card
                hoverable
                className="h-full rounded-xl border border-gray-200"
                bodyStyle={{
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {/* 🔹 Card Header */}
                <Space className="w-full justify-between">
                  <Space>
                    <BankOutlined className="text-blue-600 text-lg" />
                    <Text strong className="uppercase text-blue-800">
                      {school.name}
                    </Text>
                  </Space>

                  <Popconfirm
                    title="Delete this school?"
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDeleteSchool(school._id)}
                  >
                    <DeleteOutlined className="text-gray-400 hover:text-red-500 cursor-pointer" />
                  </Popconfirm>
                </Space>

                {/* 🔹 Description */}
                <Text type="secondary" className="mt-2 line-clamp-2">
                  {school.description || "No description available"}
                </Text>

                {/* 🔹 Footer */}
                <div className="mt-auto pt-3">
                  <Space size="small">
                    <Text>Status:</Text>
                    <Tag color={school.isActive ? "green" : "red"}>
                      {school.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </Space>

                  <Text type="secondary" className="block text-xs mt-1">
                    Created on {new Date(school.createdAt).toLocaleDateString()}
                  </Text>
                </div>

                {/* 🔹 Decorative Icon */}
                <img
                  src={schoolImg}
                  alt="school"
                  className="absolute bottom-3 right-3 w-10 opacity-70"
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* 🔹 Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width={600}
        title={<Title level={4}>Add New School</Title>}
      >
        <AddSchoolForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Schools;
