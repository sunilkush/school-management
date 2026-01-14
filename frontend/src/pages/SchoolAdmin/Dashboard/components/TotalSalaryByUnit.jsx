import React, { useState } from "react";
import { Card, Typography, Radio, Space, Tag } from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const { Title } = Typography;

const chartData = [
  { month: "Jan", Sales: 60, Marketing: -60 },
  { month: "Feb", Sales: 50, Marketing: -40 },
  { month: "Mar", Sales: 60, Marketing: -50 },
  { month: "Apr", Sales: 70, Marketing: -30 },
  { month: "May", Sales: 60, Marketing: -50 },
  { month: "Jun", Sales: 80, Marketing: -45 },
  { month: "Jul", Sales: 60, Marketing: -35 },
  { month: "Aug", Sales: 70, Marketing: -55 },
  { month: "Sep", Sales: 80, Marketing: -50 },
  { month: "Oct", Sales: 60, Marketing: -40 },
  { month: "Nov", Sales: 75, Marketing: -45 },
];

const TotalSalaryByUnit = () => {
  const [selected, setSelected] = useState("Sales");

  return (
    <Card bordered={false}>
      {/* Header */}
      <Space
        align="center"
        style={{ width: "100%", justifyContent: "space-between" }}
      >
        <Title level={5} style={{ margin: 0 }}>
          Total Salary by Unit
        </Title>

        <Space>
          <Radio.Group
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            size="small"
          >
            <Radio.Button value="Sales">Sales</Radio.Button>
            <Radio.Button value="Marketing">Marketing</Radio.Button>
          </Radio.Group>

          <Tag color="default">Daily</Tag>
        </Space>
      </Space>

      {/* Chart */}
      <div style={{ marginTop: 24 }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" />
            <YAxis domain={[-100, 100]} />
            <Tooltip />

            {selected === "Sales" && (
              <Bar
                dataKey="Sales"
                fill="#1677ff"
                radius={[6, 6, 0, 0]}
              />
            )}

            {selected === "Marketing" && (
              <Bar
                dataKey="Marketing"
                fill="#69b1ff"
                radius={[6, 6, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TotalSalaryByUnit;
