import React, { useState } from "react";
//import { useDispatch } from "react-redux";
/* import { updateGlobalConfig } from "../../../features/globalConfigSlice"; */
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const GlobalConfig = () => {
 // const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    schoolName: "",
    defaultAcademicYear: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    theme: "light",
    logo: "",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
   // dispatch(updateGlobalConfig(formData));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">🌍 Global Configuration</h1>

      <Card className="max-w-3xl">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium">School Name</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="Enter School Name"
              />
            </div>

            <div>
              <label className="block mb-2 font-medium">Default Academic Year</label>
              <input
                type="text"
                name="defaultAcademicYear"
                value={formData.defaultAcademicYear}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                placeholder="e.g., 2025-2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 font-medium">Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 font-medium">Date Format</label>
              <select
                name="dateFormat"
                value={formData.dateFormat}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Theme</label>
              <select
                name="theme"
                value={formData.theme}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 font-medium">Upload Logo</label>
              <input
                type="file"
                name="logo"
                onChange={handleChange}
                className="w-full border rounded-md p-2"
              />
            </div>

            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
              Save Configuration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GlobalConfig;
