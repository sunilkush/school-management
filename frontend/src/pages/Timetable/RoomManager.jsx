import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Typography, App } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createRoom, deleteRoom, fetchRooms, updateRoom } from "../../features/timetableSlice";
import { schoolIdFromUser } from "./timetableUi";

export default function RoomManager() {
    const dispatch = useDispatch();
    const { message } = App.useApp();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const { user } = useSelector(s => s.auth);
    const { rooms, loading } = useSelector(s => s.timetable);
    const schoolId = schoolIdFromUser(user);
    useEffect(() => {
        if (schoolId)
            dispatch(fetchRooms({ schoolId }));
    }, [dispatch, schoolId]);

    const save = async () => {
        try {
            const values = await form.validateFields();
            const payload = { ...values, schoolId };
            if (editing) {
                await dispatch(updateRoom({ id: editing._id, payload })).unwrap();
            } else {
                await dispatch(createRoom(payload)).unwrap();
                message.success("Room saved");
                setOpen(false);
            }
        } catch (e) {
            if (typeof e === "string") message.error(e);
        }
    };
    return <Space direction="vertical" className="w-full" size="large">
        <Card>
            <Typography.Title level={3}>Room Manager</Typography.Title>
            <Typography.Text type="secondary">Create rooms and labs used for timetable room clash detection.</Typography.Text>
            <br />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>Add Room</Button>
        </Card>
        <Card>
            <Table
                loading={loading}
                rowKey="_id"
                dataSource={rooms}
                columns={
                    [
                        { title: "Name", dataIndex: "name" },
                        { title: "Code", dataIndex: "code" },
                        { title: "Capacity", dataIndex: "capacity" },
                        { title: "Type", dataIndex: "type" },
                        {
                            title: "Actions",
                            render: (_, r) =>
                                <Space>
                                    <Button
                                        onClick={() => {
                                            setEditing(r);
                                            form.setFieldsValue(r);
                                            setOpen(true);
                                        }}>Edit</Button>
                                    <Button danger
                                        onClick={() => dispatch(deleteRoom(r._id))
                                            .unwrap()
                                            .catch(message.error)}>Delete</Button>
                                </Space>
                        }]} />
        </Card>
        <Modal
            open={open}
            title={editing ? "Edit Room" : "Add Room"}
            onCancel={() => setOpen(false)}
            onOk={save}
        >
            <Form
                form={form}
                layout="vertical">
                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="code" label="Code">
                    <Input />
                </Form.Item>
                <Form.Item name="capacity" label="Capacity" initialValue={0}>
                    <InputNumber className="w-full" min={0} />
                </Form.Item>
                <Form.Item name="type" label="Type" initialValue="classroom">
                    <Select options={["classroom", "lab", "library", "auditorium", "sports", "other"]
                        .map(t => ({ value: t, label: t }))} />
                </Form.Item>
            </Form>
        </Modal>
    </Space>;
}
