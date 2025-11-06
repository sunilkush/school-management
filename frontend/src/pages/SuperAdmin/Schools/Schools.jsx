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
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { Trash2 } from "lucide-react";
import schoolImg from "../../../assets/school.png";

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch schools on mount
  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  // ✅ Delete handler (fixed with unwrap)
  const handleDeleteSchool = async (schoolId) => {
    try {
      await dispatch(deleteSchool(schoolId)).unwrap();
      message.success("School deleted successfully!");
      dispatch(fetchSchools());
    } catch (error) {
      message.error(error || "Failed to delete school");
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-8 bg-gray-50 min-h-screen">
      {/* ✅ Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-800">
          Schools
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto h-10 text-sm sm:text-base"
        >
          Add School
        </Button>
      </div>

      <hr className="mb-4 border-gray-300" />

      {/* ✅ Content Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 font-medium">{error}</p>
      ) : schools?.length === 0 ? (
        <Empty description="No schools found" className="my-10" />
      ) : (
        <Row gutter={[16, 16]} justify="start">
          {schools.map((school) => (
            <Col
              key={school._id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
              className="flex"
            >
              <Card
                hoverable
                className="w-full rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg relative"
                bodyStyle={{
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div className="flex-1 flex flex-col justify-between">
                  {/* ✅ Header with name and delete */}
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-base sm:text-lg font-semibold text-blue-800 uppercase mb-1 truncate w-3/4">
                      {school.name}
                    </h2>
                    <Popconfirm
                      title="Are you sure you want to delete this school?"
                      onConfirm={() => handleDeleteSchool(school._id)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                    >
                      <Trash2 className="text-gray-500 hover:text-red-500 cursor-pointer w-4 h-4 sm:w-5 sm:h-5" />
                    </Popconfirm>
                  </div>

                  {/* ✅ Description */}
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2">
                    {school.description || "No description"}
                  </p>

                  {/* ✅ Status and Date */}
                  <div className="text-xs sm:text-sm mb-1">
                    <span className="font-medium">Status:</span>{" "}
                    <Tag color={school.isActive ? "green" : "red"}>
                      {school.isActive ? "Active" : "Inactive"}
                    </Tag>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="text-black font-medium">Created:</span>{" "}
                    {new Date(school.createdAt).toLocaleDateString()}
                  </p>

                  {/* ✅ Decorative Image */}
                  <img
                    src={schoolImg}
                    alt="School"
                    className="absolute bottom-3 right-3 w-8 sm:w-10 opacity-80"
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ✅ Add School Modal */}
      <Modal
        title={
          <span className="text-lg sm:text-xl font-semibold text-blue-700">
            Add School
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width="95%"
        style={{ maxWidth: 600 }}
        bodyStyle={{ padding: "16px" }}
      >
        <AddSchoolForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Schools;
