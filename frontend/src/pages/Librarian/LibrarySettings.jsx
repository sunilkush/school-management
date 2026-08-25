import React, { useEffect } from "react";
import {
  Button, Col, Form, InputNumber, Row, Spin, Switch, message,
} from "antd";
import {
  BookOutlined, SaveOutlined, SettingOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchLibrarySettings, updateLibrarySettings,
} from "../../features/librarySlice";
import PageHeader from "../../components/layout/PageHeader";
import { pageWrapper, sectionPanel } from "../../styles/pageStyles";

const Section = ({ title, children }) => (
  <div style={{ ...sectionPanel, marginBottom: 20 }}>
    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)", paddingBottom: 10 }}>
      {title}
    </div>
    {children}
  </div>
);

const FieldLabel = ({ label, hint }) => (
  <div>
    <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
    {hint && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{hint}</div>}
  </div>
);

const LibrarySettings = () => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { settings, settingsLoading, actionLoading } = useSelector((s) => s.library || {});

  useEffect(() => {
    dispatch(fetchLibrarySettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        maxBooksPerStudent:     settings.maxBooksPerStudent ?? 3,
        maxBooksPerTeacher:     settings.maxBooksPerTeacher ?? 5,
        maxBooksPerStaff:       settings.maxBooksPerStaff   ?? 3,
        maxDaysToReturnStudent: settings.maxDaysToReturnStudent ?? 15,
        maxDaysToReturnTeacher: settings.maxDaysToReturnTeacher ?? 30,
        gracePeriodDays:        settings.gracePeriodDays ?? 0,
        finePerDay:             settings.finePerDay ?? 5,
        maxFinePerBook:         settings.maxFinePerBook ?? 500,
        lostBookFine:           settings.lostBookFine ?? 500,
        damagedBookFine:        settings.damagedBookFine ?? 200,
        allowReservation:       settings.allowReservation ?? true,
        autoMarkOverdue:        settings.autoMarkOverdue ?? true,
        autoSendReminders:      settings.autoSendReminders ?? false,
      });
    }
  }, [settings, form]);

  const handleSave = async (values) => {
    try {
      await dispatch(updateLibrarySettings(values)).unwrap();
      message.success("Library settings saved");
    } catch (e) {
      message.error(e || "Unable to save settings");
    }
  };

  if (settingsLoading) {
    return (
      <div style={{ ...pageWrapper, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div style={pageWrapper}>
      <PageHeader
        title="Library Settings"
        subtitle="Configure issue limits, fine rules, and feature toggles"
        icon={<SettingOutlined />}
      />

      <Form form={form} layout="vertical" onFinish={handleSave}>
        {/* ── Issue Limits ─────────────────────────────────────────── */}
        <Section title="Book Issue Limits">
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="maxBooksPerStudent" label={<FieldLabel label="Max Books per Student" hint="How many books a student can hold" />} rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: "100%" }} addonAfter="books" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="maxBooksPerTeacher" label={<FieldLabel label="Max Books per Teacher" hint="How many books a teacher can hold" />} rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: "100%" }} addonAfter="books" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="maxBooksPerStaff" label={<FieldLabel label="Max Books per Staff" hint="How many books staff can hold" />} rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: "100%" }} addonAfter="books" />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Return Period ─────────────────────────────────────────── */}
        <Section title="Return Period">
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="maxDaysToReturnStudent" label={<FieldLabel label="Student Return Period" hint="Days allowed before a fine is applied" />} rules={[{ required: true }]}>
                <InputNumber min={1} max={90} style={{ width: "100%" }} addonAfter="days" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="maxDaysToReturnTeacher" label={<FieldLabel label="Teacher Return Period" hint="Days allowed for teachers" />} rules={[{ required: true }]}>
                <InputNumber min={1} max={90} style={{ width: "100%" }} addonAfter="days" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="gracePeriodDays" label={<FieldLabel label="Grace Period" hint="Extra days before fine starts (0 = no grace)" />} rules={[{ required: true }]}>
                <InputNumber min={0} max={14} style={{ width: "100%" }} addonAfter="days" />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Fine Rules ────────────────────────────────────────────── */}
        <Section title="Fine Rules">
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="finePerDay" label={<FieldLabel label="Fine per Overdue Day" hint="Amount charged for each overdue day" />} rules={[{ required: true }]}>
                <InputNumber min={0} max={1000} style={{ width: "100%" }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="maxFinePerBook" label={<FieldLabel label="Max Fine per Book" hint="Overdue fine will not exceed this amount" />} rules={[{ required: true }]}>
                <InputNumber min={0} max={10000} style={{ width: "100%" }} addonBefore="₹" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="lostBookFine" label={<FieldLabel label="Lost Book Fine" hint="Fixed fine when book is reported lost" />} rules={[{ required: true }]}>
                <InputNumber min={0} max={10000} style={{ width: "100%" }} addonBefore="₹" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="damagedBookFine" label={<FieldLabel label="Damaged Book Fine" hint="Fixed fine for returned damaged books" />} rules={[{ required: true }]}>
                <InputNumber min={0} max={10000} style={{ width: "100%" }} addonBefore="₹" />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Feature Toggles ───────────────────────────────────────── */}
        <Section title="Feature Toggles">
          <Row gutter={[20, 0]}>
            <Col xs={24} sm={8}>
              <Form.Item name="autoMarkOverdue" label={<FieldLabel label="Auto-mark Overdue" hint="Automatically update status when due date passes" />} valuePropName="checked">
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="allowReservation" label={<FieldLabel label="Allow Reservations" hint="Let students reserve books currently on loan" />} valuePropName="checked">
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="autoSendReminders" label={<FieldLabel label="Due Date Reminders" hint="Send notifications before due date" />} valuePropName="checked">
                <Switch checkedChildren="On" unCheckedChildren="Off" />
              </Form.Item>
            </Col>
          </Row>
        </Section>

        {/* ── Save ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
          <Button onClick={() => dispatch(fetchLibrarySettings())}>Reset</Button>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={actionLoading}>
            Save Settings
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default LibrarySettings;
