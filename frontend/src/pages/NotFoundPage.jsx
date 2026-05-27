import React from "react";
import { Result, Button, Typography } from "antd";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="page-center-shell-flex">
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you are looking for does not exist."
        extra={[
          <Button
            type="primary"
            key="home"
            onClick={() => navigate("/")}
          >
            Go to Dashboard
          </Button>,
          <Button
            key="back"
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>,
        ]}
      >
        <Text type="secondary">
          The page might have been removed, renamed, or is temporarily unavailable.
        </Text>
      </Result>
    </div>
  );
};

export default NotFoundPage;
