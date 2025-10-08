import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchools } from '../../../features/schoolSlice';
import AddSchoolForm from '../../../components/forms/AddSchoolForm';
import { Button, Modal, Spin, Row, Col, Card, Tag, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import schoolImg from '../../../assets/school.png';

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-800">Schools</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto"
        >
          Add School
        </Button>
      </div>

      <hr className="mb-4 border-gray-300" />

      {/* School Cards Section */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      ) : error ? (
        <p className="text-center text-red-500 font-medium">{error}</p>
      ) : schools.length === 0 ? (
        <Empty
          description="No schools found"
          className="my-10"
        />
      ) : (
        <Row gutter={[16, 16]} justify="start">
          {schools.map((school) => (
            <Col
              key={school._id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={4}
              className="flex"
            >
              <Card
                hoverable
                className="w-full rounded-xl shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg relative"
                bodyStyle={{ padding: '16px' }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-blue-800 uppercase mb-1 truncate">
                      {school.name}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {school.description || 'No description'}
                    </p>
                    <div className="text-xs mb-1">
                      <span className="font-medium">Status:</span>{' '}
                      <Tag color={school.isActive ? 'green' : 'red'}>
                        {school.isActive ? 'Active' : 'Inactive'}
                      </Tag>
                    </div>
                    <p className="text-xs text-gray-500 mb-0">
                      <span className="text-black font-medium">Created:</span>{' '}
                      {new Date(school.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <img
                    src={schoolImg}
                    alt="School"
                    className="absolute bottom-3 right-3 w-10 opacity-80"
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Add School Modal */}
      <Modal
        title={<span className="text-xl font-semibold text-blue-700">Add School</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
        width="90%"
        style={{ maxWidth: 600 }}
      >
        <AddSchoolForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Schools;
