import React from "react";
import { Button, DatePicker, Space, Tooltip } from "antd";
import { CheckOutlined, LockOutlined, ReloadOutlined } from "@ant-design/icons";

const PayrollHeaderActions = ({
  selectedMonth,
  onMonthChange,
  onRefresh,
  onGenerate,
  onLock,
  onPay,
  loading,
  actionLoading,
  permissions,
}) => (
  <Space wrap>
    <DatePicker picker="month" value={selectedMonth} onChange={onMonthChange} />
    <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
      Refresh
    </Button>

   <Tooltip title={permissions.canGenerate ? "" : "No permission or cycle is locked/paid"}>
      <Button type="primary" onClick={onGenerate} loading={actionLoading.generate} disabled={!permissions.canGenerate}>
        {selectedMonth ? "Generate / Refresh" : "Generate"}
      </Button>
    </Tooltip>

    <Tooltip title={permissions.canLock ? "" : "Only draft cycle can be locked"}>
      <Button icon={<LockOutlined />} onClick={onLock} loading={actionLoading.lock} disabled={!permissions.canLock}>
        Lock
      </Button>
    </Tooltip>

    <Tooltip title={permissions.canPay ? "" : "Only locked cycle can be paid"}>
      <Button icon={<CheckOutlined />} onClick={onPay} loading={actionLoading.pay} disabled={!permissions.canPay}>
        Mark Paid
      </Button>
    </Tooltip>
  </Space>
);

export default PayrollHeaderActions;
