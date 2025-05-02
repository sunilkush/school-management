import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { registerSchool } from "../store/schoolRegisterSlice";

// Material Tailwind components
import {
  Card,
  Input,
  Button,
  CardBody,
  CardHeader,
  Typography,
  Checkbox,
} from "@material-tailwind/react";

const SchoolRegister = () => {
  
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.schoolRegister || {});

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    email: "",
    phone: "",
    website: "",
    isActive: true,
  });

  

  useEffect(() => {
    if (status === "succeeded") {
      toast.success("School registered successfully!");
      setFormData({
        name: "",
        address: "",
        email: "",
        phone: "",
        website: "",
        isActive: true,
      });
    }
    if (status === "failed") {
      toast.error(error || "Registration failed.");
    }
  }, [status, error]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("name", formData.name);
    data.append("address", formData.address);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("website", formData.website);
    data.append("isActive", formData.isActive);
    

    dispatch(registerSchool(data));
  };

  return (
    <section className="px-8 bg-blue-gray-800 min-h-screen">
      <div className="container mx-auto grid place-items-center py-10">
        <Card shadow={false} className="md:px-24 md:py-14 py-8 border border-gray-300 w-full max-w-3xl">
          <CardHeader shadow={false} floated={false} className="text-center">
            <Typography variant="h2" color="blue-gray" className="mb-2">
              Register School
            </Typography>
            <Typography className="!text-gray-600 text-[18px] font-normal">
              Quickly add a new school to your platform.
            </Typography>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700">School Name</label>
                <Input name="name" value={formData.name} onChange={handleChange} type="text" placeholder="Enter name" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <Input name="address" value={formData.address} onChange={handleChange} type="text" placeholder="Enter address" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <Input name="email" value={formData.email} onChange={handleChange} type="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} type="text" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <Input name="website" value={formData.website} onChange={handleChange} type="text" />
              </div>

              <div>
                <Checkbox
                  label="Is Active"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Registering..." : "Register School"}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </section>
  );
};

export default SchoolRegister;
