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
 
  const { boards = [] } = useSelector((state) => state.boards);

  const [selectedBoard, setSelectedBoard] = useState(null);
  const [open, setOpen] = useState(false);

  /* ================= LOAD BOARDS ================= */
  useEffect(() => {
    dispatch(getBoards());
  }, [dispatch]);

  /* ================= LOAD BOARD CLASSES ================= */
  useEffect(() => {
    dispatch(
      getBoardClass(
        selectedBoard ? { boardId: selectedBoard } : {}
      )
    );
  }, [selectedBoard, dispatch]);

  /* ================= TABLE COLUMNS ================= */
  const columns = [
    {
      title: "Board Name",
     render: (_, record) => record.boardId?.name
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
    <div style={{ padding: 20 }}>
      {/* HEADER */}
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
              onChange={(value) => setSelectedBoard(value || null)} // ✅ fix clear issue
              showSearch
              optionFilterProp="children"
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

      {/* TABLE */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Spin spinning={loading}>
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={boardClass}
            pagination={{
              pageSize: 12,
              showSizeChanger: true,
            }}
          />
        </Spin>
      </Card>

      {/* MODAL */}
      <AddBoardClassModal
        open={open}
        setOpen={setOpen}
        onSuccess={() => {
          setOpen(false);
          dispatch(
            getBoardClass(
              selectedBoard ? { boardId: selectedBoard } : {}
            )
          ); // ✅ refresh after create
        }}
      />
    </div>
  );
}