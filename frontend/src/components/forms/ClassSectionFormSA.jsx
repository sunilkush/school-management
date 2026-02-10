import { useEffect } from "react";
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Divider,
  Space,
  InputNumber,
  Typography,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import { createClass, updateClass } from "../../features/classSlice";
import { fetchSection } from "../../features/sectionSlice";
import { fetchAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;
const { Title, Text } = Typography;

const ClassFormSA = ({ initialData, onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { sectionList = [] } = useSelector((s) => s.section);
  const { subjects = [] } = useSelector((s) => s.subject);
  const { users = [], user } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const role = user?.role?.name;

  const activeTeachers = users.filter(
    (u) => u.role?.name === "Teacher" && u.isActive
  );

  /* ============================
     LOAD MASTER DATA
  ============================ */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSection({ schoolId }));
    dispatch(fetchAllSubjects({ schoolId }));
    dispatch(fetchAllUser(schoolId));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [schoolId, dispatch]);

  /* ============================
     PREFILL EDIT MODE
  ============================ */
  useEffect(() => {
  if (!initialData || !activeYear) return;

  form.setFieldsValue({
    name: initialData.name || "",
    code: initialData.code || "",
    academicYearId: initialData.academicYearId?._id || activeYear?._id || "",
    isGlobal: initialData.isGlobal ?? false,
    isActive: initialData.isActive ?? true,

    // Fix Sections
    sections:
      initialData.sections?.map((s) => ({
        sectionId: s.sectionId?._id || "", // make sure we use sectionId._id
        teacherId: s.teacherId?._id || "", // teacher in charge
      })) || [{ sectionId: "", teacherId: "" }],

    // Fix Subjects
    subjects:
      initialData.subjects?.map((s) => ({
        subjectId: s.subjectId?._id || "",
        teacherId: s.teacherId?._id || "",
        periodPerWeek: s.periodPerWeek || 1,
        isCompulsory: s.isCompulsory ?? true,
      })) || [
        {
          subjectId: "",
          teacherId: "",
          periodPerWeek: 1,
          isCompulsory: true,
        },
      ],
  });
}, [initialData, activeYear, form]);


  /* ============================
     SUBMIT
  ============================ */
  const onFinish = async (values) => {
    const payload = {
      ...values,
      schoolId,
      classId: initialData?._id,
    };

    try {
      if (initialData) {
        await dispatch(
          updateClass({
            id: initialData._id,
            data: payload,
          })
        ).unwrap();
      } else {
        await dispatch(createClass(payload)).unwrap();
      }

      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card
       
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{padding:"0px"}}
        initialValues={{
          isActive: true,
          sections: [{ sectionId: "", teacherId: "" }],
          subjects: [
            {
              subjectId: "",
              teacherId: "",
              periodPerWeek: 1,
              isCompulsory: true,
            },
          ],
        }}
      >
        {/* ================= BASIC INFO ================= */}
        <Divider orientation="left" style={{marginTop:"0px"}}>Class Information</Divider>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item
              name="name"
              label="Class Name"
              rules={[{ required: true }]}
              style={{marginBottom:"0px"}}
            >
              <Input placeholder="e.g. Class 10" />
            </Form.Item>
          </Col>

          <Col md={12}>
            <Form.Item name="code" label="Class Code" style={{marginBottom:"0px"}}>
              <Input placeholder="e.g. X-A" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col md={12}>
            <Form.Item name="academicYearId" label="Academic Year" style={{marginBottom:"0px"}}>
              <Select disabled>
                {activeYear && (
                  <Option value={activeYear._id}>{activeYear.name}</Option>
                )}
              </Select>
            </Form.Item>
          </Col>

         
        </Row>

        {/* ================= SECTIONS ================= */}
        <Divider orientation="left">Sections</Divider>
       
        <Form.List name="sections" >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  className="mb-3"
                  title={`Section ${name + 1}`}
                  extra={
                    fields.length > 1 && (
                      <DeleteOutlined
                        onClick={() => remove(name)}
                        style={{ color: "red" }}
                      />
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col md={12}>
                      <Form.Item
                        name={[name, "sectionId"]}
                        label="Section"
                        rules={[{ required: true }]}
                        style={{marginBottom:"0px"}}
                      >
                        <Select placeholder="Select Section">
                          {sectionList.map((s) => (
                            <Option key={s._id} value={s._id}>
                              {s.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col md={12}>
                      <Form.Item
                        name={[name, "teacherId"]}
                        label="Section In-Charge"
                        style={{marginBottom:"0px"}}
                      >
                        <Select allowClear placeholder="Select Teacher">
                          {activeTeachers.map((t) => (
                            <Option key={t._id} value={t._id}>
                              {t.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ sectionId: "", teacherId: "" })}
              >
                Add Section
              </Button>
            </>
          )}
        </Form.List>

        {/* ================= SUBJECTS ================= */}
        <Divider orientation="left">Subjects</Divider>

        <Form.List name="subjects">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Card
                  key={key}
                  size="small"
                  className="mb-3"
                  title={`Subject ${name + 1}`}
                  extra={
                    fields.length > 1 && (
                      <DeleteOutlined
                        onClick={() => remove(name)}
                        style={{ color: "red" }}
                      />
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col md={8}>
                      <Form.Item
                        name={[name, "subjectId"]}
                        label="Subject"
                        rules={[{ required: true }]}
                        style={{marginBottom:"0px"}}
                      >
                        <Select placeholder="Select Subject">
                          {subjects.map((s) => (
                            <Option key={s._id} value={s._id}>
                              {s.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col md={8}>
                      <Form.Item
                        name={[name, "teacherId"]}
                        label="Teacher"
                        style={{marginBottom:"0px"}}
                      >
                        <Select allowClear placeholder="Select Teacher">
                          {activeTeachers.map((t) => (
                            <Option key={t._id} value={t._id}>
                              {t.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col md={4}>
                      <Form.Item
                        name={[name, "periodPerWeek"]}
                        label="Periods"
                        style={{marginBottom:"0px"}}
                      >
                        <InputNumber min={1} className="w-full" />
                      </Form.Item>
                    </Col>

                    <Col md={4}>
                      <Form.Item
                        name={[name, "isCompulsory"]}
                        label="Compulsory"
                        valuePropName="checked"
                        style={{marginBottom:"0px"}}
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    subjectId: "",
                    teacherId: "",
                    periodPerWeek: 1,
                    isCompulsory: true,
                  })
                }
              >
                Add Subject
              </Button>
            </>
          )}
        </Form.List>

        {/* ================= FLAGS ================= */}
        <Divider />

        <Space size="large">
          {role === "Super Admin" && (
            <Form.Item name="isGlobal" valuePropName="checked">
              <Switch checkedChildren="Global" />
            </Form.Item>
          )}

          <Form.Item name="isActive" valuePropName="checked" style={{marginBottom:"0px"}}>
            <Switch checkedChildren="Active"  />
          </Form.Item>
        </Space>

        {/* ================= ACTIONS ================= */}
        <Divider />

        <Row justify="end">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {initialData ? "Update Class" : "Create Class"}
            </Button>
          </Space>
        </Row>
      </Form>
    </Card>
  );
};

export default ClassFormSA;
