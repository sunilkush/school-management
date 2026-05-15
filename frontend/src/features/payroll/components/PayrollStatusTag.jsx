import { Tag } from "antd";
const map={Draft:'default',Processing:'processing','Pending Approval':'warning',Approved:'success',Paid:'blue',Locked:'magenta',Active:'success',Inactive:'default'};
export default function PayrollStatusTag({status}){return <Tag color={map[status]||'default'}>{status||'Unknown'}</Tag>;}
