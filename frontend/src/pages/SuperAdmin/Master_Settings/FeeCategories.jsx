import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Card, Select, Table, Button, Modal, Form, Input, DatePicker, message } from "antd";
import dayjs from "dayjs";
import { Plus } from "lucide-react";

import { fetchSchools } from "../../../features/schoolSlice.js";
import { fetchActiveAcademicYear } from "../../../features/academicYearSlice.js";

import { fetchAllFees, createFee } from "../../../features/feesSlice.js";

const { Option } = Select;

const FeeCategories = () => {

  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const { schools } = useSelector(s => s.school);
  const { activeYear } = useSelector(s => s.academicYear);
  const { feesList, loading } = useSelector(s => s.fees);

  const [schoolId, setSchoolId] = useState(null);
  const [academicYearId, setAcademicYearId] = useState(null);

  const [openModal,setOpenModal] = useState(false);
  const [submitting,setSubmitting] = useState(false);

  /* =========================
       LOAD SCHOOLS
  ========================= */
  useEffect(()=>{
    dispatch(fetchSchools());
  },[dispatch]);


  /* =========================
     WHEN ACADEMIC YEAR LOADS
  ========================= */
  useEffect(()=>{
     if(activeYear?._id){
        setAcademicYearId(activeYear._id);
     }
  },[activeYear]);


  /* =========================
      SCHOOL CHANGE
  ========================= */
  const handleSchoolChange = (id)=>{
     setSchoolId(id);
     setAcademicYearId(null);
     dispatch(fetchActiveAcademicYear(id));
  };


  /* =========================
      LOAD FEES
  ========================= */
  useEffect(()=>{
     if(schoolId && academicYearId){
        dispatch(fetchAllFees({ schoolId, academicYearId }));
     }
  },[schoolId, academicYearId,dispatch]);


  /* =========================
         SUBMIT
  ========================= */
  const handleSubmit = async(values)=>{
     try{

        setSubmitting(true);

        await dispatch(createFee({
            schoolId,
            academicYearId,
            feeName: values.feeName,
            amount: values.amount,
            dueDate: values.dueDate.toISOString()
        })).unwrap();

        setOpenModal(false);
        form.resetFields();

        message.success("✅ Fee Created");

        dispatch(fetchAllFees({ schoolId, academicYearId }));

     }
     catch(err){
        message.error("❌ Failed to create fee");
        console.error(err);
     }
     finally{
        setSubmitting(false);
     }
  };


  /* =========================
         TABLE
  ========================= */
  const columns = [
    {
      title:"Fee Name",
      dataIndex:"feeName",
    },
    {
      title:"Amount",
      dataIndex:"amount",
    },
    {
      title:"Due Date",
      render:r => dayjs(r.dueDate).format("DD MMM YYYY")
    }
  ];



  /* =========================
             UI
  ========================= */
  return (

    <div className="p-6 space-y-5 bg-gray-50">

      {/* ===== FILTER BAR ===== */}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">

          {/* SCHOOL */}
          <Select
            placeholder="Select School"
            value={schoolId}
            onChange={handleSchoolChange}
          >
            {schools?.map(s=>(
              <Option key={s._id} value={s._id}>{s.name}</Option>
            ))}
          </Select>


          {/* ACADEMIC YEAR */}
          <Select disabled value={academicYearId}>
            {activeYear && (
              <Option value={activeYear._id}>
                {activeYear.name}
              </Option>
            )}
          </Select>


          <Button
            type="primary"
            icon={<Plus size={18}/>}
            disabled={!schoolId || !academicYearId}
            onClick={()=>setOpenModal(true)}
          >
            Add Fees
          </Button>

        </div>
      </Card>



      {/* ===== FEES TABLE ===== */}
      <Card title="School Fees">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={feesList}
          loading={loading}
        />
      </Card>



      {/* ===== MODAL ===== */}
      <Modal
        title="Create School Fee"
        open={openModal}
        onCancel={()=>setOpenModal(false)}
        onOk={()=>form.submit()}
        confirmLoading={submitting}
        okText="Create Fee"
      >

        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          
          <Form.Item
            label="Fee Name"
            name="feeName"
            rules={[{ required:true }]}
          >
            <Input placeholder="Ex - Admission Fee"/>
          </Form.Item>

          <Form.Item
            label="Due Amount"
            name="amount"
            rules={[{ required:true }]}
          >
            <Input type="number"/>
          </Form.Item>

          <Form.Item
            label="Due Date"
            name="dueDate"
            rules={[{ required:true }]}
          >
            <DatePicker className="w-full"/>
          </Form.Item>

        </Form>
      </Modal>

    </div>
  );
};

export default FeeCategories;
