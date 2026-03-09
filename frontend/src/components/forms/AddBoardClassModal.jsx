import { Modal, Form, Input, Select, Button } from "antd";

const { TextArea } = Input;

 const  AddBoardClassModal = ({ open, setOpen }) => {

  const [form] = Form.useForm();

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

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
      >

        {/* Board ID */}

        <Form.Item
          label="Board Name"
           name="boardId"
          rules={[{ required: true }]}
        >
          <Select>
            <Option></Option>
          </Select>
        </Form.Item>

        {/* Class Name */}

        <Form.Item
          label="Name"
          name="name"
          rules={[{ required: true }]}
        >
          <Input placeholder="Enter class name" />
        </Form.Item>

       

       

        {/* School Class */}

        <Form.Item
          label="School Class"
          name="schoolClassId"
        >
          <Select placeholder="Select class">
            <Select.Option value="1">Class 1</Select.Option>
            <Select.Option value="2">Class 2</Select.Option>
          </Select>
        </Form.Item>

        {/* Status */}

        <Form.Item
          label="Status"
          name="status"
          initialValue="active"
        >
          <Select>
            <Select.Option value="active">
              Active
            </Select.Option>
            <Select.Option value="inactive">
              Inactive
            </Select.Option>
          </Select>
        </Form.Item>

        {/* Description */}

        <Form.Item
          label="Description"
          name="description"
        >
          <TextArea rows={3} />
        </Form.Item>

        {/* Buttons */}

        <div className="flex justify-end gap-3">

          <Button onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            type="primary"
            htmlType="submit"
          >
            Save
          </Button>

        </div>

      </Form>

    </Modal>
  );
}

export default AddBoardClassModal