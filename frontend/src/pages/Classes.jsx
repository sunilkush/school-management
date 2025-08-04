import React, { useEffect, useState } from 'react';
import ClassForm from '../components/forms/ClassForm';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllClasses } from '../features/classes/classSlice';



function Classes() {
  const dispatch = useDispatch();
  const classList = useSelector((state) => state.class?.classList || []);
  const [isOpen, setIsOpen] = useState(false);
  console.log(classList)
  useEffect(() => {
    dispatch(fetchAllClasses());
  }, [dispatch]);

  return (
    <>
      <ClassForm isOpen={isOpen} />
      <div className='w-full bg-white p-4 border rounded-lg'>
        <div className='grid grid-cols-2 gap-4 items-center'>
          <div><h4 className='text-xl font-bold'>Class List</h4></div>
          
          <div><button
            onClick={() => setIsOpen(true)}
            className="px-3 py-2 bg-light-blue-600 rounded-lg text-white hover:bg-blue-700 float-end inline-block"
          >
            Add New Class
          </button></div>
        </div>

        <table className="w-full mt-4 border">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Class Name</th>
              <th className="p-2 border">Section</th>
              <th className="p-2 border">Teacher Name</th>
              <th className='p-2 border'>Subjects</th>
            </tr>
          </thead>
          <tbody>
            {classList.map((cls, index) => (
              <tr key={index}>
                <td className="border p-4">{cls.name}</td>
                <td className="border p-4">{cls.section}</td>
                <td className="border p-4 capitalize">{cls.teacherId.name}</td>
                <td className='border p-4'>
                  <ul>
                  {cls.subjects.map(
                  (item)=><span className="capitalize inline-flex" key={item._id}>{item.name}, </span>
                )}
                </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default Classes;
