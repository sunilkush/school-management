import React from 'react'

import AdmissionForm from '../../../components/forms/AdmissionForm'
import {  Typography } from 'antd';
const { Title, Text } = Typography;
const AddStudent = () => {
  return (
    <>
    <div style={{ marginBottom: 20 }}>
          <Title level={4}>Admission Form</Title>
          <Text type="secondary">Fill in the details to admit a new student</Text>
        </div>
      <AdmissionForm/>
    </>
  )
}

export default AddStudent