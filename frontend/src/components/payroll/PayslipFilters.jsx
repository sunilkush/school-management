import React from "react";
import { Button, DatePicker, Form, Select, Space } from "antd";
import { DownloadOutlined, FileSearchOutlined, ReloadOutlined } from "@ant-design/icons";

const PayslipFilters = ({ monthValue, onMonthChange, employeeOptions, employeeId, setEmployeeId, onRefresh, onFetch, onPrint, loading }) => (
  <Form layout="inline">
    <Form.Item label="Month">
      <DatePicker picker="month" value={monthValue} onChange={onMonthChange} />
    </Form.Item>
    <Form.Item label="Employee">
      <Select
        showSearch
        optionFilterProp="label"
        style={{ minWidth: 300 }}
        value={employeeId}
        onChange={setEmployeeId}
        options={employeeOptions}
        placeholder="Select employee"
      />
    </Form.Item>
    <Space>
      <Button icon={<ReloadOutlined />} onClick={onRefresh}>Refresh</Button>
      <Button type="primary" icon={<FileSearchOutlined />} onClick={onFetch} loading={loading}>Fetch</Button>
      <Button icon={<DownloadOutlined />} onClick={onPrint}>Print / Download</Button>
    </Space>
  </Form>
);

export default PayslipFilters;
