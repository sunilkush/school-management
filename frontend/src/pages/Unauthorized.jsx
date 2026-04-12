import { Link } from "react-router-dom";
import { Result, Button } from "antd";

const Unauthorized = () => {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 16 }}>
      <Result
        status="403"
        title="Access Denied"
        subTitle="You do not have permission to view this page."
        extra={
          <Link to="/">
            <Button type="primary">Go to Dashboard</Button>
          </Link>
        }
      />
    </div>
  );
};

export default Unauthorized;
