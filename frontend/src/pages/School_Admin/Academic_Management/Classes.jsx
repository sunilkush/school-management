import React, { useEffect, useState, lazy, Suspense } from "react";
import { useSelector, useDispatch } from "react-redux";
import { getClassData } from "../../../features/schoolClassSlice";

import {
  Table,
  Tag,
  Input,
  Button,
  Space,
  Card,
  Typography,
  Row,
  Col,
  Grid,
  Empty,
  Spin,
} from "antd";

import {
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";

const { Search } = Input;
const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// 🔥 FIX: Lazy import add karo
const MobileCards = lazy(() => import("./MobileCards"));

const Classes = () => {
  const dispatch = useDispatch();
  const screens = useBreakpoint();

  const { schoolClasses = [], loading } = useSelector(
    (state) => state.schoolClass || {}
  );
  const { user } = useSelector((state) => state.auth || {});

  const [filterText, setFilterText] = useState("");

  const schoolId = user?.school?._id;

  useEffect(() => {
    if (schoolId) dispatch(getClassData({ schoolId }));
  }, [dispatch, schoolId]);

  /* ================= FILTER ================= */
  const filteredItems = schoolClasses.filter((item) =>
    (item?.name ?? "").toLowerCase().includes(filterText.toLowerCase())
  );

  /* ================= TABLE ================= */
  const columns = [
    {
      title: "S.No",
      render: (_, __, index) => index + 1,
      width: 70,
    },
    {
      title: "Class",
      dataIndex: "name",
      render: (name) => (
        <Space>
          <ApartmentOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Sections",
      dataIndex: "sections",
      render: (sections = []) => (
        <Space wrap>
          {sections.map((sec) => (
            <Tag key={sec._id} color="blue">
              {sec.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Subjects (Section Wise)",
      dataIndex: "sections",
      render: (sections = []) => (
        <div>
          {sections.map((sec) => (
            <div key={sec._id}>
              <b>{sec.name}:</b>{" "}
              {sec.subjects?.length
                ? sec.subjects.map((s) => s.name).join(", ")
                : "—"}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Actions",
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />} />
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  /* ================= UI ================= */
  return (
    <Card>
      <Row gutter={[16, 16]} justify="space-between">
        <Col xs={24} md={12}>
          <Title level={4}>Class Management</Title>
        </Col>

        <Col xs={24} md={8}>
          <Search
            placeholder="Search class"
            allowClear
            onChange={(e) => setFilterText(e.target.value)}
          />
        </Col>
      </Row>

      <div style={{ marginTop: 16 }}>
        {screens.md ? (
          <Table
            columns={columns}
            dataSource={filteredItems}
            rowKey="_id"
            loading={loading}
            bordered
            scroll={{ x: 900 }}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty /> }}
          />
        ) : (
          // 🔥 FIX: Mobile view add karo
          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            }
          >
            <MobileCards data={filteredItems} />
          </Suspense>
        )}
      </div>
    </Card>
  );
};

export default Classes;