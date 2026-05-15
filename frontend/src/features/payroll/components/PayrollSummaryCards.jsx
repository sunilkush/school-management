import { Card, Col, Row, Statistic } from "antd";
export default function PayrollSummaryCards({ items=[] }){return <Row gutter={[16,16]}>{items.map((i)=><Col xs={24} sm={12} lg={8} xl={6} key={i.title}><Card><Statistic title={i.title} value={i.value ?? '-'} /></Card></Col>)}</Row>;}
