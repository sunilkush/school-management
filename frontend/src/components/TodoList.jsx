// /src/components/TodoList.jsx

import React from 'react';

const todos = [
  { id: 1, title: 'Send Reminder to Students', time: '01:00 PM', status: 'Completed' },
  { id: 2, title: 'Create Routine to new staff', time: '04:50 PM', status: 'Inprogress' },
  { id: 3, title: 'Extra Class Info to Students', time: '04:55 PM', status: 'Yet To Start' },
  { id: 4, title: 'Fees for Upcoming Academics', time: '04:55 PM', status: 'Yet To Start' },
  { id: 5, title: 'English - Essay on Visit', time: '05:55 PM', status: 'Yet To Start' },
];

const statusClasses = {
  Completed: 'text-green-600 bg-green-100',
  Inprogress: 'text-cyan-600 bg-cyan-100',
  'Yet To Start': 'text-yellow-600 bg-yellow-100',
};

const TodoList = () => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Todo</h2>
        <span className="text-sm text-gray-500">Today</span>
      </div>
      <ul className="space-y-4">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <input type="checkbox" className="mt-1 w-4 h-4 text-blue-500" defaultChecked={todo.status === 'Completed'} />
              <div>
                <p className={`text-sm ${todo.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {todo.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{todo.time}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusClasses[todo.status]}`}>
              {todo.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
