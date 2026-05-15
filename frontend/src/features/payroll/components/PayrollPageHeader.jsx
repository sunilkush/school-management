import { Breadcrumb, Typography } from "antd";
const { Title, Text } = Typography;
export default function PayrollPageHeader({ title, subtitle, items = [] }) { return <div className="mb-4"><Breadcrumb items={items} /><Title level={3} className="!mb-1">{title}</Title><Text type="secondary">{subtitle}</Text></div>; }
