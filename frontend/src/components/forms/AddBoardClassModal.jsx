import { Modal, Form, Select, Button, message,Input } from "antd";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getBoards } from "../../features/boardSlice";
import { fetchAllClasses as getClasses } from "../../features/classSlice"; // ✅ ADD THIS
import { createBoardClass } from "../../features/boardClassSlice.js";

const { TextArea } = Input;

const AddBoardClassModal = ({ open, setOpen }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const boards = useSelector((state) => state.boards.boards || []);
  const classes = useSelector((state) => state.class.classList || []); // ✅ classes

  /* ================= LOAD ================= */
  useEffect(() => {
    dispatch(getBoards());
    dispatch(getClasses()); // ✅ load classes
  }, [dispatch]);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values) => {
    try {
      await dispatch(createBoardClass(values)).unwrap();

      message.success("Board class created ✅");

      form.resetFields();
      setOpen(false);
    } catch (err) {
      message.error(err || "Failed to create");
    }
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
        
        {/* ✅ BOARD */}
        <Form.Item
          label="Board"
          name="boardId"
          rules={[{ required: true, message: "Select board" }]}
        >
          <Select placeholder="Select board">
            {boards.map((b) => (
              <Select.Option key={b._id} value={b._id}>
                {b.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* ✅ CLASS (IMPORTANT CHANGE) */}
        <Form.Item
          label="Class"
          name="classId"
          rules={[{ required: true, message: "Select class" }]}
        >
          <Select placeholder="Select class">
            {classes.map((c) => (
              <Select.Option key={c._id} value={c._id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {/* STATUS */}
        <Form.Item name="status" label="Status" initialValue="active">
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
        </Form.Item>

        {/* DESCRIPTION */}
        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Enter description" />
        </Form.Item>

        {/* ACTIONS */}
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