import React from 'react';
import { Card, CardContent } from "../../components/UI/Card";
const EmployeeStructure = () => {
  return (
    <Card className="col-span-1">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">School Structure</h2>
          <div className="flex flex-col items-center">
            <div className="relative w-44 h-44">
              <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3.8"
                  fill="none"
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-teal-500"
                  stroke="currentColor"
                  strokeWidth="3.8"
                  strokeDasharray="65, 100"
                  fill="none"
                  d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                100%
              </div>
            </div>
            <div className="mt-6 w-full">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Student</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div className="bg-teal-500 h-2 rounded-full w-[65%]" />
              </div>
              <div className="flex justify-between text-sm mt-3 mb-1">
                <span className="text-gray-600">Teacher</span>
                <span>30%</span>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full">
                <div className="bg-teal-200 h-2 rounded-full w-[30%]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  );
};

export default EmployeeStructure;
