import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchools } from '../features/schools/schoolSlice';

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-deep-purple-800">Schools</h1>

      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {schools.map((school) => (
            <div key={school._id} className="border border-gray-300 p-4 rounded-lg bg-white shadow-sm">
              <h2 className="text-xs font-semibold text-deep-purple-700">{school.name}</h2>
              <p className="text-sm text-gray-600 mb-1">{school.description}</p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span className={school.isActive ? 'text-green-600' : 'text-red-600'}>
                  {school.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Created : {new Date(school.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Schools;
