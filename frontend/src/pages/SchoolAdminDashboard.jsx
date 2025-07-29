import React from 'react'
import { Users } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import data from '../utils/data'
import activitiesPerformance from '../utils/activitiesPerformance';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

function SchoolAdminDashboard() {
  return (  
    <>
      <div className='W-full  h-screen flex items-start justify-start rounded-lg '>
        <div className='w-full  mx-auto'>
          <h1 className='text-2xl font-bold mb-4'>School Admin Dashboard</h1>
          <p className='text-gray-700 mb-6'>Welcome to the School Admin Dashboard. Here you can manage school operations, view reports, and oversee administrative tasks.</p>
          <div className='grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4  gap-6'>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between '>
              <div className='flex px-2'>
                <h4 className='text-xl font-bold'><Users className='inline-flex mr-2'/>Total Students</h4>
              </div>
               <div>
                 <span className='text-2xl font-bold'>1200</span>
               </div>
            </div>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between '>
              <div className='flex px-2'>
                <h4 className='text-xl font-bold'><Users className='inline-flex mr-2'/>Total Teachers</h4>
              </div>
               <div>
                 <span className='text-2xl font-bold'>100</span>
               </div>
            </div>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between '>
              <div className='flex px-2'>
                <h4 className='text-xl font-bold'><Users className='inline-flex mr-2'/>Total Fees</h4>
              </div>
               <div>
                 <span className='text-2xl font-bold'>1200</span>
               </div>
            </div>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between '>
              <div className='flex px-2'>
                <h4 className='text-xl font-bold '><Users className='inline-flex mr-2'/>Total Expences</h4>
              </div>
               <div>
                 <span className='text-2xl font-bold'>1200</span>
               </div>
            </div>
              
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3  gap-6 mt-6'>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between'>

              <div className='flex-row min-w-full px-2'>
                <h4 className='text-xl font-bold'>Student Performance</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" fill="#4f46e5" name="Score (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between'>

              <div className='flex-row min-w-full px-2'>
                <h4 className='text-xl font-bold'>Activites Performance</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={activitiesPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="activity" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className='bg-white border p-4 rounded-lg  flex flex-row items-center justify-between'>

              <div className='flex-row min-w-full px-2'>
                <h4 className='text-xl font-bold'>Activites Performance</h4>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={activitiesPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="activity" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="score" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default SchoolAdminDashboard

