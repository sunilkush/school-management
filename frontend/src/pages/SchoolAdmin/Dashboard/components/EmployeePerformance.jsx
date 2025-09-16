import React from 'react';
import { Card, CardContent } from "../../../../components/UI/Card.jsx";
import { Button } from '../../../../components/UI/Button.jsx';

const employees = [
  {
    name: 'Henry, Arthur',
    email: 'sara.cruz@example.com',
    designation: 'Designer',
    performance: 'GOOD',
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
  {
    name: 'Cooper, Kristin',
    email: 'tanya.hill@example.com',
    designation: 'JS Developer',
    performance: 'AVERAGE',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Nguyen, Shane',
    email: 'holt@example.com',
    designation: 'React Developer',
    performance: 'GOOD',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    name: 'Black, Marvin',
    email: 'marvin.black@example.com',
    designation: 'UI Designer',
    performance: 'GOOD',
    avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
  },
];

const EmployeePerformance = () => {
  return (
    <Card className="">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Teacher Performance</h2>
            <select className="border px-2 py-1 rounded text-sm text-gray-600">
              <option>Last month</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="pb-2">NAME</th>
                  <th className="pb-2">DESIGNATION</th>
                  <th className="pb-2">PERFORMANCE</th>
                  <th className="pb-2">ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => (
                  <tr key={index} className="border-t text-gray-700">
                    <td className="py-3 flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </div>
                    </td>
                    <td>{emp.designation}</td>
                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          emp.performance === 'GOOD'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {emp.performance}
                      </span>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" className="text-xs px-2 py-0.5">
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
  );
};

export default EmployeePerformance;
