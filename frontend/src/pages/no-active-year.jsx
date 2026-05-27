import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Button, Card, Space, Typography } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { logoutUser } from "../features/authSlice";

const { Title, Text } = Typography;

const NoActiveYear = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const role = user?.role?.name;

  const handleGoToSettings = async () => {
    if (role !== "Super Admin") {
      await dispatch(logoutUser());
      navigate("/", { replace: true });
    } else {
      navigate("/settings");
    }
  };

  return (
    <div className="page-center-shell">
      <Card className="center-card-md">
        <Space direction="vertical" size={8}>
          <WarningOutlined className="warning-icon-lg" />
          <Title level={3} className="title-no-margin">No Active Academic Year</Title>
          <Text type="secondary">Please select or create an academic year to continue.</Text>
          <Text type="secondary">If you are a Super Admin, you can create it from Settings.</Text>
          <Button type="primary" onClick={handleGoToSettings} className="btn-top-gap">
            Go to Settings
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default NoActiveYear;
