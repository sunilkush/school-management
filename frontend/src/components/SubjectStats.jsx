

import React from 'react';
import { Info, GraduationCap } from 'lucide-react';

const subjects = [
  { name: 'Maths', value: 20, color: 'bg-blue-600' },
  { name: 'Physics', value: 35, color: 'bg-cyan-400' },
  { name: 'Chemistry', value: 45, color: 'bg-blue-500' },
  { name: 'Botany', value: 60, color: 'bg-green-500' },
  { name: 'English', value: 70, color: 'bg-yellow-400' },
  { name: 'Spanish', value: 75, color: 'bg-red-500' },
  { name: 'Japanese', value: 90, color: 'bg-blue-700' },
];

const SubjectStats = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Subjects</h2>
        <div className="flex items-center text-sm text-gray-500 space-x-1">
          <GraduationCap size={16} />
          <span>Class II</span>
        </div>
      </div>

      <div className="bg-green-100 text-green-700 p-2 rounded-md text-sm flex items-start space-x-2 mb-4">
        <Info size={16} className="mt-0.5" />
        <span>
          These results are obtained from the syllabus completion on the respective class
        </span>
      </div>

      <div className="space-y-3">
        {subjects.map((subject) => (
          <div key={subject.name}>
            <div className="text-sm font-medium text-gray-700 mb-1">{subject.name}</div>
            <div className="w-full h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${subject.color}`}
                style={{ width: `${subject.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectStats;
