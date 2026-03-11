import { Modal, Form, Input, Select, Button } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllClasses } from "../../features/classSlice";
import { getBoards } from "../../features/boardSlice";
const { TextArea } = Input;

const AddBoardClassModal = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
    const boardsState = useSelector((state) => state.boards || {});
    const boards =
      boardsState?.boards?.boards ||
      boardsState?.boards ||
      [];
  
    
  const { classList = [] } = useSelector((state) => state.class);

  useEffect(() => {
    dispatch(fetchAllClasses());
    dispatch(getBoards())
  }, [dispatch]);

  const handleSubmit = (values) => {
    console.log(values);

    setOpen(false);
    form.resetFields();
  };

  return (
    <Modal
      title="Add Board Class"
      open={open}
      onCancel={() => setOpen(false)}
      footer={null}
      width={600}
    >
      <Form layout="vertical" form={form} onFinish={handleSubmit}>
        {/* Board Name */}

        <Form.Item
          label="Board Name"
          name="boardId"
          rules={[{ required: true, message: "Please select board" }]}
        >
          <Select placeholder="Select board">
              {boards.map((board)=>(
                  <Select.Option key={board._id} value={board._id}>{
                    board.name
                    }</Select.Option>
              ))}
          </Select>
        </Form.Item>

        {/* Class Name */}

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true, message: "Enter class name" }]}
        >
          <Input placeholder="Enter class name" />
        </Form.Item>

        {/* Global Class */}

        <Form.Item label="Global Class" name="schoolClassId">
          <Select placeholder="Select class">
            {classList.map((cls) => (
              <Select.Option key={cls._id} value={cls._id}>
                {cls.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* Status */}

        <Form.Item label="Status" name="status" initialValue="active">
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        {/* Description */}

        <Form.Item label="Description" name="description">
          <TextArea rows={3} placeholder="Enter description" />
        </Form.Item>

        {/* Buttons */}

        <div className="flex justify-end gap-3">
          <Button onClick={() => setOpen(false)}>Cancel</Button>

          <Button type="primary" htmlType="submit">
            Save
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddBoardClassModal;