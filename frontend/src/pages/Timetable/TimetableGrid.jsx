import React from "react";
import { Avatar, Button, Card, Empty, Space, Table, Tag, Typography } from "antd";
import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { buildGrid, dayLabel, DAYS, getName } from "./timetableUi";

const { Text } = Typography;

const TimetableCell = ({ entry, readOnly, onAdd, onEdit, onDelete }) => {
    if (!entry) {
        return readOnly ? <Text type="secondary">Free</Text> : <Button size="small" icon={<PlusOutlined />} onClick={onAdd}>Add Period</Button>;
    }
    const isNonTeaching = ["break", "lunch", "assembly"].includes(entry.type);
    return (
        <Card size="small" className="shadow-sm" styles={{ body: { padding: 10 } }}>
            <Space direction="vertical" size={4} className="w-full">
                <Space wrap>
                    <Tag color={isNonTeaching ? "gold" : "blue"}>{isNonTeaching ? entry.type : getName(entry.subjectId, "Subject")}</Tag>
                    {entry.roomId ? <Tag color="purple">{getName(entry.roomId)}</Tag> : null}
                </Space>
                {!isNonTeaching && entry.teacherId ? (
                    <Space size={6}><Avatar size="small" src={entry.teacherId.avatar}>{getName(entry.teacherId, "T")[0]}</Avatar><Text>{getName(entry.teacherId)}</Text></Space>
                ) : <Text type="secondary">{entry.note || "No note"}</Text>}
                {!readOnly ? <Space size={4}><Button size="small" icon={<EditOutlined />} onClick={onEdit}>Edit</Button><Button size="small" danger icon={<DeleteOutlined />} onClick={onDelete}>Delete</Button></Space> : null}
            </Space>
        </Card>
    );
};

export default function TimetableGrid({ timeSlots = [], entries = [], readOnly = false, onAdd, onEdit, onDelete }) {
    const grid = buildGrid(entries);
    const today = DAYS[new Date().getDay() - 1];
    if (!timeSlots.length) return <Empty description="Create time slots to start building the timetable" />;
    const columns = [
        { title: "Time", dataIndex: "slot", fixed: "left", width: 180, render: (slot) => <Space direction="vertical" size={0}><Text strong>{slot.name}</Text><Text type="secondary">{slot.startTime} - {slot.endTime}</Text></Space> },
        ...DAYS.map((day) => ({
            title: <Space><CalendarOutlined />{dayLabel(day)}{today === day ? <Tag color="green">Today</Tag> : null}</Space>,
            dataIndex: day,
            className: today === day ? "bg-green-50" : "",
            render: (_, row) => <TimetableCell entry={grid[row.slot._id]?.[day]} readOnly={readOnly} onAdd={() => onAdd?.({ dayOfWeek: day, timeSlotId: row.slot._id })} onEdit={() => onEdit?.(grid[row.slot._id]?.[day])} onDelete={() => onDelete?.(grid[row.slot._id]?.[day])} />,
        })),
    ];
    return <Table rowKey={(row) => row.slot._id} columns={columns} dataSource={timeSlots.map((slot) => ({ slot }))} pagination={false} scroll={{ x: 1100 }} bordered />;
}
