import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSchools } from "../store/schoolSlice.js";
const SchoolList = () => {
  const { schools } = useSelector((state) => state.schools || {})
  const dispatch = useDispatch() 

   useEffect(() => {
      dispatch(fetchSchools());
    }, [dispatch]);
  return (
    <div className="pt-6 px-4">
      <div className="w-full grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 xl:p-8 2xl:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">School List</h3>
              <span className="text-base font-normal text-gray-500">This is a list of the latest schools</span>
            </div>
            <div className="flex-shrink-0">
              <a href="#" className="text-sm font-medium text-cyan-600 hover:bg-gray-100 rounded-lg p-2">View all</a>
            </div>
          </div>
          <div className="flex flex-col mt-8">
            <div className="overflow-x-auto rounded-lg">
              <div className="align-middle inline-block min-w-full">
                <div className="shadow overflow-hidden sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Name</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone No.</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website Link</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {schools && schools.length > 0 ? (
                        schools.map((school, index) => (
                          <tr key={school._id || index}>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-900">{school.name}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-500">{school.email}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-900">{school.phone}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-gray-900">{school.address}</td>
                            <td className="p-4 whitespace-nowrap text-sm text-cyan-600">
                              <a href={school.website} target="_blank" rel="noopener noreferrer">{school.website}</a>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-sm text-gray-500">No schools available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> 
    </div>
  )
}

export default SchoolList
