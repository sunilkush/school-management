import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSchools } from '../features/schools/schoolSlice';
import AddSchoolForm from '../components/forms/AddSchoolForm';

const Schools = () => {
  const dispatch = useDispatch();
  const { schools, loading, error } = useSelector((state) => state.school);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSchools());
  }, [dispatch]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">Schools</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg self-start justify-self-end hover:bg-blue-700 transition"
        >
          Add School
        </button>
      </div>

      <hr className="my-4" />

      {/* School List */}
      {loading ? (
        <p className="text-gray-600">Loading...</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {schools.map((school) => (
            <div
              key={school._id}
              className="border border-gray-300 p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-sm font-semibold text-blue-800">{school.name}</h2>
              <p className="text-sm text-gray-600 mb-1">{school.description}</p>
              <p className="text-sm">
                <span className="font-medium">Status:</span>{' '}
                <span
                  className={
                    school.isActive ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {school.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                Created: {new Date(school.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
            <h2 className="text-xl font-bold mb-4 text-blue-700">Add School</h2>
            <AddSchoolForm
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
