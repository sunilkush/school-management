import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  App,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import {
  createTimeSlot,
  deleteTimeSlot,
  fetchTimeSlots,
  updateTimeSlot,
} from "../../features/timetableSlice";
import { schoolIdFromUser } from "./timetableUi";

export default function TimeSlotManager() {
  const dispatch = useDispatch();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const { user } = useSelector((s) => s.auth);
  const selectedAcademicYear = useSelector(
    (s) => s.academicYear.selectedAcademicYear || s.academicYear.activeYear,
  );
  const { timeSlots, loading } = useSelector((s) => s.timetable);
  const schoolId = schoolIdFromUser(user);
  const academicYearId = selectedAcademicYear?._id;
  useEffect(() => {
    if (schoolId && academicYearId) {
      dispatch(fetchTimeSlots({ schoolId, academicYearId }));
    }
  }, [dispatch, schoolId, academicYearId]);
  const save = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, schoolId, academicYearId };
      if (editing) {
        await dispatch(updateTimeSlot({ id: editing._id, payload })).unwrap();
      } else {
        await dispatch(createTimeSlot(payload)).unwrap();
        message.success("Time slot saved");
        setOpen(false);
      }
    } catch (e) {
      if (typeof e === "string") message.error(e);
    }
  };
  return (
    <Space direction="vertical" className="w-full px-6 py-6" size="large">
      <Card className="shadow-sm">
        <Space className="w-full" direction="vertical">
          <Typography.Title level={3}>Time Slot Manager</Typography.Title>
          <Typography.Text type="secondary">
            Manage period, break, lunch, assembly, and activity slots for the
            active academic year.
          </Typography.Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!academicYearId}
            onClick={() => {
              setEditing(null);
              form.resetFields();
              setOpen(true);
            }}
          >
            Add Time Slot
          </Button>
        </Space>
      </Card>
      <Card>
        <Table
          loading={loading}
          rowKey="_id"
          dataSource={timeSlots}
          columns={[
            { title: "Order", dataIndex: "order" },
            { title: "Name", dataIndex: "name" },
            { title: "Start", dataIndex: "startTime" },
            { title: "End", dataIndex: "endTime" },
            { title: "Type", dataIndex: "type" },
            {
              title: "Actions",
              render: (_, r) => (
                <Space>
                  <Button
                    onClick={() => {
                      setEditing(r);
                      form.setFieldsValue(r);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    danger
                    onClick={() =>
                      dispatch(deleteTimeSlot(r._id))
                        .unwrap()
                        .catch(message.error)
                    }
                  >
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        open={open}
        title={editing ? "Edit Time Slot" : "Add Time Slot"}
        onCancel={() => setOpen(false)}
        onOk={save}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="order" label="Order" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={1} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true }]}
          >
            <Input type="time" />
          </Form.Item>
          <Form.Item
            name="endTime"
            label="End Time"
            rules={[{ required: true }]}
          >
            <Input type="time" />
          </Form.Item>
          <Form.Item name="type" label="Type" initialValue="period">
            <Select
              options={["period", "break", "lunch", "assembly", "activity"].map(
                (t) => ({ value: t, label: t }),
              )}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
