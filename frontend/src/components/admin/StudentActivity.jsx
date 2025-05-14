
import React from 'react';
import { CalendarDays } from 'lucide-react';

const activityData = [
  {
    id: 1,
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: '1st place in "Chess”',
    description: 'This event took place in Our School',
  },
  {
    id: 2,
    image: 'https://randomuser.me/api/portraits/men/36.jpg',
    title: 'Participated in "Carrom"',
    description: 'Justin Lee participated in "Carrom"',
  },
  {
    id: 3,
    image: 'https://randomuser.me/api/portraits/women/47.jpg',
    title: '1st place in "100M”',
    description: 'This event took place in Our School',
  },
  {
    id: 4,
    image: 'https://randomuser.me/api/portraits/men/52.jpg',
    title: 'International conference',
    description: 'We attended international conference',
  },
];

const StudentActivity = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Student Activity</h2>
        <div className="flex items-center text-sm text-gray-500 space-x-1">
          <CalendarDays size={16} />
          <span>This Month</span>
        </div>
      </div>

      <div className="space-y-3">
        {activityData.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 bg-gray-50 p-3 rounded-md"
          >
            <img
              src={activity.image}
              alt={activity.title}
              className="w-12 h-12 rounded-md object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-700">{activity.title}</h3>
              <p className="text-sm text-gray-500">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentActivity;
