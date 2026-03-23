import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Select,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Spin,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import AddBoardClassModal from "../../../components/forms/AddBoardClassModal.jsx";
import { getBoardClass } from "../../../features/boardClassSlice.js";
import { getBoards } from "../../../features/boardSlice.js";
import { useDispatch, useSelector } from "react-redux";

const { Title } = Typography;
const { Option } = Select;

export default function BoardClassPage() {
  const dispatch = useDispatch();

  const { boardClass = [], loading } = useSelector(
    (state) => state.boardClass
  );
  const boards = useSelector((state) => state.boards.boards || []);

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [open, setOpen] = useState(false);

  // ✅ Initial Load
  useEffect(() => {
    dispatch(getBoards());
    dispatch(getBoardClass());
  }, [dispatch]);

  // ✅ Filter change
  useEffect(() => {
    if (selectedBoard) {
      dispatch(getBoardClass(selectedBoard));
    } else {
      dispatch(getBoardClass());
    }
  }, [selectedBoard, dispatch]);

  // ✅ Columns
  const columns = [
    {
      title: "Board",
      dataIndex: "boardName",
    },
    {
      title: "Class",
      dataIndex: "name",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status) =>
        status === "active" ? (
          <Tag color="green">Active</Tag>
        ) : (
          <Tag color="red">Inactive</Tag>
        ),
    },
  ];

  return (
    <>
    <div style={{ padding: 20 }}>
      {/* Page Title */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4}>Board Classes</Title>
        </Col>

        <Col>
          <Space>
            <Select
              placeholder="Select Board"
              style={{ width: 220 }}
              allowClear
              value={selectedBoard}
              onChange={(value) => setSelectedBoard(value)}
            >
              {boards.map((board) => (
                <Option key={board._id} value={board._id}>
                  {board.name}
                </Option>
              ))}
            </Select>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpen(true)}
            >
              Add Board Class
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Table Card */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={boardClass}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
          />
        </Spin>
      </Card>

      {/* Modal */}
      <AddBoardClassModal open={open} setOpen={setOpen} />
    </div></>
  );
}