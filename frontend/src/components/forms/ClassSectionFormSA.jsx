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
} from "antd";
import { Trash2, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createClass,
  updateClass,
} from "../../features/classSlice";
import { fetchSection } from "../../features/sectionSlice";
import { fetchAllSubjects } from "../../features/subjectSlice";
import { fetchAllUser } from "../../features/authSlice";
import { fetchActiveAcademicYear } from "../../features/academicYearSlice";

const { Option } = Select;

const ClassFormSA = ({ initialData, onSuccess, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const { sectionList = [] } = useSelector((s) => s.section);
  const { subjects = [] } = useSelector((s) => s.subject);
  const { users = [], user } = useSelector((s) => s.auth);
  const { activeYear } = useSelector((s) => s.academicYear);

  const schoolId = user?.school?._id;
  const role = user?.role?.name;

  /* ================= LOAD MASTER DATA ================= */
  useEffect(() => {
    if (!schoolId) return;
    dispatch(fetchSection({ schoolId }));
    dispatch(fetchAllSubjects({ schoolId }));
    dispatch(fetchAllUser({ schoolId }));
    dispatch(fetchActiveAcademicYear(schoolId));
  }, [schoolId, dispatch]);

  /* ================= EDIT MODE ================= */
  useEffect(() => {
    if (!initialData || !activeYear) return;

    form.setFieldsValue({
      name: initialData.name,
      code: initialData.code,
      academicYearId:
        initialData.academicYearId?._id ||
        initialData.academicYearId ||
        activeYear._id,
      teacherId: initialData.teacherId?._id || initialData.teacherId,
      isGlobal: initialData.isGlobal,
      isActive: initialData.isActive,
      sections: initialData.sections || [],
      subjects: initialData.subjects || [],
    });
  }, [initialData, activeYear, form]);

  /* ================= SUBMIT ================= */
  const onFinish = async (values) => {
    const payload = { ...values, schoolId };
    try {
      if (initialData) {
        await dispatch(updateClass({ id: initialData._id, data: payload })).unwrap();
      } else {
        await dispatch(createClass(payload)).unwrap();
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= UI ================= */
  return (
    <Card
      title={initialData ? "Edit Class" : "Create Class"}
      bordered
      style={{ padding: "0px" }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          isActive: true,
          sections: [{ sectionId: "", inChargeId: "" }],
          subjects: [
            { subjectId: "", teacherId: "", periodPerWeek: 1, isCompulsory: true },
          ],
        }}
      >
        {/* BASIC INFO */}
        <Divider orientation="left">Class Information</Divider>
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

          <Col md={12}>
            <Form.Item name="teacherId" label="Class Teacher" style={{marginBottom:"0px"}}>
              <Select allowClear>
                {users
                  .filter(
                    (u) => u.role?.name === "Teacher" && u.isActive
                  )
                  .map((t) => (
                    <Option key={t._id} value={t._id}>
                      {t.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* SECTIONS */}
        <Divider orientation="left">Sections</Divider>
        <Form.List name="sections">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Space key={key} align="baseline" className="mb-2">
                  <Form.Item
                    name={[name, "sectionId"]}
                    rules={[{ required: true }]}
                    style={{marginBottom:"0px"}}
                  >
                    <Select placeholder="Section" style={{ width: 150 }}>
                      {sectionList.map((s) => (
                        <Option key={s._id} value={s._id}>
                          {s.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name={[name, "inChargeId"]} style={{marginBottom:"0px"}}>
                    <Select placeholder="In-Charge" style={{ width: 180 }}>
                      {users
                        .filter(
                          (u) =>
                            u.role?.name === "Teacher" && u.isActive
                        )
                        .map((t) => (
                          <Option key={t._id} value={t._id}>
                            {t.name}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>

                  {fields.length > 1 && (
                    <Trash2
                      size={16}
                      className="text-red-500 cursor-pointer"
                      onClick={() => remove(name)}
                    />
                  )}
                </Space>
              ))}

              <Button
                type="dashed"
                icon={<Plus size={14} />}
                onClick={() => add({ sectionId: "", inChargeId: "" })}
              >
                Add Section
              </Button>
            </>
          )}
        </Form.List>

        {/* SUBJECTS */}
        <Divider orientation="left">Subjects</Divider>
        <Form.List name="subjects">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name }) => (
                <Row key={key} gutter={12} align="middle">
                  <Col md={8}>
                    <Form.Item
                      name={[name, "subjectId"]}
                      rules={[{ required: true }]}
                      style={{marginBottom:"0px"}}
                    >
                      <Select placeholder="Subject">
                        {subjects.map((s) => (
                          <Option key={s._id} value={s._id}>
                            {s.name}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col md={8}>
                    <Form.Item name={[name, "teacherId"]} style={{marginBottom:"0px"}}>
                      <Select placeholder="Teacher">
                        {users
                          .filter(
                            (u) =>
                              u.role?.name === "Teacher" && u.isActive
                          )
                          .map((t) => (
                            <Option key={t._id} value={t._id}>
                              {t.name}
                            </Option>
                          ))}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col md={8}>
                    <Form.Item name={[name, "periodPerWeek"]} style={{marginBottom:"0px"}}>
                      <InputNumber min={1} placeholder="Periods"  />
                    </Form.Item>
                  </Col>

                  <Col md={8}>
                    <Form.Item
                      name={[name, "isCompulsory"]}
                      valuePropName="checked" style={{marginBottom:"0px"}}
                    >
                      <Switch checkedChildren="Compulsory" />
                    </Form.Item>
                  </Col>

                  <Col md={8}>
                    {fields.length > 1 && (
                      <Trash2
                        size={16}
                        className="text-red-500 cursor-pointer"
                        onClick={() => remove(name)}
                      />
                    )}
                  </Col>
                </Row>
              ))}

              <Button
                type="dashed"
                icon={<Plus size={14} />}
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

        {/* FLAGS */}
        <Divider />
        <Space>
          {role === "Super Admin" && (
            <Form.Item
              name="isGlobal"
              valuePropName="checked"
            >
              <Switch checkedChildren="Global" />
            </Form.Item>
          )}

          <Form.Item
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="Active" />
          </Form.Item>
        </Space>

        {/* ACTIONS */}
        <div className="flex justify-end mt-4">
          <Space>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {initialData ? "Update Class" : "Create Class"}
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default ClassFormSA;
