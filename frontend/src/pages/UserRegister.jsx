import { Card } from "antd";
import RegisterForm from "../components/forms/RegisterForm";

const UserRegister = () => {
  return (
    <div style={{ padding: 16, display: "flex", justifyContent: "center" }}>
      <Card style={{ width: "100%", maxWidth: 520 }}>
        <RegisterForm />
      </Card>
    </div>
  );
};

export default UserRegister;
