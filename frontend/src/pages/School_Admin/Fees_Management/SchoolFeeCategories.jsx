import React from "react";
import FeeHeadManager from "../../../components/fees/FeeHeadManager.jsx";

// School Admin is locked to their own school — no school picker.
const SchoolFeeCategories = () => <FeeHeadManager showSchoolPicker={false} />;

export default SchoolFeeCategories;
