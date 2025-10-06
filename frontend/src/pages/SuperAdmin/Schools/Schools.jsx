import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchools } from '../../../features/schoolSlice';
import AddSchoolForm from '../../../components/forms/AddSchoolForm';
import { Button, Modal, Spin, Row, Col, Card, Tag } from 'antd';
import schoolImg from '../../../assets/school.png';

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  return (
    <div className="">
      {/* Header */}
      <Row justify="space-between" align="middle" className="mb-4" gutter={[8, 8]}>
        <h1 className="text-2xl font-bold text-blue-800">Schools</h1>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Add School
        </Button>
      </Row>

      <hr className="mb-3" />

      {/* School List */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" />
        </div>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <Row gutter={[16, 16]}>
          {schools.map((school) => (
            <Col
              key={school._id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
            >
              <Card
                hoverable
                className="relative h-full"
                bodyStyle={{ padding: '12px' }}
              >
                <h2 className="text-sm font-semibold text-blue-800 uppercase">{school.name}</h2>
                <p className="text-xs text-gray-600 mb-1">{school.description}</p>
                <p className="text-xs mb-1">
                  <span className="font-medium">Status:</span>{' '}
                  <Tag color={school.isActive ? 'green' : 'red'}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </p>
                <p className="text-xs text-gray-500 mb-0">
                  <span className="text-black font-medium">Created:</span>{' '}
                  {new Date(school.createdAt).toLocaleDateString()}
                </p>
                <img
                  src={schoolImg}
                  alt="School"
                  className="absolute bottom-3 right-3 w-9 max-w-full"
                />
              </Card>
            </Col>

          ))}
        </Row>
      )}

      {/* Add School Modal */}
      <Modal
        title="Add School"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
      >
        <AddSchoolForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Schools;
