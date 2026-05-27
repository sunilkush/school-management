import { Link } from "react-router-dom";
import { Result, Button } from "antd";

const Unauthorized = () => {
  return (
    <div className="page-center-shell">
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
