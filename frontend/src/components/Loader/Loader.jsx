import { Spin, Typography } from "antd";

const { Title } = Typography;

const Loader = () => (
  <div className="flex flex-col justify-center items-center h-screen gap-4">
    
    {/* Logo */}
    <Title level={3} className="!m-0">
      School ERP
    </Title>

    {/* Loader */}
    <Spin size="large" />

  </div>
);

export default Loader;