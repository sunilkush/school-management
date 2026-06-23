import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Empty, Select } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import { fetchMyChildren } from "../../../features/studentPortalSlice";
import PageHeader from "../../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../../styles/pageStyles";

const ChildMessages = () => {
  const dispatch = useDispatch();
  const { children = [], loading } = useSelector((s) => s.studentPortal || {});
  const [selectedChildId, setSelectedChildId] = useState(null);

  useEffect(() => { dispatch(fetchMyChildren()); }, [dispatch]);

  useEffect(() => {
    if (!selectedChildId && children.length) setSelectedChildId(children[0].userId);
  }, [children, selectedChildId]);

  const selectedChild = children.find((c) => c.userId === selectedChildId);

  return (
    <>
      <PageHeader
        title="Child Messages"
        subtitle="View teacher notices and direct messages for your child."
        icon={<MessageOutlined />}
        extra={
          <Select
            placeholder="Select child"
            value={selectedChildId}
            onChange={setSelectedChildId}
            loading={loading}
            style={{ minWidth: 200 }}
            options={children.map((c) => ({ label: c.name, value: c.userId }))}
          />
        }
      />
      <div style={pageWrapper}>
        <div style={sectionPanel}>
          {!selectedChild ? (
            <Empty description="Select a child to view messages" />
          ) : (
            <Alert
              type="info"
              showIcon
              message="Messaging Coming Soon"
              description={`Messaging for ${selectedChild.name} will be available once parent-specific message APIs are enabled. This screen will show teacher notices and direct messages.`}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default ChildMessages;
