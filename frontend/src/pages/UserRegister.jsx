import { Card } from "antd";
import RegisterForm from "../components/forms/RegisterForm";

const UserRegister = () => {
  return (
    <div className="flex justify-center p-4">
      <Card className="center-card-sm">
        <RegisterForm />
      </Card>
    </div>
  );
};

export default UserRegister;
